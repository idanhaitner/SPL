# Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public leaderboard where each student picks a name once per device, and a summary of their local progress is published to Firestore and shown as a garden of plants plus a ranked list.

**Architecture:** Progress stays in `localStorage` (`lib/progress.ts`, unchanged). New pure logic lives in `lib/leaderboard.ts`, device identity in `lib/player.ts`, and publishing in `lib/publish.ts`. Everything talks to a small `BoardStore` interface. Its Firestore implementation is loaded with a dynamic `import()` so no page pays for the SDK at first paint. Two client components mounted in the root layout ask for the name and publish. A new `/leaderboard/` page renders the board.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, vitest (jsdom), Playwright check scripts, Firebase JS SDK 13 (`firebase/app`, `firebase/firestore`).

**Spec:** `docs/superpowers/specs/2026-11-19-friends-leaderboard-design.md`

All paths below are relative to `study/web/` unless they start with `firebase/`, `docs/`, or a root file name (`README.md`, `PRODUCT.md`, `DESIGN.md`).

## Global Constraints

- Local progress is never written by any leaderboard code. Only `readProgress` is called.
- Studying never waits on the network: no `await` of the store in any click, Next, or Finish-reading path.
- The Firebase SDK is reached only through `import("./board-firestore")` inside `lib/board-store.ts`. No static `import ... from "firebase/..."` anywhere else.
- If `FIREBASE_CONFIG` is `null` and no test board is installed, every leaderboard UI hides itself (top-bar link, drawer link, dialog, home line). `/leaderboard/` still builds and says the board isn't set up.
- Course id is `course.id` (`systems-programming`). Firestore path: `courses/{courseId}/players/{playerId}`.
- Names are 1–24 characters after trimming.
- Ranking: `chapters` desc, then `solved` desc, then `reachedAt` asc. Exact ties share a place (1, 1, 3).
- "Chapters" means non-bridge chapters where `isDone` is true, out of `leavesOf(chapters).length` (16).
- Copy follows `DESIGN.md`: plain labels ("Leaderboard", "Join", "Not now"), no plant puns on actions, one filled primary per screen.
- New `localStorage` keys: `study:<courseId>:player`, `study:<courseId>:board-seed`, `study:<courseId>:published`. New window events: `study-player`.
- Motion follows the Growth Is Slow Rule and is still under `prefers-reduced-motion`. Use existing tokens only, in both themes.
- CI is unchanged. `npm test`, `npm run check:exercises`, and `npm run build` must pass.

## Review Focus

1. **Firestore is blocked or offline** (ad blockers often block `firestore.googleapis.com`). Studying works, nothing throws into the UI, the board page shows its calm error line, and publishing retries later. Tested in Task 3 (`put` rejects) and Task 5 (`fail: true` board).
2. **Junk or partial rows in Firestore.** Anyone can write through the REST API within the rules, and old rows may predate fields. The board must skip or normalize them, never crash. Tested in Task 1 (`toRow`).
3. **A friend who had progress before this upgrade** and has only visited pages (only `seen`/`last`). They must be asked on their first visit and published at their true place. Tested in Task 2 (`shouldAsk` with seed `existing`) and Task 4 (Playwright fixture).
4. **The dialog appearing while someone types code** in a session editor. It must wait. Tested in Task 4 (Playwright: focus in `.cm-content`, fire progress, no dialog).
5. **Hebrew, emoji, padded, and over-long names.** These must be trimmed and capped, and Hebrew must display correctly in the list. Tested in Task 1 (`cleanName`) and Task 5 (Hebrew row renders through `Mixed`).

---

### Task 1: Pure leaderboard logic

**Files:**
- Create: `lib/leaderboard.ts`
- Test: `lib/leaderboard.test.ts`

