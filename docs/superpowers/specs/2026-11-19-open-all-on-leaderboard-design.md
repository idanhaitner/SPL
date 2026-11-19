# Open-all students on the leaderboard: design

Date: 2026-11-19 · A small change to [the friends leaderboard](2026-11-19-friends-leaderboard-design.md).

## Why

Today a student who turns on "Open every chapter" is kept off the board. They are never asked to join, and a row that already joined is hidden while the switch is on. The author wants these students on the board like everyone else.

## The rule (author's decision)

The board counts **finished chapters**, in any order, for every student: read to the end and every practice question solved. That is what `summarize` already does today, so scoring does not change. Opening or reading a chapter without solving its practice never counts.

## What goes away

Open-all is no longer a special case anywhere on the board:

- `publishIfChanged` stops hiding rows for open-all students. A row hidden earlier because of the switch is sent again with `hidden: false` on the next publish, so it comes back by itself. `hidden` stays for "Leave the leaderboard".
- `shouldAsk` asks open-all students to join, by the same rules as everyone else.
- The leaderboard page drops the "You've turned on Open every chapter, so you're not on the leaderboard" message.
- The home rank line (`BoardRankLine`) shows for open-all students.
- The switch's hint drops ", but you leave the leaderboard while it is on".
- `DESIGN.md` and the leaderboard design doc's decision "Only students who take the chapters in order are on the board" are updated to the new rule.

## Approaches

| Approach | Trade-off | Verdict |
| --- | --- | --- |
| **Count finished chapters in any order, for everyone** | Simplest: no scoring change, only removing the open-all special case. A student who skips around still has to finish each chapter fully for it to count. | **Chosen by the author.** |
| Count only the unbroken run of finished chapters from chapter 1 | Can't be helped by skipping, but can feel harsh (finishing 1–3 and 5–16 shows 3) and needs extra explaining in the UI. | Rejected by the author. |
| Count everything, with a badge for open-all students | Badge adds UI for little gain. | Rejected. |

## My calls (author may correct)

- `solved` (the tie-break) and `current` ("now on") stay as they are today.
- No new Firestore fields and no rule changes.

## Testing

- Unit tests: `shouldAsk` asks an open-all student; `publishIfChanged` publishes an open-all student and un-hides a row hidden earlier because of the switch. Existing tests that expect open-all to be hidden are changed to the new behavior.
- `scripts/check-board.mjs` updated from "open-all is hidden" to "open-all appears".
- `npm test` and `npm run build` pass.
