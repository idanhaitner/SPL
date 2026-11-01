// Browser check for the top bar and course drawer. Run after `npm run build`.
import { chromium } from "playwright";
import { startServer } from "./serve-out.mjs";

const { server, base } = await startServer();
const browser = await chromium.launch();
const failures = [];
const fail = (message) => failures.push(message);

try {
  for (const width of [1440, 390]) {
    for (const route of ["/", "/topics/pointers/", "/glossary/"]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      await page.goto(base + route, { waitUntil: "networkidle" });
      const label = `${route} at ${width}`;
      if ((await page.locator("aside.rail").count()) > 0) fail(`${label}: the old sidebar is still there`);
      const button = page.getByRole("button", { name: "Course", exact: true });
      await button.click();
      const drawer = page.getByRole("dialog", { name: "Course" });
      if (!(await drawer.isVisible())) fail(`${label}: drawer did not open`);
      const rows = await drawer.locator("a.gh-row").count();
      if (rows !== 16) fail(`${label}: drawer lists ${rows} chapters, not 16`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(50);
      if (await drawer.isVisible()) fail(`${label}: Esc did not close the drawer`);
      const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
      if (focused !== "Course") fail(`${label}: focus went to "${focused}" after closing`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 0) fail(`${label}: page overflows sideways by ${overflow}px`);
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: "light" });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.goto(base + "/topics/pointers/", { waitUntil: "networkidle" });
  if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== "dark") fail("the theme choice did not carry to another page");
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error(failures.map((line) => `- ${line}`).join("\n"));
  process.exit(1);
}
console.log("Shell check passed.");
