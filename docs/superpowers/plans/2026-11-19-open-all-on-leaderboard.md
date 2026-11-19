# Open-all Students on the Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students with "Open every chapter" on join and appear on the leaderboard like everyone else, scored by finished chapters as today.

**Architecture:** Pure removal of the open-all special case. Scoring (`summarize`, `rankRows`) is untouched. The `hidden` flag stays, now used only by "Leave the leaderboard".

**Tech Stack:** Next.js (static export), TypeScript, vitest, Playwright check scripts. All paths below are relative to `study/web/` unless they start with `docs/` or `DESIGN.md` (repo root).

**Spec:** `docs/superpowers/specs/2026-11-19-open-all-on-leaderboard-design.md`

## Global Constraints

- No scoring change: `summarize`, `rankRows`, `gained`, `sameSummary` are not edited.
- No Firestore field or rule changes.
- The board only reads local progress, never writes it.
- `publishIfChanged` always sends `hidden` (the store merges), now always `false` for a normal write.

## Review Focus

1. A student whose row was hidden earlier because of the switch, with no new progress: the next page load must still publish once with `hidden: false` (the stored `Published.hidden` is `true`, the new one `false`, so `sameSummary` alone must not skip it). Test in Task 1.
2. A student who left the leaderboard: still never published (no player id). Covered by existing tests; must stay green.
3. An open-all student who read ahead without solving: still 0 chapters. Existing `leaderboard.test.ts` test stays as is.
4. Turning the switch on while the leaderboard page is open: the row stays listed (no hide write). Pinned in Task 2's check-board change.
5. The home rank line for an open-all student: shows. Pinned in Task 2's check-board change.

---

### Task 1: Publishing and the join prompt ignore open-all

**Files:**
- Modify: `lib/publish.ts` (`publishIfChanged`)
- Modify: `lib/player.ts` (`shouldAsk` and its comment)
- Test: `lib/publish.test.ts`, `lib/player.test.ts`

**Interfaces:**
- Produces: unchanged signatures `publishIfChanged(courseId, chapters, store, now): Promise<"skipped" | "published" | "failed">` and `shouldAsk(progress, player, seed): boolean`.

- [ ] **Step 1: Replace the open-all tests with the new behavior**

In `lib/player.test.ts`, replace `"never asks a student who opened every chapter"` with:

```ts
it("asks a student who opened every chapter, like anyone else", () => {
  expect(shouldAsk({ solved: ["s"], read: ["a"], openAll: true }, null, "new")).toBe(true);
  expect(shouldAsk({ solved: [], seen: ["a"], openAll: true }, null, "existing")).toBe(true);
  expect(shouldAsk({ solved: [], openAll: true }, null, "new")).toBe(false);
});
```

In `lib/publish.test.ts`, replace the two open-all tests (`"never publishes a student who opened every chapter before joining"` and `"hides a joined student's row once they open every chapter…"`) with:

```ts
it("publishes a student who opened every chapter", async () => {
  setProgress({ solved: ["a1"], openAll: true });
  joinAs("c", "Dana");
  expect(await publishIfChanged("c", course, fake, 100)).toBe("published");
  expect(fake.puts[0].row.hidden).toBe(false);
});
it("turning on every chapter changes nothing on the board", async () => {
  setProgress({ solved: ["a1"] });
  joinAs("c", "Dana");
  await publishIfChanged("c", course, fake, 100);
  setProgress({ solved: ["a1"], openAll: true });
  expect(await publishIfChanged("c", course, fake, 200)).toBe("skipped");
});
it("brings back a row hidden earlier by the old open-all rule, with no new progress", async () => {
  setProgress({ solved: ["a1"], openAll: true });
  joinAs("c", "Dana");
  // What this device recorded when the old rule hid its row.
  writePublished("c", { id: <the joined id>, name: "Dana", summary: summarize(course, readProgress("c")), reachedAt: 100, hidden: true });
  expect(await publishIfChanged("c", course, fake, 200)).toBe("published");
  expect(fake.puts[0].row).toMatchObject({ hidden: false, reachedAt: 100 });
});
```