**Interfaces:**
- Consumes: `isDone`, `nextChapter`, `leavesOf`, `type ChapterInfo`, `type Progress` from `lib/progress.ts`.
- Produces:
  - `type Summary = { chapters: number; reviews: number; solved: number; current: string | null }`
  - `type Row = Summary & { id: string; name: string; reachedAt: number; updatedAt: number; hidden: boolean }` (times in ms)
  - `type RankedRow = Row & { place: number; stale: boolean }`
  - `summarize(chapters: ChapterInfo[], progress: Progress): Summary`
  - `sameSummary(a: Summary, b: Summary): boolean`
  - `gained(before: Summary | null, after: Summary): boolean`: true when `before` is null or `chapters`/`solved` went up.
  - `cleanName(raw: string): string | null`: trims, collapses inner whitespace to one space, returns `null` if empty or longer than 24 `.length`.
  - `toRow(id: string, data: unknown): Row | null`: normalizes a stored document. Returns `null` without a valid name. Clamps bad or missing numbers to 0, `current` to `null`, `hidden` to `false`. Timestamps may arrive as numbers (ms) or objects with `toMillis()`; anything else becomes 0.
  - `rankRows(rows: Row[], now: number): RankedRow[]`: drops `hidden`, sorts, assigns places. `stale` = `now - updatedAt > 60 days`.
  - `ordinal(n: number): string` ("1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st", "111th")
  - `ago(then: number, now: number): string` via `Intl.RelativeTimeFormat("en", { numeric: "auto" })`, choosing the largest unit among minutes, hours, days, months. Under a minute is "just now".
  - `const STALE_MS = 60 * 24 * 60 * 60 * 1000`

- [ ] **Step 1: Write the failing tests** in `lib/leaderboard.test.ts`. Reuse the `ch`/`br` helpers pattern from `lib/progress.test.ts`.

```ts
const course = [ch("a", ["a1", "a2"]), ch("b", ["b1"]), br("r1", ["r1s"]), ch("c", ["c1"])].map((c, pos) => ({ ...c, pos }));

it("a fresh student has nothing", () => {
  expect(summarize(course, { solved: [] })).toEqual({ chapters: 0, reviews: 0, solved: 0, current: "a" });
});
it("counts done chapters, not read ones", () => {
  expect(summarize(course, { solved: ["a1"], read: ["a", "b"] }).chapters).toBe(0);
  expect(summarize(course, { solved: ["a1", "a2", "b1"], read: ["a", "b"] })).toMatchObject({ chapters: 2, solved: 3, current: "r1" });
});
it("counts a review only when its steps are solved", () => {
  expect(summarize(course, { solved: ["a1", "a2", "b1", "r1s"], read: ["a", "b"] }).reviews).toBe(1);
});
it("an open-all student reading ahead without solving gains no chapters", () => {
  expect(summarize(course, { solved: [], read: ["a", "b", "c"], openAll: true }).chapters).toBe(0);
});
it("a student past a waived review is not credited with it", () => {
  expect(summarize(course, { solved: ["a1", "a2", "b1", "c1"], read: ["a", "b", "c"] })).toMatchObject({ chapters: 3, reviews: 0 });
});
it("gained only on chapters or solved going up", () => {
  const s = { chapters: 1, reviews: 0, solved: 2, current: "b" };
  expect(gained(null, s)).toBe(true);
  expect(gained(s, { ...s, current: "c" })).toBe(false);
  expect(gained(s, { ...s, solved: 3 })).toBe(true);
  expect(gained(s, { ...s, solved: 1 })).toBe(false);
});
it("cleans names", () => {
  expect(cleanName("  Noa   Levi ")).toBe("Noa Levi");
  expect(cleanName("   ")).toBeNull();
  expect(cleanName("x".repeat(25))).toBeNull();
  expect(cleanName("x".repeat(24))).toBe("x".repeat(24));
  expect(cleanName("עידן")).toBe("עידן");
});
it("normalizes junk rows", () => {
  expect(toRow("x", null)).toBeNull();
  expect(toRow("x", { name: 5 })).toBeNull();
  expect(toRow("x", { name: "Dana", chapters: "7", solved: -3, reachedAt: { toMillis: () => 10 } })).toEqual({ id: "x", name: "Dana", chapters: 0, reviews: 0, solved: 0, current: null, reachedAt: 10, updatedAt: 0, hidden: false });
});
it("ranks with shared places and drops hidden rows", () => {
  const row = (id: string, chapters: number, solved: number, reachedAt: number, extra = {}) => ({ id, name: id, chapters, reviews: 0, solved, current: null, reachedAt, updatedAt: 1000, hidden: false, ...extra });
  const ranked = rankRows([row("a", 3, 10, 5), row("b", 5, 1, 9), row("c", 3, 10, 5), row("d", 3, 10, 2), row("e", 9, 9, 1, { hidden: true })], 2000);
  expect(ranked.map((r) => [r.id, r.place])).toEqual([["b", 1], ["d", 2], ["a", 3], ["c", 3]]);
});
it("marks rows idle for over 60 days as stale", () => {
  const now = STALE_MS + 5000;
  expect(rankRows([{ id: "a", name: "a", chapters: 0, reviews: 0, solved: 0, current: null, reachedAt: 0, updatedAt: 1000, hidden: false }], now)[0].stale).toBe(true);
});
it("writes ordinals", () => {
  expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st", "111th"]);
});
it("says how long ago", () => {
  expect(ago(0, 30_000)).toBe("just now");
  expect(ago(0, 2 * 3600_000)).toBe("2 hours ago");
  expect(ago(0, 86_400_000)).toBe("yesterday");
});
```

