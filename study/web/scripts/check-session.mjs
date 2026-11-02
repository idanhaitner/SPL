// Browser check for guided sessions. Run after `npm run build`.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { openCourse, startServer } from "./serve-out.mjs";

const { server, base } = await startServer();
const browser = await chromium.launch();
const failures = [];
const fail = (message) => failures.push(message);
const KEY = "study:systems-programming";

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await openCourse(context);
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

  // Back to a solved step still shows which leaf you are on.
  await page.getByRole("button", { name: /^(Next|Finish)$/ }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const ringed = await page.locator('.step-leaf[aria-current="step"]').evaluate((leaf) => ({ label: leaf.getAttribute("aria-label"), ring: getComputedStyle(leaf, "::before").content }));
  if (!ringed.label.includes("(done)") || ringed.ring === "none") fail("Back to a solved step does not mark the leaf you are on");

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
    value.read = [...new Set([...(value.read ?? []), "run-time-environment"])];
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
  await openCourse(phone);
  const small = await phone.newPage();
  await small.goto(`${base}/sessions/reactor/`, { waitUntil: "networkidle" });
  await small.getByRole("button", { name: "Start step 1" }).click();
  if (await small.locator(".step-stem").isVisible()) fail("The leaf stem shows at phone width");
  await small.getByRole("button", { name: "All steps" }).click();
  if ((await small.locator(".step-list button").count()) < 5) fail("The phone step list is empty");
  const overflow = await small.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (overflow > 0) fail(`The session overflows sideways by ${overflow}px on a phone`);

  // The coding workspace, with the compiler answered by this script.
  const coding = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await openCourse(coding);
  const desk = await coding.newPage();
  let reply = "pass";
  await desk.route("**/godbolt.org/**", async (route) => {
    if (reply === "offline") return route.abort();
    if (reply === "busy") return route.fulfill({ status: 429, headers: { "Retry-After": "2", "access-control-allow-origin": "*", "access-control-expose-headers": "Retry-After" }, body: "" });
    if (reply === "loop") return route.fulfill({ json: { didExecute: true, code: 143, timedOut: true, stdout: [], stderr: [], buildResult: { stderr: [] } }, headers: { "access-control-allow-origin": "*" } });
    return route.fulfill({ json: { didExecute: true, code: 0, stdout: ["two positives", "negative and positive", "same value"].map((name) => ({ text: `PASS ${name}` })), stderr: [], buildResult: { stderr: [] } }, headers: { "access-control-allow-origin": "*" } });
  });
  await desk.goto(`${base}/sessions/pointers/?step=ex-swap-values`, { waitUntil: "networkidle" });
  const submit = desk.getByRole("button", { name: "Submit" });
  await submit.waitFor();
  await desk.locator(".cm-content").waitFor();
  const box = await submit.boundingBox();
  if (!box || box.y + box.height > 768) fail("Submit is below the fold at 1024x768");
  if ((await desk.locator(".question-title").boundingBox())?.y > 768) fail("The question is below the fold at 1024x768");
  await desk.locator(".cm-content").click();
  await desk.keyboard.press("ControlOrMeta+a");
  await desk.keyboard.insertText("int keepThis = 1;\n");
  await desk.waitForTimeout(700);
  for (const [state, text] of [["offline", "can't be reached"], ["busy", "Too many runs"], ["loop", "ran too long"]]) {
    reply = state;
    await desk.waitForTimeout(3200);
    await desk.locator(".results-body").waitFor();
    await desk.getByRole("button", { name: "Run", exact: true }).click();
    await desk.getByText(text).first().waitFor({ timeout: 6000 }).catch(() => fail(`No message for: ${state}`));
    if (!(await desk.locator(".cm-content").innerText()).includes("keepThis")) fail(`Code was lost after: ${state}`);
    await desk.waitForTimeout(state === "busy" ? 2600 : 0);
  }
  await desk.reload({ waitUntil: "networkidle" });
  await desk.locator(".cm-content").waitFor();
  if (!(await desk.locator(".cm-content").innerText()).includes("keepThis")) fail("Code was lost on reload");
  reply = "pass";
  await desk.waitForTimeout(100);
  await desk.getByRole("button", { name: "Submit" }).click();
  await desk.getByText("All tests pass.").waitFor({ timeout: 6000 }).catch(() => fail("A passing Submit shows no success"));
  if (await desk.getByRole("button", { name: /^(Next|Finish)$/ }).isDisabled()) fail("A passing Submit did not unlock Next");

  // Enter lines the next line up at the course's four spaces, and Cmd or Ctrl + S compiles.
  await desk.waitForTimeout(3200);
  await desk.locator(".cm-content").click();
  await desk.keyboard.press("ControlOrMeta+a");
  await desk.keyboard.press("Backspace");
  await desk.keyboard.type("void f() {");
  await desk.keyboard.press("Enter");
  await desk.keyboard.type("int a;");
  await desk.keyboard.press("Enter");
  await desk.keyboard.type("int b;");
  const typed = await desk.locator(".cm-line").allInnerTexts();
  if (typed[1] !== "    int a;" || typed[2] !== "    int b;") fail(`Enter did not align the next line: ${JSON.stringify(typed)}`);
  const compiled = desk.waitForRequest("**/godbolt.org/**", { timeout: 3000 }).catch(() => null);
  await desk.keyboard.press("ControlOrMeta+s");
  if (!(await compiled)) fail("Cmd+S did not compile");
  await desk.waitForTimeout(3200);

  // The function finder floats over the code, answers plain words, and closes on Esc.
  await desk.getByRole("button", { name: "Find a C++ function" }).click();
  await desk.getByRole("searchbox", { name: "What do you need to do?" }).fill("length of a string");
  const found = await desk.locator(".finder-name").allInnerTexts();
  if (!found.includes("std::strlen")) fail(`The finder did not find strlen: ${found.join(", ")}`);
  await desk.keyboard.press("Escape");
  if (await desk.locator(".finder-panel").count()) fail("Esc did not close the finder");
  if ((await desk.evaluate(() => document.activeElement?.getAttribute("aria-label"))) !== "Find a C++ function") fail("Closing the finder lost focus");

  // The keyboard can leave the editor: Esc, then Tab.
  await desk.locator(".cm-content").click();
  await desk.keyboard.press("Escape");
  await desk.keyboard.press("Tab");
  if (await desk.evaluate(() => document.activeElement?.classList.contains("cm-content"))) fail("Esc then Tab stays in the editor");

  // The divider moves by keyboard, and the phone layout has Question and Code tabs.
  const divider = desk.getByRole("separator", { name: "Resize the question and code panels" });
  const before = await divider.getAttribute("aria-valuenow");
  await divider.focus();
  await desk.keyboard.press("ArrowRight");
  if ((await divider.getAttribute("aria-valuenow")) === before) fail("The divider does not move by keyboard");
  const tiny = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await openCourse(tiny);
  const hand = await tiny.newPage();
  await hand.goto(`${base}/sessions/pointers/?step=ex-swap-values`, { waitUntil: "networkidle" });
  await hand.getByRole("tab", { name: "Code" }).click();
  const handSubmit = await hand.getByRole("button", { name: "Submit" }).boundingBox();
  if (!handSubmit || handSubmit.y + handSubmit.height > 844) fail("Submit is below the fold on a phone");
  await hand.getByRole("tab", { name: "Question" }).click();
  if (!(await hand.locator(".question-title").isVisible())) fail("The question tab is empty on a phone");
  if ((await hand.evaluate(() => document.documentElement.scrollWidth - innerWidth)) > 0) fail("The workspace overflows on a phone");

  // A new student's plant has one open leaf and buds for the rest, and later sessions are locked.
  const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const start = await fresh.newPage();
  await start.goto(`${base}/`, { waitUntil: "networkidle" });
  const buds = await start.locator(".gh-stem-wide .gh-leaf.is-locked").count();
  if (buds !== 15) fail(`A new student's plant has ${buds} buds, not 15`);
  if (!(await start.locator(".gh-stem-wide .gh-stem-ghost").count())) fail("The plant shows no line for where it will grow");
  await start.goto(`${base}/sessions/pointers/`, { waitUntil: "networkidle" });
  if (!(await start.locator(".locked-panel").count()) || (await start.getByRole("button", { name: "Start step 1" }).count())) fail("A locked chapter's session is open");
  await fresh.close();

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