Use whatever id `joinAs` gives the player (read it with `readPlayer("c")`); import `writePublished`/`readPlayer` from `./player`, `summarize` from `./leaderboard`, `readProgress` from `./progress` if not already imported.

- [ ] **Step 2: Run the tests and see them fail**

Run: `npx vitest run lib/publish.test.ts lib/player.test.ts`
Expected: FAIL on the three new publish tests' open-all cases and on the `shouldAsk` open-all test.

- [ ] **Step 3: Remove the open-all branch**

- `lib/player.ts` `shouldAsk`: drop `|| progress.openAll` and the comment line about students who opened every chapter.
- `lib/publish.ts` `publishIfChanged`: delete `hidden` and the `if (hidden && !mine)` line and its comment; the skip check compares `(mine.hidden ?? false) === false`; send and record `hidden: false`. Keep the comment that `hidden` is always sent because the store merges.

- [ ] **Step 4: Run all unit tests**

Run: `npm test`
Expected: PASS, including the untouched `leaderboard.test.ts` "open-all student reading ahead without solving gains no chapters".

- [ ] **Step 5: Commit**

```bash
git add lib/publish.ts lib/player.ts lib/publish.test.ts lib/player.test.ts
git commit -m "Put students who open every chapter on the leaderboard"
```

### Task 2: Board page, home line, switch hint, browser check, docs

**Files:**
- Modify: `components/board/Leaderboard.tsx` (drop `openAll`, the `useProgress` import if unused, and the `board-off` branch of `standing`)
- Modify: `components/home/BoardRankLine.tsx:17` (drop `|| readProgress(courseId).openAll`, and the `readProgress` import if unused)
- Modify: `components/shell/OpenAllSwitch.tsx` (hint becomes `Skip the order. Your progress is kept either way.`; drop the `FIREBASE_CONFIG` import if unused)
- Modify: `app/board.css:51-52` (delete `.board-off` rules if nothing else uses the class)
- Modify: `scripts/check-board.mjs:223-247`
- Modify: `DESIGN.md:297`, `docs/superpowers/specs/2026-11-19-friends-leaderboard-design.md:19`

**Interfaces:**
- Consumes: Task 1's behavior (open-all students are asked and published).

- [ ] **Step 1: Rewrite the two open-all blocks in `scripts/check-board.mjs`**

Replace them with:
- **"A student who opened every chapter is asked and listed"**: open with `seed: "existing"`, the same open-all progress as today; on `/` the name dialog appears (`appears(dialog(page))`); on `/leaderboard/` a "Join the leaderboard" button shows and no text matches `/Open every chapter/`.
- **"A joined student who then opens every chapter stays on the board"**: same setup as today's second block; after flipping `openAll` and dispatching `study-progress`, wait ~2.5s, then fail if `window.__studyBoard.rows.find((row) => row.id === "viewer")?.hidden === true` or if the "Viewer" `.board-row .board-name` is gone. Then go to `/` and fail if the home rank line (`.board-rank`, or whatever selector the existing home check uses) does not appear.

- [ ] **Step 2: Run it and see it fail**

Run: `npm run build && npm run check:board`
Expected: FAIL on the open-all page message / missing home line.

- [ ] **Step 3: Remove the UI special cases** listed under Files above.

- [ ] **Step 4: Update the docs**

- `DESIGN.md:297`: delete the sentence "a student with "Open every chapter" on sees a quiet line saying why they are not on the board instead of the Join action."
- Friends leaderboard spec line 19: replace the bullet with "**Every student can be on the board, whether or not they open every chapter** (changed by the author, see `2026-11-19-open-all-on-leaderboard-design.md`). Only fully finished chapters count, in any order."

- [ ] **Step 5: Verify**

Run: `npm test && npm run build && npm run check:board`
Expected: all pass. Also run `npm run check:shell` (the switch hint lives in the shell); expected PASS.

- [ ] **Step 6: Commit**

```bash
git add components/board/Leaderboard.tsx components/home/BoardRankLine.tsx components/shell/OpenAllSwitch.tsx app/board.css scripts/check-board.mjs ../../DESIGN.md ../../docs/superpowers/specs
git commit -m "Drop the open-every-chapter notice from the board, home line and switch"
```