- [ ] **Step 2:** Run `npx vitest run lib/leaderboard.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3:** Implement `lib/leaderboard.ts` with the signatures above. It is a plain module, not `"use client"`, and imports from `./progress` as types and functions. `current` is `nextChapter(chapters, progress)?.id ?? null`.
- [ ] **Step 4:** Run `npx vitest run lib/leaderboard.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `git add lib/leaderboard.ts lib/leaderboard.test.ts && git commit -m "Add leaderboard summary and ranking logic"`

---

### Task 2: Device identity and when to ask

**Files:**
- Create: `lib/player.ts`
- Test: `lib/player.test.ts`
- Modify: `app/layout.tsx` (append the seed script to the existing head script)

**Interfaces:**
- Consumes: `storageKey`, `type Progress`, `hasStarted` from `lib/progress.ts`.
- Produces:
  - `type Player = { id: string; name: string }`
  - `type PlayerState = Player | { declined: true } | null`
  - `type Published = { id: string; name: string; summary: Summary; reachedAt: number }`
  - `readPlayer(courseId): PlayerState` (tolerates broken JSON → `null`)
  - `joinAs(courseId, name: string): Player`: uses `crypto.randomUUID()`, and keeps the existing id if this device already has one.
  - `renamePlayer(courseId, name: string): Player | null`
  - `declinePlayer(courseId): void`: stores `{ declined: true }` and clears `published`.
  - `readSeed(courseId): "existing" | "new"` (missing → `"new"`)
  - `boardSeedScript(courseId: string): string`: inline JS for the head script. If `study:<id>:board-seed` is unset, it sets it to `"existing"` when `study:<id>` exists, else `"new"`. Wrapped in `try{}catch(e){}`.
  - `shouldAsk(progress: Progress, player: PlayerState, seed: "existing" | "new"): boolean`
  - `readPublished(courseId): Published | null`, `writePublished(courseId, p: Published): void`
  - Every write dispatches `new Event("study-player")`, the way `writeProgress` dispatches `study-progress`. All storage access is wrapped in try/catch, as in `lib/session-store.ts`.

- [ ] **Step 1: Write the failing tests** (`// @vitest-environment jsdom`, `beforeEach(() => localStorage.clear())`):

```ts
it("asks a new student only after real progress", () => {
  expect(shouldAsk({ solved: [], last: "a", seen: ["a"] }, null, "new")).toBe(false);
  expect(shouldAsk({ solved: [], read: ["a"] }, null, "new")).toBe(true);
  expect(shouldAsk({ solved: ["s"] }, null, "new")).toBe(true);
});
it("asks a student from before the upgrade who has only visited", () => {
  expect(shouldAsk({ solved: [], last: "a", seen: ["a"] }, null, "existing")).toBe(true);
  expect(shouldAsk({ solved: [] }, null, "existing")).toBe(false);
});
it("never asks again after joining or declining", () => {
  expect(shouldAsk({ solved: ["s"] }, { id: "i", name: "n" }, "new")).toBe(false);
  expect(shouldAsk({ solved: ["s"] }, { declined: true }, "existing")).toBe(false);
});
it("the seed script marks a browser with progress as existing, once", () => {
  localStorage.setItem("study:c", "{}");
  new Function(boardSeedScript("c"))();
  expect(readSeed("c")).toBe("existing");
  localStorage.removeItem("study:c");
  new Function(boardSeedScript("c"))();
  expect(readSeed("c")).toBe("existing");
});
it("the seed script marks a fresh browser as new", () => {
  new Function(boardSeedScript("c"))();
  expect(readSeed("c")).toBe("new");
});
it("joining keeps the device id across renames and rejoins", () => {
  const first = joinAs("c", "Dana");
  expect(renamePlayer("c", "Dana K")).toEqual({ id: first.id, name: "Dana K" });
  expect(joinAs("c", "D").id).toBe(first.id);
});
it("declining forgets what was published", () => {
  joinAs("c", "Dana");
  writePublished("c", { id: "x", name: "Dana", summary: { chapters: 1, reviews: 0, solved: 1, current: null }, reachedAt: 1 });
  declinePlayer("c");
  expect(readPlayer("c")).toEqual({ declined: true });
  expect(readPublished("c")).toBeNull();
});
it("survives broken storage", () => {
  localStorage.setItem("study:c:player", "nope");
  expect(readPlayer("c")).toBeNull();
});
```

