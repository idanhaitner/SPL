// Browser check for the leaderboard: the name dialog, publishing, the board page, and the home line. Run after `npm run build`.
// It installs an in-memory board (window.__studyBoard) in place of Firestore, so it needs no Firebase project.
import { chromium } from "playwright";
import fs from "node:fs";
import { startServer } from "./serve-out.mjs";

const { server, base } = await startServer();
const browser = await chromium.launch();
const failures = [];
const fail = (message) => failures.push(message);
const KEY = "study:systems-programming";
const DAY = 86_400_000;
// A build with a Firebase config shows the leaderboard link; the cases about the switched-off leaderboard only apply without one.
const CONFIGURED = fs.readFileSync("out/index.html", "utf8").includes('/leaderboard/"');

// A browser context with a test board and, optionally, progress, a seed, and a player already stored.
async function open({ board = { rows: [] }, progress, seed, player, width = 1280, theme = "light" } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, colorScheme: theme });
  await context.addInitScript(({ board, progress, seed, player, KEY }) => {
    if (board && !window.__studyBoard) window.__studyBoard = board;
    if (progress && !localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(progress));
    if (seed && !localStorage.getItem(KEY + ":board-seed")) localStorage.setItem(KEY + ":board-seed", seed);
    if (player && !localStorage.getItem(KEY + ":player")) localStorage.setItem(KEY + ":player", JSON.stringify(player));
  }, { board, progress, seed, player, KEY });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

const dialog = (page) => page.locator("dialog.board-join[open]");
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
async function appears(locator, ms = 3000) {
  try {
    await locator.first().waitFor({ state: "visible", timeout: ms });
    return true;
  } catch {
    return false;
  }
}
async function staysAway(page, locator, ms = 2000) {
  await page.waitForTimeout(ms);
  return (await locator.count()) === 0;
}

