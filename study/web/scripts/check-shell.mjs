// Browser check for the top bar, course drawer, glossary, and 404 page. Run after `npm run build`.
import { chromium } from "playwright";
import { startServer } from "./serve-out.mjs";

const { server, base } = await startServer();
const browser = await chromium.launch();
const failures = [];
const fail = (message) => failures.push(message);
const GROUND = { light: "rgb(242, 247, 238)", dark: "rgb(11, 42, 32)" };

// Everything that must hold for the glossary and the 404, in one theme at one width.
async function checkPages(width, theme) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, colorScheme: theme });
  const page = await context.newPage();
  const where = `at ${width} in ${theme}`;
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const limes = () => page.locator("main").evaluate((main) => [...main.querySelectorAll("*")].filter((el) => getComputedStyle(el).backgroundColor === "rgb(183, 227, 107)").length);

  await page.goto(base + "/glossary/", { waitUntil: "networkidle" });
  const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (ground !== GROUND[theme]) fail(`glossary ${where}: page ground is ${ground}`);
  const sideways = await overflow();
  if (sideways > 0) fail(`glossary ${where}: page overflows sideways by ${sideways}px`);
  if ((await limes()) > 0) fail(`glossary ${where}: has a primary action`);
  // Wide screens pin the jump links; narrow ones fold them behind one control.
  const menu = page.locator(".glossary-menu summary");
  if (await menu.isVisible()) await menu.click();
  const jumps = await page.locator(".glossary-jump a:visible").count();
  if (jumps === 0) fail(`glossary ${where}: no jump links can be reached`);
  const small = await page.locator(".glossary-jump a:visible, .glossary-menu summary:visible, .glossary-term dt a").evaluateAll((links) => links.filter((link) => link.getBoundingClientRect().height < 44).length);
  if (small > 0) fail(`glossary ${where}: ${small} controls are shorter than 44px`);
  const opened = await overflow();
  if (opened > 0) fail(`glossary ${where}: page overflows sideways by ${opened}px with the jump links open`);

  const summary = await page.locator(".masthead-lede").innerText();
  const count = Number(summary.match(/^(\d+) terms?\b/)?.[1]);
  const anchors = await page.locator(".glossary-term").evaluateAll((terms) => terms.map((term) => term.id));
  if (!count || anchors.length !== count) fail(`glossary ${where}: the summary says "${summary}" but ${anchors.length} terms are listed`);
  if (new Set(anchors).size !== anchors.length || anchors.some((id) => !id)) fail(`glossary ${where}: term anchors are missing or repeated`);
  const dead = await page.locator(".glossary-jump a").evaluateAll((links) => links.filter((link) => !document.querySelector(`[id="${link.hash.slice(1)}"]`)).map((link) => link.hash));
  if (dead.length) fail(`glossary ${where}: jump links lead nowhere: ${dead.join(", ")}`);
  const firstJump = page.locator(".glossary-jump a:visible").first();
  const firstHash = await firstJump.evaluate((link) => link.hash);
  await firstJump.click();
  const jumped = await page.evaluate((hash) => {
    const target = document.querySelector(`[id="${hash.slice(1)}"]`);
    return { matches: location.hash === hash, top: target.getBoundingClientRect().top, height: innerHeight };
  }, firstHash);
  if (!jumped.matches || jumped.top < 0 || jumped.top >= jumped.height) fail(`glossary ${where}: the jump link ${firstHash} did not bring its chapter into view`);
  const unnamed = await page.locator(".glossary-chapter").evaluateAll((sections) => sections.filter((section) => !section.id.startsWith("glossary-")).length);
  if (unnamed > 0) fail(`glossary ${where}: ${unnamed} chapter groups lost their glossary-<topic> anchor`);

  // The form search results use. The last term forces a real scroll, and the pinned bar must not cover it.
  const anchor = anchors.at(-1);
  await page.goto(`${base}/glossary#${anchor}`, { waitUntil: "networkidle" });
  const landed = await page.evaluate((id) => {
    const target = document.getElementById(id);
    const bar = document.querySelector(".gh-topbar");
    const pinned = bar && getComputedStyle(bar).position === "sticky";
    return {
      top: target.getBoundingClientRect().top,
      floor: pinned ? bar.getBoundingClientRect().bottom : 0,
      targeted: target.matches(":target"),
      height: innerHeight,
    };
  }, anchor);
  if (!landed.targeted) fail(`glossary ${where}: #${anchor} is not the page's target`);
  if (landed.top < landed.floor || landed.top >= landed.height) fail(`glossary ${where}: #${anchor} landed at ${landed.top}px, outside ${landed.floor}-${landed.height}px`);

  const term = page.locator(`[id="${anchor}"] dt a`);
  const href = await term.getAttribute("href");
  await term.click();
  await page.waitForURL((url) => url.pathname.startsWith("/topics/"));
  if (!(await page.locator(".chapter-page h1").isVisible())) fail(`glossary ${where}: the term link ${href} did not open a chapter`);

  const response = await page.goto(base + "/no/such/page/", { waitUntil: "networkidle" });
  if (response.status() !== 404) fail(`404 ${where}: status is ${response.status()}`);
  const heading = await page.locator("h1").innerText();
  if (!/isn.t here/.test(heading)) fail(`404 ${where}: heading is "${heading}"`);
  const stray = await overflow();
  if (stray > 0) fail(`404 ${where}: page overflows sideways by ${stray}px`);
  const arches = await page.locator(".not-found .gh-arch").count();
  if (arches !== 2) fail(`404 ${where}: shows ${arches} arches`);
  const actions = await limes();
  if (actions !== 1) fail(`404 ${where}: has ${actions} primary actions, not 1`);
  const action = page.locator("a.gh-btn");
  if ((await action.boundingBox()).height < 44) fail(`404 ${where}: the action is shorter than 44px`);
  await action.click();
  await page.waitForURL(base + "/");
  await context.close();
}

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
      const rows = await drawer.locator("a.gh-row:not(.is-review)").count();
      if (rows !== 16) fail(`${label}: drawer lists ${rows} chapters, not 16`);
      const reviews = await drawer.locator("a.gh-row.is-review").count();
      if (reviews !== 6) fail(`${label}: drawer lists ${reviews} reviews, not 6`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(50);
      if (await drawer.isVisible()) fail(`${label}: Esc did not close the drawer`);
      const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
      if (focused !== "Course") fail(`${label}: focus went to "${focused}" after closing`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 0) fail(`${label}: page overflows sideways by ${overflow}px`);
      await context.close();
    }
    for (const theme of ["light", "dark"]) await checkPages(width, theme);
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