- [ ] **Step 2:** Run `npx vitest run lib/player.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `lib/player.ts`. `joinAs` and `renamePlayer` store names as given, because callers pass `cleanName` output. The courseId must be embedded in `boardSeedScript` with `JSON.stringify`.
- [ ] **Step 4:** In `app/layout.tsx`, append `boardSeedScript(course.id)` to the existing `<script dangerouslySetInnerHTML>` content. Keep it one script so it runs before hydration and before `Visit` writes `last`/`seen`.
- [ ] **Step 5:** Run `npx vitest run lib/player.test.ts && npm run build`. Expected: PASS and a clean build.
- [ ] **Step 6:** Commit: `git add lib/player.ts lib/player.test.ts app/layout.tsx && git commit -m "Remember a leaderboard name per device and decide when to ask"`

---

### Task 3: Board store, Firestore adapter, publishing, rules, and setup docs

**Files:**
- Create: `lib/firebase-config.ts`, `lib/board-store.ts`, `lib/board-firestore.ts`, `lib/publish.ts`
- Test: `lib/publish.test.ts`
- Create: `firebase/firestore.rules` (repo root)
- Modify: `package.json` / `package-lock.json` (`npm install firebase@^13`)
- Modify: `README.md` (stack table row, "Leaderboard setup" section), `PRODUCT.md` (principle 5 and constraints)

**Interfaces:**
- Consumes: Task 1 (`summarize`, `sameSummary`, `gained`, `toRow`, `type Row`, `type Summary`) and Task 2 (`readPlayer`, `readPublished`, `writePublished`).
- Produces:
  - `lib/firebase-config.ts`: `export const FIREBASE_CONFIG: FirebaseOptions | null = null;` (type-only import from `firebase/app`). Task 8 fills it in.
  - `lib/board-store.ts`:
    - `type RowInput = Summary & { name: string; reachedAt: number; hidden?: boolean }`
    - `interface BoardStore { put(courseId: string, id: string, row: RowInput): Promise<void>; once(courseId: string): Promise<Row[]>; watch(courseId: string, onRows: (rows: Row[]) => void, onError: () => void): () => void }`
    - `boardEnabled(): boolean`: `FIREBASE_CONFIG !== null || (typeof window !== "undefined" && !!window.__studyBoard)`
    - `getStore(): Promise<BoardStore | null>`: memoized. Returns the test board when `window.__studyBoard` is set, else `(await import("./board-firestore")).firestoreStore(FIREBASE_CONFIG)` when configured, else `null`.
    - Test board: `declare global { interface Window { __studyBoard?: { rows: Row[]; fail?: boolean } } }`. Its `put` upserts into `rows` (setting `updatedAt: Date.now()`) and rejects when `fail` is set. `watch` calls `onRows` once now and after each `put`, or `onError` when `fail` is set.
  - `lib/board-firestore.ts`: `firestoreStore(config: FirebaseOptions): BoardStore`. It uses `initializeApp`, `getFirestore`, `doc`, `setDoc(..., { merge: true })`, `collection`, `getDocs`, `onSnapshot`, `Timestamp.fromMillis(reachedAt)`, and `serverTimestamp()` for `updatedAt`. It maps documents through `toRow(doc.id, doc.data())`, dropping nulls.
  - `lib/publish.ts`: `publishIfChanged(courseId: string, chapters: ChapterInfo[], store: BoardStore, now: number): Promise<"skipped" | "published" | "failed">`. The algorithm:

```
player = readPlayer(courseId); if !player or "declined" in player → "skipped"
summary = summarize(chapters, readProgress(courseId))
last = readPublished(courseId)
if last && last.id === player.id && last.name === player.name && sameSummary(last.summary, summary) → "skipped"
reachedAt = last?.id === player.id && !gained(last.summary, summary) ? last.reachedAt : now
try { await store.put(courseId, player.id, { name: player.name, ...summary, reachedAt }) } catch { return "failed" }
writePublished(courseId, { id: player.id, name: player.name, summary, reachedAt }); return "published"
```

  - `hideRow(courseId: string, store: BoardStore): Promise<void>` in `lib/publish.ts`: puts the last published row again with `hidden: true`. Used by "Leave".

- [ ] **Step 1: Write the failing tests** in `lib/publish.test.ts` (jsdom). Use an in-memory `BoardStore` fake defined in the test, and the `course` fixture from Task 1.

```ts
it("does nothing for a student who has not joined", async () => { expect(await publishIfChanged("c", course, fake, 1)).toBe("skipped"); expect(fake.puts).toEqual([]); });
it("publishes current progress on join, including progress from before the upgrade", async () => {
  localStorage.setItem("study:c", JSON.stringify({ solved: ["a1", "a2"], read: ["a"], last: "b", seen: ["a", "b"] }));
  joinAs("c", "Dana");
  expect(await publishIfChanged("c", course, fake, 100)).toBe("published");
  expect(fake.puts[0].row).toMatchObject({ name: "Dana", chapters: 1, solved: 2, reachedAt: 100 });
});
it("skips when nothing changed", async () => { /* publish once, then again */ expect(await publishIfChanged("c", course, fake, 200)).toBe("skipped"); expect(fake.puts.length).toBe(1); });
it("keeps reachedAt when only the current chapter moved", async () => { /* publish at 100, set last to another chapter so current changes without gain, publish at 300 */ expect(fake.puts[1].row.reachedAt).toBe(100); });
it("moves reachedAt on a gain", async () => { /* solve another step, publish at 400 */ expect(fake.puts.at(-1).row.reachedAt).toBe(400); });
it("republishes after a rename", async () => { /* renamePlayer then publish */ expect(fake.puts.at(-1).row.name).toBe("Dana K"); });
it("a failed write is retried next time and never throws", async () => {
  joinAs("c", "Dana"); fake.failNext = true;
  expect(await publishIfChanged("c", course, fake, 1)).toBe("failed");
  expect(readPublished("c")).toBeNull();
  expect(await publishIfChanged("c", course, fake, 2)).toBe("published");
});
it("never writes local progress", async () => {
  const before = JSON.stringify({ solved: ["a1"], read: ["a"] }); localStorage.setItem("study:c", before); joinAs("c", "Dana");
  await publishIfChanged("c", course, fake, 1);
  expect(localStorage.getItem("study:c")).toBe(before);
});
```

- [ ] **Step 2:** Run `npx vitest run lib/publish.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Run `npm install firebase@^13`, then implement the four `lib/` files above.
- [ ] **Step 4:** Write `firebase/firestore.rules`, copying the spec's rules with one addition: `'hidden'` in the `hasOnly` list, and `(!('hidden' in request.resource.data) || request.resource.data.hidden is bool)`.
- [ ] **Step 5:** Docs. In `README.md`, add the stack row `| Leaderboard | Firebase Cloud Firestore (free Spark plan) |` and a "Leaderboard setup" section with the spec's five one-time steps (pasting `firebase/firestore.rules`, filling `lib/firebase-config.ts`). In `PRODUCT.md`, change principle 5 to "No accounts and no server of our own; a small shared leaderboard summary lives in Firestore." Add to Capabilities and Constraints: "Progress stays on the device; only a summary (name, chapters done, reviews, solved, current chapter) is shared on a public leaderboard."
- [ ] **Step 6:** Run `npm test && npm run build`. Expected: all pass, and the build succeeds with `FIREBASE_CONFIG = null`.
- [ ] **Step 7:** Run `grep -rln "from \"firebase/" app components lib | grep -v board-firestore.ts`. Expected: only `lib/firebase-config.ts` (a type-only import) or nothing.
- [ ] **Step 8:** Commit: `git add -A lib ../../firebase package.json package-lock.json ../../README.md ../../PRODUCT.md && git commit -m "Publish a progress summary to a Firestore leaderboard"`

