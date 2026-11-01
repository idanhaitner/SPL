// Browser check for guided sessions. Run after `npm run build`.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { startServer } from "./serve-out.mjs";

const { server, base } = await startServer();
const browser = await chromium.launch();
const failures = [];
const fail = (message) => failures.push(message);
const KEY = "study:systems-programming";

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto(`${base}/sessions/run-time-environment/`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Start step 1" }).click();
  const skip = page.getByRole("button", { name: "Skip for now" });
  const first = await page.locator(".practice-title").innerText();

  // A wrong answer stays locked: try each choice until the check goes wrong.
  if ((await page.getByRole("button", { name: "Next", exact: true }).isDisabled()) !== true) fail("Next is open before answering");
  await skip.click();
  await page.waitForTimeout(50);
  const leaf = page.locator(".step-leaf").first();
  if (!(await leaf.getAttribute("aria-label")).includes("(skipped)")) fail("Skip did not mark the step as skipped");
  const second = await page.locator(".practice-title").innerText();
  if (second === first) fail("Skip did not move on");

  // A reload reopens the same step.
  await page.reload({ waitUntil: "networkidle" });
  if ((await page.locator(".practice-title").innerText()) !== second) fail("A reload lost the step");

  // Solving a step opens Next and turns its leaf lime.
  const stepId = await page.locator(".card.practice").getAttribute("id");
  await page.evaluate(([key, id]) => {
    const value = JSON.parse(localStorage.getItem(key) ?? '{"solved":[]}');
    value.solved.push(id);
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("study-progress"));
  }, [KEY, stepId]);
  await page.waitForTimeout(50);
  if (await page.getByRole("button", { name: /^(Next|Finish)$/ }).isDisabled()) fail("Next stayed locked on a solved step");
  if (!(await page.locator(".step-leaf").nth(1).getAttribute("aria-label")).includes("(done)")) fail("A solved step's leaf is not done");
  if (await skip.count()) fail("Skip still shows on a solved step");

  // A wrong answer shows rust and keeps the step open, on the first multiple-choice question found.
  const session = await context.newPage();
  await session.goto(`${base}/sessions/pointers/`, { waitUntil: "networkidle" });
  await session.getByRole("button", { name: "Start step 1" }).click();
  let tested = false;
  for (let step = 0; step < 12 && !tested; step += 1) {
    const radios = session.locator('.card.check input[type="radio"]');
    const count = await radios.count();
    if (count > 1) {
      const card = session.locator(".card.check").first();
      const inputs = card.locator('input[type="radio"]');
      for (let choice = 0; choice < (await inputs.count()); choice += 1) {
        await inputs.nth(choice).check({ force: true });
        await card.getByRole("button", { name: "Check" }).click();
        if (await card.locator(".check-result.is-no").count()) {
          if ((await card.locator(".choices .is-wrong").count()) !== 1) fail("A wrong answer is not marked");
          tested = true;
          break;
        }
      }
    }
    if (!tested) await session.getByRole("button", { name: "Skip for now" }).click();
  }
  if (!tested) fail("No wrong-answer state was reached");

  // Home's button returns to the session once the chapter is read.
  await page.evaluate(([key]) => {
    const value = JSON.parse(localStorage.getItem(key));
    value.read = ["run-time-environment"];
    value.last = "run-time-environment";
    localStorage.setItem(key, JSON.stringify(value));
  }, [KEY]);
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const href = await page.locator(".gh-hero .gh-btn").getAttribute("href");
  if (!href.includes("/sessions/run-time-environment")) fail(`Home's button goes to ${href}`);

  // An old link to a question lands on its step.
  await page.goto(`${base}/topics/pointers/#${await session.locator(".card.practice").getAttribute("id")}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  if (!page.url().includes("/sessions/pointers/?step=")) fail(`An old question link stayed at ${page.url()}`);

  // The finish screen leads to the next chapter.
  const finish = await context.newPage();
  await finish.goto(`${base}/sessions/networking/`, { waitUntil: "networkidle" });
  await finish.getByRole("button", { name: "Start step 1" }).click();
  while (await finish.getByRole("button", { name: "Skip for now" }).count()) await finish.getByRole("button", { name: "Skip for now" }).click();
  if (!(await finish.locator(".session-finish a.gh-btn").innerText()).startsWith("Next chapter")) fail("The finish screen has no next chapter");
  if ((await finish.locator(".session-open li").count()) === 0) fail("The finish screen does not list skipped steps");

  // Phones get the step list instead of the leaves.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const small = await phone.newPage();
  await small.goto(`${base}/sessions/reactor/`, { waitUntil: "networkidle" });
  await small.getByRole("button", { name: "Start step 1" }).click();
  if (await small.locator(".step-stem").isVisible()) fail("The leaf stem shows at phone width");
  await small.getByRole("button", { name: "All steps" }).click();
  if ((await small.locator(".step-list button").count()) < 5) fail("The phone step list is empty");
  const overflow = await small.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (overflow > 0) fail(`The session overflows sideways by ${overflow}px on a phone`);

  if (errors.length) fail(`Console: ${errors[0].slice(0, 160)}`);
  const sessions = fs.readdirSync(path.resolve("out/sessions")).length;
  if (sessions < 10) fail(`Only ${sessions} sessions were built`);
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error(failures.map((line) => `- ${line}`).join("\n"));
  process.exit(1);
}
console.log("Session check passed.");
