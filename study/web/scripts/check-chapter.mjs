// Browser check for every chapter, every section, at phone and desktop width, in both themes. Run after `npm run build`.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { startServer } from "./serve-out.mjs";

const slugs = fs.readdirSync(path.resolve("out/topics"));
const { server, base } = await startServer();
const browser = await chromium.launch();
const failures = [];

try {
  for (const [width, scheme] of [[1440, "light"], [390, "dark"], [320, "light"]]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, colorScheme: scheme });
    for (const slug of slugs) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
      await page.goto(`${base}/topics/${slug}/`, { waitUntil: "networkidle" });
      const buttons = page.locator("nav.parts button");
      const sections = Math.max(await buttons.count(), 1);
      for (let section = 0; section < sections; section += 1) {
        if (sections > 1) await buttons.nth(section).evaluate((button) => button.click());
        await page.waitForTimeout(40);
        const label = `${slug} section ${section + 1} at ${width}`;
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (overflow > 0) failures.push(`${label}: page overflows sideways by ${overflow}px`);
        const stuck = await page.evaluate(() => {
          const bad = [];
          for (const node of document.querySelectorAll(".reader-body pre, .reader-body table, .reader-body .math-display")) {
            if (node.getBoundingClientRect().right > innerWidth + 1 && !node.closest(".code-scroll, .table-wrap, .math-display, .blank-pre, .code-panel")) bad.push(node.tagName);
          }
          return bad;
        });
        if (stuck.length) failures.push(`${label}: ${stuck.join(", ")} runs off the screen`);
        if (sections > 1) {
          const current = await page.locator('nav.parts button[aria-current="location"]').count();
          if (current !== 1) failures.push(`${label}: the section stem marks ${current} sections as current`);
        }
      }
      if (errors.length) failures.push(`${slug} at ${width}: ${errors[0].slice(0, 120)}`);
      await page.close();
    }
    await context.close();
  }
  // Going through a chapter to its end records it as read.
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${base}/topics/run-time-environment/`, { waitUntil: "networkidle" });
  while (await page.getByRole("button", { name: "Continue", exact: true }).count()) await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Finish reading" }).click();
  await page.waitForTimeout(200);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("study:systems-programming")));
  if (!saved.read?.includes("run-time-environment")) failures.push("Finish reading did not record the chapter");
  await page.goto(`${base}/topics/pointers/#references`, { waitUntil: "networkidle" });
  const shown = await page.locator("#chapter-part h2").innerText();
  if (shown !== "References") failures.push(`a section link opened "${shown}"`);
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error(failures.map((line) => `- ${line}`).join("\n"));
  process.exit(1);
}
console.log(`Chapter check passed: ${slugs.length} chapters.`);