---

### Task 4: Join dialog and background sync

**Files:**
- Create: `components/board/JoinDialog.tsx`, `components/board/BoardSync.tsx`
- Create: `app/board.css` (imported from `app/globals.css` after `greenhouse.css`)
- Modify: `app/layout.tsx` (mount both after `<ChapterBloom>`, passing `courseId` and `nav.chapters`)
- Create: `scripts/check-board.mjs`. Modify `package.json`: `"check:board": "node scripts/check-board.mjs"`

**Interfaces:**
- Consumes: Task 2 (`readPlayer`, `readSeed`, `shouldAsk`, `joinAs`, `declinePlayer`), Task 3 (`boardEnabled`, `getStore`, `publishIfChanged`), Task 1 (`cleanName`), and `useLoadedProgress` from `lib/progress.ts`.
- Produces: `<JoinDialog courseId chapters />` and `<BoardSync courseId chapters />`. Both render `null` when `!boardEnabled()`. `JoinDialog` also exports `openJoinDialog()`, which dispatches `new Event("study-join")` so Task 5's Join button can open it.

**Behavior:**
- `BoardSync` publishes on mount and on `study-progress`/`study-player`, debounced 2000ms, via `getStore()` then `publishIfChanged(courseId, chapters, store, Date.now())`. It ignores results and swallows errors.
- `JoinDialog` uses a native `<dialog>` with `showModal()`, like `CourseDrawer`. It checks `shouldAsk(progress, readPlayer(courseId), readSeed(courseId))` on mount and on `study-progress`. It opens only if `document.activeElement` is not inside `.cm-editor`, `input`, or `textarea`. If focus is there, it re-checks on the next `study-progress` or `focusout`. It also opens on `study-join`, even when `shouldAsk` is false. It never opens when `readPlayer` is a joined `Player`.
- Copy: heading "Join the leaderboard?". Body: "Pick a name others studying the course will see. Your name and how far you've grown will be visible to anyone who opens the leaderboard." Field label "Your name", `maxLength={24}`. The primary button is "Join" and the quiet button is "Not now". If `cleanName` returns null, the field shows the inline error "Use 1 to 24 characters."
- Join → `joinAs(courseId, cleanName(value))` and close. `BoardSync` picks it up through `study-player`, and the first publish skips the debounce when there is no `published` record yet. Not now and Esc → `declinePlayer(courseId)` and close.