// A friend who studied here before the leaderboard, and only ever opened a chapter, is asked on their next visit and lands on the board.
{
  const { context, page, errors } = await open({ progress: { solved: [], last: "memory-model", seen: ["memory-model"] } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (!(await appears(dialog(page)))) fail("existing student: the name dialog did not open on home");
  else {
    await page.getByLabel("Your name").fill("  Dana  ");
    await page.getByRole("button", { name: "Join", exact: true }).click();
    await page.waitForFunction(() => window.__studyBoard.rows.length === 1, null, { timeout: 4000 }).catch(() => {});
    const rows = await page.evaluate(() => window.__studyBoard.rows);
    if (rows.length !== 1 || rows[0].name !== "Dana" || rows[0].chapters !== 0) fail(`existing student: expected one row for Dana, got ${JSON.stringify(rows)}`);
    if (await dialog(page).count()) fail("existing student: the dialog stayed open after joining");
  }
  if (errors.length) fail(`existing student: page errors: ${errors.join("; ")}`);
  await context.close();
}

// A new student who has only opened a chapter is not asked yet.
{
  const { context, page } = await open({ seed: "new" });
  await page.goto(base + "/topics/run-time-environment/", { waitUntil: "networkidle" });
  if (!(await staysAway(page, dialog(page)))) fail("new student: asked for a name before reading or solving anything");
  await context.close();
}

// A new student who finished reading a chapter is asked, and Not now is remembered.
{
  const { context, page } = await open({ seed: "new", progress: { solved: [], read: ["run-time-environment"], seen: ["run-time-environment"] } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (!(await appears(dialog(page)))) fail("new student with a chapter read: the dialog did not open");
  else {
    await page.getByRole("button", { name: "Not now" }).click();
    await page.reload({ waitUntil: "networkidle" });
    if (!(await staysAway(page, dialog(page)))) fail("Not now: the dialog came back after a reload");
  }
  await context.close();
}

// A name that is only spaces is refused with a message, and the dialog stays.
{
  const { context, page } = await open({ seed: "new", progress: { solved: ["x"] } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (await appears(dialog(page))) {
    await page.getByLabel("Your name").fill("    ");
    await page.getByRole("button", { name: "Join", exact: true }).click();
    if (!(await appears(page.getByText("Use 1 to 24 characters.")))) fail("blank name: no message shown");
    if (!(await dialog(page).count())) fail("blank name: the dialog closed");
  } else fail("blank name: the dialog did not open");
  await context.close();
}

// While someone is typing code, the dialog waits until they leave the editor.
{
  const { context, page } = await open({ seed: "new", progress: { solved: [], seen: [] } });
  await page.goto(base + "/sessions/run-time-environment/?step=ex-declare-then-define", { waitUntil: "networkidle" });
  await page.locator(".cm-content").waitFor();
  await page.locator(".cm-content").click();
  await page.evaluate((KEY) => {
    const progress = JSON.parse(localStorage.getItem(KEY));
    localStorage.setItem(KEY, JSON.stringify({ ...progress, read: ["run-time-environment"] }));
    window.dispatchEvent(new Event("study-progress"));
  }, KEY);
  if (!(await staysAway(page, dialog(page), 1500))) fail("editor: the dialog opened while the student was typing code");
  await page.evaluate(() => document.activeElement.blur());
  if (!(await appears(dialog(page)))) fail("editor: the dialog did not open after the student left the editor");
  await context.close();
}

// Without Firebase set up and without a test board, nothing about the leaderboard shows.
if (!CONFIGURED) {
  const { context, page } = await open({ board: null, progress: { solved: [], last: "memory-model", seen: ["memory-model"] } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (!(await staysAway(page, dialog(page)))) fail("not configured: the dialog opened");
  if (await page.locator('a[href$="/leaderboard/"], a[href$="/leaderboard"]').count()) fail("not configured: a leaderboard link shows");
  await context.close();
}

// The dialog fits a phone in both themes, with controls big enough to tap.
for (const theme of ["light", "dark"]) {
  const { context, page } = await open({ seed: "new", progress: { solved: ["x"] }, width: 375, theme });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (await appears(dialog(page))) {
    const sideways = await overflow(page);
    if (sideways > 0) fail(`dialog at 375 in ${theme}: page overflows sideways by ${sideways}px`);
    const small = await dialog(page).locator("button, input").evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().height < 44).length);
    if (small) fail(`dialog at 375 in ${theme}: ${small} controls are shorter than 44px`);
  } else fail(`dialog at 375 in ${theme}: did not open`);
  await context.close();
}

if (process.argv.includes("--dialog-only")) await finish();

// ---- The leaderboard page ----
const now = Date.now();
const seedRows = () => [
  { id: "noa", name: "Noa", chapters: 5, reviews: 2, solved: 40, current: "threads", reachedAt: now - 5 * DAY, updatedAt: now - 3600_000, hidden: false },
  { id: "idan", name: "עידן", chapters: 3, reviews: 1, solved: 22, current: "rule-of-three", reachedAt: now - 9 * DAY, updatedAt: now - 2 * DAY, hidden: false },
  { id: "dana", name: "Dana", chapters: 3, reviews: 1, solved: 22, current: "rule-of-three", reachedAt: now - 9 * DAY, updatedAt: now - DAY, hidden: false },
  { id: "old", name: "Old", chapters: 1, reviews: 0, solved: 1, current: "memory-model", reachedAt: now - 120 * DAY, updatedAt: now - 90 * DAY, hidden: false },
];
// The checking device joins as "Viewer". Its own row always comes from its local progress (0 chapters, 1 solved), so it ranks last.
const viewer = { id: "viewer", name: "Viewer" };
const joined = { solved: ["x"], read: ["run-time-environment"] };

{
  const { context, page, errors } = await open({ board: { rows: seedRows() }, player: viewer, progress: joined, seed: "new" });
  await page.goto(base + "/leaderboard/", { waitUntil: "networkidle" });
  const names = page.locator(".board-row .board-name");
  if (!(await appears(names))) {
    fail("board: no rows rendered");
    await context.close();
    await finish();
  }
  await page.waitForFunction(() => document.querySelectorAll(".board-row").length === 5, null, { timeout: 4000 }).catch(() => fail("board: the viewer's own row was not published"));
  const order = await names.allInnerTexts();
  if (order.join(",") !== "Noa,עידן,Dana,Old,Viewer") fail(`board: rows in order ${order.join(",")}`);
  const places = await page.locator(".board-row .board-place").allInnerTexts();
  if (places.map((p) => p.trim()).join(",") !== "1,2,2,4,5") fail(`board: places ${places.join(",")}`);
  if (!(await page.locator(".board-row.is-stale").filter({ hasText: "Old" }).count())) fail("board: the 90-day-idle row is not marked stale");
  const lede = (await page.locator(".board-you").innerText().catch(() => "")).replace(/\u2019/g, "'");
  if (!lede.includes("You're 5th of 5")) fail(`board: masthead says "${lede}"`);
  const plants = await page.locator(".board-plant").count();
  if (plants !== 4) fail(`board: garden has ${plants} plants, expected 4`);
  if (!(await page.locator(".board-plant.is-you").filter({ hasText: "Viewer" }).count())) fail("board: the viewer's plant is not marked as yours");
  const bidi = await page.locator(".board-row .board-name").nth(1).evaluate((el) => !!el.querySelector("bdi, [dir]") || el.closest("[dir]") !== null || el.tagName === "BDI");
  if (!bidi) fail("board: the Hebrew name is not isolated for direction");

  // A new row arriving shows without a reload.
  await page.evaluate(() => {
    window.__studyBoard.rows.push({ id: "maya", name: "Maya", chapters: 9, reviews: 3, solved: 70, current: null, reachedAt: Date.now(), updatedAt: Date.now(), hidden: false });
    window.dispatchEvent(new Event("study-board-test"));
  });
  if (!(await appears(page.locator(".board-row .board-name", { hasText: "Maya" }), 3000))) fail("board: a new row did not appear live");

  // Change name.
  await page.getByRole("button", { name: "Change name" }).click();
  await page.getByLabel("New name").fill("Viewer K");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForFunction(() => window.__studyBoard.rows.some((row) => row.name === "Viewer K"), null, { timeout: 4000 }).catch(() => fail("board: rename did not reach the board"));

  // Leave.
  await page.getByRole("button", { name: "Leave the leaderboard" }).click();
  await page.waitForFunction(() => window.__studyBoard.rows.find((row) => row.id === "viewer")?.hidden === true, null, { timeout: 4000 }).catch(() => fail("board: leaving did not hide the row"));
  if (await page.locator(".board-row .board-name", { hasText: "Viewer" }).count()) fail("board: the viewer is still listed after leaving");
  if (!(await appears(page.getByRole("button", { name: "Join the leaderboard" })))) fail("board: no Join button after leaving");
  if (errors.length) fail(`board: page errors: ${errors.join("; ")}`);
  await context.close();
}

// The board cannot be reached.
{
  const { context, page } = await open({ board: { rows: [], fail: true }, player: viewer, progress: joined, seed: "new" });
  await page.goto(base + "/leaderboard/", { waitUntil: "networkidle" });
  if (!(await appears(page.getByText(/The leaderboard can.t be reached right now\./)))) fail("board offline: no error line");
  await context.close();
}

// Not configured: the page still exists and says so.
if (!CONFIGURED) {
  const { context, page } = await open({ board: null });
  await page.goto(base + "/leaderboard/", { waitUntil: "networkidle" });
  if (!(await appears(page.getByText(/The leaderboard isn.t set up yet\./)))) fail("board not configured: no message");
  await context.close();
}

// A guest with no progress and no name can watch the board.
{
  const { context, page, errors } = await open({ board: { rows: seedRows() } });
  await page.goto(base + "/leaderboard/", { waitUntil: "networkidle" });
  if (!(await appears(page.locator(".board-row")))) fail("guest: cannot see the board");
  else if ((await page.locator(".board-row").count()) !== 4) fail("guest: watching added a row");
  if (!(await appears(page.getByRole("button", { name: "Join the leaderboard" })))) fail("guest: no Join button");
  if (await dialog(page).count()) fail("guest: the name dialog opened just from watching");
  if (errors.length) fail(`guest: page errors: ${errors.join("; ")}`);
  await context.close();
}

// A student who opened every chapter is never asked, and the board tells them why they are not on it.
{
  const { context, page } = await open({ board: { rows: seedRows() }, seed: "existing", progress: { solved: ["x"], read: ["run-time-environment"], openAll: true } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (!(await staysAway(page, dialog(page)))) fail("open every chapter: the name dialog opened");
  await page.goto(base + "/leaderboard/", { waitUntil: "networkidle" });
  if (!(await appears(page.getByText(/Open every chapter/)))) fail("open every chapter: the board does not explain why they are left off");
  if (await page.getByRole("button", { name: "Join the leaderboard" }).count()) fail("open every chapter: a Join button shows");
  await context.close();
}

// A joined student who then opens every chapter drops off the board.
{
  const { context, page } = await open({ board: { rows: seedRows() }, player: viewer, progress: joined, seed: "new" });
  await page.goto(base + "/leaderboard/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll(".board-row").length === 5, null, { timeout: 4000 }).catch(() => fail("open every chapter later: the viewer never joined the board"));
  await page.evaluate((KEY) => {
    const progress = JSON.parse(localStorage.getItem(KEY));
    localStorage.setItem(KEY, JSON.stringify({ ...progress, openAll: true }));
    window.dispatchEvent(new Event("study-progress"));
  }, KEY);
  await page.waitForFunction(() => window.__studyBoard.rows.find((row) => row.id === "viewer")?.hidden === true, null, { timeout: 5000 }).catch(() => fail("open every chapter later: the row was not hidden"));
  if (!(await appears(page.locator(".board-row"), 1000)) || (await page.locator(".board-row .board-name", { hasText: "Viewer" }).count())) fail("open every chapter later: still listed");
  await context.close();
}

// Layout at phone and desktop widths, in both themes.
for (const width of [375, 1280]) {
  for (const theme of ["light", "dark"]) {
    const { context, page } = await open({ board: { rows: seedRows() }, player: viewer, progress: joined, seed: "new", width, theme });
    await page.goto(base + "/leaderboard/", { waitUntil: "networkidle" });
    await appears(page.locator(".board-row"));
    const sideways = await overflow(page);
    if (sideways > 0) fail(`board at ${width} in ${theme}: page overflows sideways by ${sideways}px`);
    const small = await page.locator("main button:visible, .board-list a:visible").evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().height < 44).length);
    if (small) fail(`board at ${width} in ${theme}: ${small} controls are shorter than 44px`);
    await context.close();
  }
}

// ---- The line on home ----
{
  const { context, page, errors } = await open({ board: { rows: seedRows() }, player: viewer, progress: joined, seed: "new" });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const line = page.locator(".board-rank a");
  if (!(await appears(line, 4000))) fail("home: no leaderboard line for a joined student");
  else {
    const text = (await line.innerText()).replace(/\u2019/g, "'");
    if (!text.includes("You're 5th of 5 on the leaderboard")) fail(`home: line says "${text}"`);
    if (!(await line.getAttribute("href"))?.includes("/leaderboard")) fail("home: the line does not link to the leaderboard");
  }
  if (errors.length) fail(`home: page errors: ${errors.join("; ")}`);
  await context.close();
}
for (const width of [375, 1280]) {
  const { context, page } = await open({ board: { rows: seedRows() }, player: viewer, progress: joined, seed: "new", width });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (await appears(page.locator(".board-rank a"), 4000)) {
    const hit = await page.evaluate(() => {
      const a = document.querySelector(".board-rank").getBoundingClientRect();
      return [...document.querySelectorAll(".gh-hero .gh-action-note, .gh-hero .gh-leaf")].some((el) => {
        const b = el.getBoundingClientRect();
        return b.width > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      });
    });
    if (hit) fail(`home at ${width}: the leaderboard line overlaps the note or the stem`);
  } else fail(`home at ${width}: no leaderboard line`);
  await context.close();
}
{
  const { context, page } = await open({ board: { rows: seedRows() }, progress: joined, seed: "new", player: { declined: true } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (!(await staysAway(page, page.locator(".board-rank a")))) fail("home: the line shows for a student who has not joined");
  await context.close();
}
{
  const { context, page, errors } = await open({ board: { rows: [], fail: true }, player: viewer, progress: joined, seed: "new" });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  if (!(await staysAway(page, page.locator(".board-rank a")))) fail("home offline: the line shows");
  if (errors.length) fail(`home offline: page errors: ${errors.join("; ")}`);
  await context.close();
}

finish();

async function finish() {
  await browser.close();
  server.close();
  if (failures.length) {
    console.error(`${failures.length} leaderboard check(s) failed:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log("Leaderboard checks passed.");
  process.exit(0);
}