- [ ] **Step 1: Write the failing browser check** `scripts/check-board.mjs`, following `scripts/check-shell.mjs` (`startServer`, `chromium`, a `failures` array, exit code 1 on failures). Install the test board with `context.addInitScript(() => { window.__studyBoard = { rows: [] }; })`. Cases:
  - **Existing student, only visited:** init script sets `localStorage["study:systems-programming"] = {"solved":[],"last":"memory-model","seen":["memory-model"]}`. Open `/` and expect `dialog.board-join[open]` within 3s. Type "Dana" and click "Join". Within 4s, expect `window.__studyBoard.rows` to have one row with `name: "Dana"` and `chapters: 0`.
  - **New student:** no progress. Open `/topics/run-time-environment/` and expect no open dialog after 2s.
  - **Not now:** the existing-student fixture, click "Not now", reload, and expect no dialog.
  - **Typing in the editor:** a new student with `read: ["run-time-environment"]` already set. Before the dialog appears, the check must hold focus in the editor. Open a session page with an exercise (pick one from `course.yml` for the first chapter that has an exercise step), focus `.cm-content`, fire `window.dispatchEvent(new Event("study-progress"))`, and expect no open dialog. Then blur (`document.activeElement.blur()`) and expect the dialog within 3s.
  - **Not configured:** a context without `__studyBoard` and the existing-student fixture. Open `/` and expect no dialog after 2s.
  - **Width:** at 375px wide in both themes, the open dialog causes no sideways overflow, and its buttons are at least 44px tall.
- [ ] **Step 2:** Run `npm run build && npm run check:board`. Expected: FAIL (no dialog).
- [ ] **Step 3:** Implement `BoardSync`, `JoinDialog`, the dialog styles in `app/board.css`, and the layout mount.
- [ ] **Step 4:** Run `npm run build && npm run check:board && npm run check:shell && npm run check:session && npm test`. Expected: all pass.
- [ ] **Step 5:** Commit: `git add -A components/board app scripts/check-board.mjs package.json && git commit -m "Ask for a leaderboard name and publish progress in the background"`

---

### Task 5: The leaderboard page

**Files:**
- Create: `app/leaderboard/page.tsx` (server), `components/board/Leaderboard.tsx` (client), `components/board/Garden.tsx`, `components/board/BoardList.tsx`
- Modify: `lib/stem.ts` (add `export const PLANT_STEM: Curve[]`, an upright gently curving stem for one small plant)
- Modify: `components/shell/TopBar.tsx` (a "Leaderboard" link after Glossary, only when `FIREBASE_CONFIG !== null`), `components/shell/CourseDrawer.tsx` (same link in `.gh-drawer-links`, same condition)
- Modify: `app/board.css`, `DESIGN.md` (a "Leaderboard" entry under Components)
- Modify: `scripts/check-board.mjs` (board cases)

**Interfaces:**
- Consumes: Task 1 (`rankRows`, `ordinal`, `ago`, `type RankedRow`), Task 2 (`readPlayer`, `renamePlayer`, `declinePlayer`), Task 3 (`getStore`, `boardEnabled`, `hideRow`), Task 4 (`openJoinDialog`). It also uses `Stem`, `LeafBlade`, `Flower`, and `spacedLeaves` from the existing drawing code, `Mixed` from `lib/bidi.tsx`, and `courseNav`/`stemParts`/`nameOf`.
- Produces:
  - `app/leaderboard/page.tsx` renders `TopBar`, then a `.masthead` with arches and `CloseSprig` (as in `app/glossary/page.tsx`), `<h1>Leaderboard</h1>`, and the lede "How far everyone has grown", then `<Leaderboard courseId total={16 from leavesOf} reviewsTotal={bridge count} partStarts={stemParts(nav)} labels={Record<chapterId, "Chapter 8 · Threads" | "Review · <title>">} />`.
  - `<Garden rows={RankedRow[]} you={string | null} total reviewsTotal partStarts />` draws one SVG bed with up to 12 non-stale plants in rank order. Each plant's stem height and open leaves come from `chapters / total`, it has one `Flower` per review done, the part tendrils sit at the same heights on every plant, the name sits under each plant, the leader gets the `here` glow, and your plant is labelled "You".
  - `<BoardList rows you labels now />` is a ranked list (`<ol>`) of place, name (through `Mixed`), chapters "7 of 16", reviews, solved, "Now on: {label}", and `ago(updatedAt, now)`. Stale rows get `.is-stale`. It shows the top 50 plus a "Show everyone" button, and pins your row at the bottom if it falls outside what's shown. Your row sits on the lighter plate and holds "Change name" (inline edit through `cleanName` → `renamePlayer`) and "Leave the leaderboard" (`await hideRow` → `declinePlayer`).
- Leaderboard states:
  - Not enabled: "The leaderboard isn't set up yet."
  - Loading: a reserved-height quiet placeholder.
  - Error (`onError`): "The leaderboard can't be reached right now. Your progress is safe on this device."
  - Empty: "Nobody's here yet. Finish a chapter or solve a question to be the first." plus Join.
  - Masthead line: "You're {ordinal(place)} of {rows}", or a primary "Join the leaderboard" button calling `openJoinDialog()` when not joined. It is the only filled primary on the page.

- [ ] **Step 1: Extend the failing check** in `scripts/check-board.mjs`. Seed `__studyBoard.rows` with 4 rows: "Noa" 5/40, "עידן" 3/22, "Dana" 3/22 (same `reachedAt`), and "Old" 1/1 with `updatedAt` 90 days ago. Also set the player key so this device is "Dana".
  - `/leaderboard/` lists 4 rows in order Noa, עידן, Dana, Old, with places 1, 2, 2, 4. "Old" has `.is-stale`.
  - The masthead reads "You're 2nd of 4".
  - The garden has 3 plants (Old left out). The "You" label sits under Dana's plant.
  - The Hebrew name renders inside a `bdi` or `dir="auto"` element (whatever `Mixed` emits).
  - Pushing a 5th row through `window.__studyBoard`'s `put` updates the list without a reload.
  - With `{ rows: [], fail: true }` the error line shows, and the page has no sideways overflow.
  - "Change name" to "Dana K" updates the row in `__studyBoard.rows`.
  - "Leave the leaderboard" removes Dana from the list, and the masthead shows the Join button.
  - At 375px and 1280px, in light and dark: no sideways overflow, and controls are at least 44px.
- [ ] **Step 2:** Run `npm run build && npm run check:board`. Expected: FAIL (no page).
- [ ] **Step 3:** Implement the page, the components, `PLANT_STEM`, styles, and the links. Plants grow once on arrival using the existing `gh-unfurl`/stem-reveal motion, and all motion is off under reduced motion. Below 640px, the garden is a horizontal scroller inside its panel (the page itself must not overflow).
- [ ] **Step 4:** Add the "Leaderboard" entry to `DESIGN.md` Components: garden bed, plant rules, list, and states, in the file's existing voice.
- [ ] **Step 5:** Run `npm run build && npm run check:board && npm run check:shell && npm test`. Expected: all pass.
- [ ] **Step 6:** Commit: `git add -A app components lib/stem.ts scripts ../../DESIGN.md && git commit -m "Add the leaderboard page with a garden of everyone's plants"`

---

### Task 6: Rank line on home

**Files:**
- Create: `components/home/BoardRankLine.tsx`
- Modify: `app/page.tsx` (inside `.gh-hero-action`, after `<ContinueButton … showNote />`), `app/board.css`
- Modify: `scripts/check-board.mjs`

**Interfaces:**
- Consumes: `boardEnabled`, `getStore().once`, `rankRows`, `ordinal`, `readPlayer`.
- Produces: `<BoardRankLine courseId />`. It renders nothing unless the device has joined and the board is enabled. After first paint it waits for `requestIdleCallback` (falling back to `setTimeout(…, 1200)`), calls `once`, and renders `<Link href="/leaderboard">You're {ordinal(place)} of {n} on the leaderboard →</Link>`. Errors render nothing. Its height is reserved, so nothing shifts, and it fades in. On home, `.gh-action-note` is absolutely positioned at wide sizes, so place the line so it doesn't collide with it at 1280px or at 375px.

- [ ] **Step 1: Extend the check:** with the Task 5 seed rows and joined as Dana, `/` shows "You're 2nd of 4 on the leaderboard" within 4s, and the link goes to `/leaderboard/`. Not joined: nothing. `fail: true`: nothing, with no console errors. At 375px and 1280px the line's box does not intersect `.gh-action-note` or the stem's leaves.
- [ ] **Step 2:** Run `npm run build && npm run check:board`. Expected: FAIL.
- [ ] **Step 3:** Implement `BoardRankLine` and mount it.
- [ ] **Step 4:** Run `npm run build && npm run check:board && npm run check:shell && npm test`. Expected: all pass.
- [ ] **Step 5:** Commit: `git add -A components/home app scripts && git commit -m "Show the student's leaderboard place under Continue on home"`

---

### Task 7: Whole-branch verification

- [ ] **Step 1:** Run `npm test && npm run check:exercises && npm run build`. Expected: all pass (the CI set).
- [ ] **Step 2:** Run `npm run check:shell && npm run check:chapter && npm run check:session && npm run check:board`. Expected: all pass, with `FIREBASE_CONFIG = null`.
- [ ] **Step 3:** Run `grep -o 'firebase[^"]*' out/index.html out/topics/memory-model/index.html | head`. Expected: no Firebase chunk referenced directly from page HTML (it must load only through the dynamic import).
- [ ] **Step 4:** Commit any fixes.

---

### Task 8: Go live with the author (needs the author)

This task can't be done by an agent alone. The author creates the Firebase project, and the agent walks them through it.

- [ ] **Step 1:** Walk the author through the README's "Leaderboard setup": create the project (Spark plan), create Firestore in production mode (`europe-west`), publish `firebase/firestore.rules`, register a Web app, and optionally restrict the API key to `idanhaitner.github.io/*` and `localhost`.
- [ ] **Step 2:** Paste the config they give into `lib/firebase-config.ts`. It is public by design, so it is safe to commit.
- [ ] **Step 3:** Run `npm run dev`. In two separate browser profiles, the first with pre-feature-style progress in `localStorage`, check: the name is asked, both rows appear live on `/leaderboard/` in the other profile, solving a question moves the place, Leave hides the row, and the Firebase console shows the documents.
- [ ] **Step 4:** Run `npm test && npm run build`, then commit: `git add lib/firebase-config.ts && git commit -m "Connect the leaderboard to the site's Firebase project"`
- [ ] **Step 5:** Open a PR from `feat/leaderboard` to `main`. Merging deploys through the existing Pages workflow.
