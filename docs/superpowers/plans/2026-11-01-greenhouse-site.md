# Greenhouse Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every remaining page onto The Greenhouse and add guided sessions, with in-browser C++ coding for the Memory part.

**Architecture:** One template serves all 16 chapters and one serves all sessions, so Tasks 1 to 5 build the shared shell and those two templates in sequence. Tasks 6 to 12 are independent and run in parallel only after the user approves the reference pages. Code runs through Compiler Explorer from the browser, with no server of our own.

**Tech Stack:** Next.js 15 static export, React 19, Tailwind 4, Shiki, KaTeX, Python content exporter, CodeMirror 6, clang-format (WebAssembly), Vitest, Playwright.

**Spec:** `DESIGN.md`, `docs/design/study-flow.md`, `PRODUCT.md`. Visual reference: `docs/design/sample.html` and the built home page (`study/web/app/page.tsx`, `study/web/app/greenhouse.css`).

**Reuse:** The flow code in `/Users/idanhaitner/Desktop/University/Year B/High Performance Systems Programming/study/` (called REF below) is the user's own and is ported where named. Port behavior and tests only. Never its CSS or class names.

## Global Constraints

- Every color, size, radius, and shadow comes from `DESIGN.md`; tokens live in `study/web/app/greenhouse.css`. No new fonts or colors.
- At most one Bloom (coral) element per screen, and it is the next action. Lime only reports real progress.
- No kicker labels above headings. Monospace only for code and program output. No colored side stripes, gradients on text, or glass.
- Below 640px: 16px gutters and no horizontal page scroll. Interactive targets at least 44px, except inline text links.
- Both themes work through tokens. Nothing is hidden behind animation (motion comes in Phase 6).
- Course content stays English, left to right, with the Hebrew term on first use. Exam years stay hidden. New text follows the existing chapters' plain, beginner-first voice.
- Static export only: no server, no accounts. Progress stays in `localStorage`, with every read and write safe when storage is blocked.
- Any code sent to run is disclosed on screen: "Your code is sent to godbolt.org to compile and run."
- Compiler: `g162` (x86-64 gcc 16.2). Flags: `-std=c++17 -Wall -Wextra -Wno-unused-parameter -O0 -g -fsanitize=address,undefined`. Verified on 2026-11-01 from a browser origin: runs, compile errors, SIGSEGV, and AddressSanitizer all return usable results. Output contains ANSI color codes, which must be stripped.
- Commits go on `redesign-greenhouse`. Nothing is pushed until the user asks.

## Review Focus

1. A student refreshes or returns mid-session: the same step opens and typed code is intact. (Task 4, Task 5)
2. Saved progress from the current live site, or a step id that no longer exists: the page falls back safely instead of crashing or losing other progress. (Task 2, Task 4)
3. The compiler is unreachable, rate limited, or the code loops forever: a plain message appears and the code is untouched. (Task 5)
4. A long code line, wide table, wide formula, or figure on a phone: it scrolls inside its own box and the page never scrolls sideways. (Task 3)
5. An old link or search result pointing at `/topics/<chapter>#<problem-id>`: it lands on that problem's session step. (Task 4)

---

## Part 1: Foundation and references (built one at a time)

### Task 1: Site shell

**Files:**
- Create: `study/web/components/shell/TopBar.tsx`, `CourseDrawer.tsx`, `ThemeToggle.tsx`, `study/web/app/reader.css`
- Modify: `study/web/app/layout.tsx`, `study/web/app/globals.css`, `study/web/app/greenhouse.css`, `study/web/components/home/HomeNav.tsx`
- Delete: `study/web/components/Rail.tsx`, `study/web/components/ReadingProgress.tsx`

**Interfaces:**
- Produces: `TopBar({ courseId, title, chapters, parts, hits, where?: string, tone: "canopy" | "ground" })`, `CourseDrawer({ open, onClose, courseId, parts, finale, chapters })`, and the `ThemeToggle` moved out of `HomeNav`. `CourseMap` is reused inside the drawer.

- [ ] **Step 1: Make the tokens site-wide.** Remove the `:has(.home)` scoping from `greenhouse.css`, so body, selection, scrollbars, and focus use the tokens on every page. Remove the `.landing` shell rules.
- [ ] **Step 2: Build `TopBar` and `CourseDrawer`.** Per `DESIGN.md` Navigation: one bar, and a drawer with focus kept inside it, Esc to close, focus returned to the Course button, and page scroll locked while open.
- [ ] **Step 3: Replace `Rail` in `layout.tsx`.** `HomeNav` becomes `TopBar` with `tone="canopy"`.
- [ ] **Step 4: Write a Playwright check `scripts/check-shell.mjs`.** At 1440 and 390: the Course button opens the drawer, Esc closes it and returns focus, every chapter is reachable from it, and no page overflows sideways. Add `"check:shell"` to `package.json`.
- [ ] **Step 5: Run `npm run build`, serve `out/`, and run `npm run check:shell` and `npm run audit`.** Expected: all pass. Update `audit.mjs` selectors that named `Rail`.
- [ ] **Step 6: Commit.**

**Acceptance:** every page has one bar and no sidebar; the 16 chapters are reachable in two actions; the theme choice persists across pages.

### Task 2: Progress model

**Files:**
- Create: `study/web/lib/progress.test.ts`, `study/web/vitest.config.ts`
- Modify: `study/web/lib/progress.ts`, `study/web/package.json`, `study/web/components/home/*`, `.github/workflows/pages.yml`

**Interfaces:**
- Produces, in `lib/progress.ts`:
  - `Progress = { solved: string[]; last?: string; seen?: string[]; read?: string[] }`
  - `ChapterInfo = { id; title; num; stepIds: string[] }`, where `stepIds` replaces `practiceIds` and lists every session step
  - `isRead(chapter, progress)`, `isDone(chapter, progress)`, `markRead(courseId, chapterId)`
  - `nextChapter(chapters, progress)` and `resumeHref(chapter, progress): string`

Until Task 4 adds sessions, `stepIds` is filled from `topic.practiceIds`.

- [ ] **Step 1: Add Vitest (`"test": "vitest run"`, `jsdom` environment) and write the failing tests.**

```ts
const ch = (id, stepIds = []) => ({ id, title: id, num: 1, stepIds });
it("opening a chapter does not make it read", () => { expect(isRead(ch("a"), { solved: [], seen: ["a"] })).toBe(false); });
it("done needs read and every step", () => {
  expect(isDone(ch("a", ["s"]), { solved: ["s"], read: [] })).toBe(false);
  expect(isDone(ch("a", ["s"]), { solved: ["s"], read: ["a"] })).toBe(true);
});
it("a chapter with no steps is done once read", () => { expect(isDone(ch("a"), { solved: [], read: ["a"] })).toBe(true); });
it("keeps a live-site student's finished chapter", () => { expect(isRead(ch("a", ["s"]), { solved: ["s"], seen: ["a"] })).toBe(true); });
it("resumes in the session once read", () => { expect(resumeHref(ch("a", ["s"]), { solved: [], read: ["a"] })).toBe("/sessions/a/"); });
it("survives broken storage shapes", () => { localStorage.setItem("study:c", '{"solved":"x","read":3}'); expect(readProgress("c")).toEqual({ solved: [], last: undefined, seen: [], read: [] }); });
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement.** `isRead` is true when `read` includes the id, or when the id is in `seen` and it has steps that are all solved. That second case carries forward students from the live site. Update `chapterState`, `CourseStem`, `CourseMap`, and `ContinueButton` to use these, with the button linking to `resumeHref`.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Add `npm test` to the build job in `pages.yml`, before `npm run build`.**
- [ ] **Step 6: Commit.**

**Acceptance:** the four states in `docs/design/study-flow.md` hold on home; existing `study:systems-programming` data still loads.

### Task 3: Reference chapter page

**Files:**
- Create: `study/web/components/chapter/Masthead.tsx`, `SectionStem.tsx`, `FinishReading.tsx`, `CodePanel.tsx`
- Modify: `study/web/app/topics/[slug]/page.tsx`, `study/web/components/Chapter.tsx`, `SectionSwitch.tsx`, `Blocks.tsx`, `CheckCard.tsx`, `CodeBlock.tsx`, `study/web/lib/highlight.ts`, `study/web/app/reader.css`

**Interfaces:**
- Consumes: `markRead`, `isRead`, tokens, `CourseStem` from earlier tasks.
- Produces: `CodePanel({ html, lang, file?, output?, markedLine? })`, used by every code surface. `FinishReading({ courseId, chapter, sessionHref, nextHref })`.

- [ ] **Step 1: Layout.** Three zones per `DESIGN.md` Layout, against `docs/design/sample.html`. Sections show one at a time as today (`SectionSwitch`), with URL hash kept. Folds open by default.
- [ ] **Step 2: Components.** Definition (plant label), trap (rust), standalone checks (margin at 1280px and up, inline below), worked examples, tables, KaTeX, inline code. `CodePanel` per `DESIGN.md` Code Blocks, including copy without line numbers. Map Shiki's `--code-*` to the `code-*` tokens.
- [ ] **Step 3: Move practice out.** A chapter renders only `kind=worked` problems. The Practice section is replaced by `FinishReading`, which records read and leads to the session. Until Task 4 lands it leads to the next chapter.
- [ ] **Step 4: Add `scripts/check-chapter.mjs`.** For all 16 chapters at 390 and 1440, in both themes: no page overflow, every `<pre>`, table, and `.math-display` scrolls inside itself, no console errors, and the section stem marks the current section. Also load `pointers` with its longest code block at 320px.
- [ ] **Step 5: Run the build, `check:chapter`, and `audit`.** Expected: pass.
- [ ] **Step 6: Commit.**

**Acceptance:** the pointers chapter matches `sample.html`; all 16 chapters pass; reading position returns to the same section by URL.

### Task 4: Reference session page (questions)

**Files:**
- Create: `study/web/app/sessions/[slug]/page.tsx`, `study/web/components/session/{Stepper,StepStem,SessionBar,QuestionStep,SessionIntro,SessionFinish}.tsx`, `study/web/lib/session-store.ts`, `study/web/lib/session-store.test.ts`, `study/web/scripts/course-export/test_sessions.py`
- Modify: `study/web/scripts/course-export/export_course.py`, `studylib.py`, `study/web/lib/types.ts`, `lib/course.ts`, `components/CheckCard.tsx`, `app/topics/[slug]/page.tsx`
- Port from REF: `web/lib/session-store.ts` and its test, and `Stepper` behavior

**Interfaces:**
- Produces: `SessionStep = { kind: "question"; id: string; block: Block } | { kind: "exercise"; id: string; exercise: Exercise }` and `Topic.steps: SessionStep[]`. The steps are the chapter's non-worked problems in file order, then its exercises by `order`. A chapter with no steps has no session and no `/sessions/` route. Step ids equal problem ids and exercise ids, and completion is stored in `Progress.solved`.
- `readSession(courseId, chapterId)`, `writeSession`, `resumeStep(stepIds, state)` as in REF, with `SessionState = { step: number; skipped: string[] }`.

- [ ] **Step 1: Write failing tests.** In `session-store.test.ts`: `resumeStep` skips solved and skipped ids, returns `length` when all are handled, and ignores a stored id that is gone. In `test_sessions.py`: pointers yields one step per non-worked problem, and worked problems are excluded.
- [ ] **Step 2: Run `npm test` and `python3 -m unittest discover -s scripts/course-export -p 'test_*.py'`.** Expected: FAIL.
- [ ] **Step 3: Implement the exporter and store.** A question step is complete when all its checks are correct. A problem with no checks offers "Mark as done".
- [ ] **Step 4: Build the route and step UI** per `DESIGN.md` Guided Session Steps, including the phone stem. On arrival `?step=<id>` opens that step. `/topics/<chapter>#<problem-id>` redirects on the client to that step, and search hits for practice link there directly.
- [ ] **Step 5: Add `scripts/check-session.mjs`.** On pointers: a wrong answer shows rust and keeps Next locked; a right answer unlocks Next and turns the step leaf lime; Skip marks it dormant; reload reopens the same step; the finish screen links to the next chapter; home's button returns to the open step; and an old `#problem-id` link lands on its step.
- [ ] **Step 6: Run everything.** Expected: pass.
- [ ] **Step 7: Commit.**

**Acceptance:** a student can go from home, through a chapter, through its session, to the next chapter without choosing where to go. Every chapter with problems has a working session.

### Task 5: Coding workspace and first exercise

**Files:**
- Create: `study/web/components/session/{ExerciseStep,CodeStep,Editor,QuestionPanel,ResultsPanel,OutcomeView,Split}.tsx`, `study/web/lib/{godbolt,run-result,test-output,test-verdict,split,format}.ts` and their tests, `study/web/scripts/check-exercises.ts`, `study/content/exercises/harness.h`, `study/content/exercises/ex-swap-values/{README.md,starter.cpp,test.cpp,solution.cpp}`
- Modify: `studylib.py`, `export_course.py`, `package.json`, `.github/workflows/pages.yml`
- Port from REF: all named `lib` files with tests, `Editor`, `Split`, `QuestionPanel`, `ResultsPanel`, `OutcomeView`, `CodeStep`, `check-exercises.ts`, and `harness.h`. Drop `AsmView` and labs.

**Interfaces:**
- Consumes: `SessionStep` exercise kind, `CodePanel` colors.
- Produces: exercise folder format. README front matter: `title`, `chapter` (topic id), `order` (number). Body uses `:::example` and `:::hint`, as in REF. `test.cpp` holds `main` and prints one `PASS <name>` or `FAIL <name>: <message>` per case. No exercise is listed in `course.yml`, so parallel content tasks never edit the same file.

- [ ] **Step 1: Port the lib files and tests, changing C to C++.** `GODBOLT_COMPILER = "g162"`, the flags from Global Constraints, C++ language in `Editor`, `.cpp` for the formatter. Remove `compileAsm`.
- [ ] **Step 2: Add failing tests for this project's cases.** `classifyRun` strips ANSI codes from stderr. An AddressSanitizer report becomes a plain sentence naming memory misuse. Exit 139 explains a segmentation fault. A timeout says the program ran too long.
- [ ] **Step 3: Run `npm test`, then implement until it passes.**
- [ ] **Step 4: Build the workspace** per `DESIGN.md` Guided Session Steps, with only Run, Submit, and Reset as code actions, hints and solution in the question panel, and the godbolt note. CodeMirror uses the code tokens and loads only on session pages. Saved code is restored on load.
- [ ] **Step 5: Write `ex-swap-values`** for the pointers chapter, with at least 3 test cases and at least 1 example.
- [ ] **Step 6: Port `check:exercises`.** It compiles with local `g++ -std=c++17`, and fails unless every solution passes all cases, every starter fails at least one, and every exercise has at least 1 example. Add it to `pages.yml`.
- [ ] **Step 7: Extend `check-session.mjs` using a mocked network** (`page.route` on godbolt.org): a passing submit unlocks Next; a 429 shows the wait; an aborted request shows Retry; code survives all of them and a reload. Then do one real run against godbolt.org by hand and record the result.
- [ ] **Step 8: Run everything.** Expected: pass.
- [ ] **Step 9: Commit.**

**Acceptance:** the sample page's workspace is real. At 1024x768 question, editor, and actions are all visible without page scroll. All controls work by keyboard, including leaving the editor and moving the divider.

### Checkpoint: the user reviews the reference chapter and session pages before Part 2 starts.

---

## Part 2: Parallel work (each task gets DESIGN.md, study-flow.md, and the two reference pages)

### Task 6: Glossary and 404

**Files:** Modify `study/web/app/glossary/page.tsx`. Create `study/web/app/not-found.tsx`. Add styles to `reader.css`.

- [ ] **Step 1: Rebuild the glossary** with a Masthead, terms grouped by part then chapter, and each term linking to its chapter.
- [ ] **Step 2: Build the 404** in the canopy field, with one Bloom action back to home.
- [ ] **Step 3: Extend `check-shell.mjs`** to cover both pages at 390 and 1440 in both themes. Run it. Expected: pass.
- [ ] **Step 4: Commit.**

**Acceptance:** all glossary anchors still resolve; a mistyped URL shows the 404 under the production base path.

### Task 7: Search

**Files:** Modify `study/web/components/SearchBox.tsx`, `scripts/course-export/export_course.py`, `lib/course.ts`, `app/layout.tsx`. Create `study/web/lib/search.ts`, `lib/search.test.ts`.

**Interfaces:** Produces `matchHits(hits, query): SearchHit[]`. The index moves to a static `search.json`, fetched on first focus, and is removed from the page HTML (it is currently 41% of it).

- [ ] **Step 1: Write failing tests.** Hebrew term `מצביע` finds the pointers chapter; a query is case-insensitive; empty returns nothing; bidi marks are ignored.
- [ ] **Step 2: Run, then implement.** The exporter indexes chapter body text and Hebrew terms. Results are keyboard navigable with arrows and Esc. Practice hits link to session steps.
- [ ] **Step 3: Run `npm test` and a browser check for loading failure.** If `search.json` fails, search says so plainly.
- [ ] **Step 4: Commit.**

**Acceptance:** `out/index.html` no longer contains the index; search works under the production base path.

### Task 8: Figures

**Files:** Modify all 25 `study/web/public/figures/*.svg` and `study/web/components/Blocks.tsx`. Create `study/web/components/Figure.tsx`.

**Interfaces:** Produces `Figure({ src, alt })`, a server component that inlines the SVG so its colors can use CSS variables. The alt text becomes the SVG's accessible name.

- [ ] **Step 1: Map the 25 hard-coded colors** onto roles in `greenhouse.css` (`--fig-ink`, `--fig-rule`, `--fig-fill`, `--fig-accent`, `--fig-accent-fill`), defined for both themes, and replace them in each file.
- [ ] **Step 2: Remove the light plate** from `DESIGN.md` Do's and from the figure styles.
- [ ] **Step 3: On phones, give any figure whose text would render under 11px a `min-width` and let it scroll inside a focusable box.**
- [ ] **Step 4: Run `npm run audit`, which already checks figure text overlap, and capture every figure in both themes.** Expected: audit passes and all are legible by eye.
- [ ] **Step 5: Commit.**

**Acceptance:** no figure contains the old blue; all are readable in dark theme without a plate.

### Tasks 9 to 11: C++ exercises

Each task writes exercises in the Task 5 format, with its source from `practice/PSxx*.cpp`, `practice/solutions/`, and the chapter text. Exercises teach only what their chapter and earlier ones have covered. `npm run check:exercises` must pass and each must be solved once in the browser against the real compiler.

- **Task 9:** `run-time-environment` and `memory-model`, at least 2 each (PS1, PS2).
- **Task 10:** `pointers` (1 more, joining `ex-swap-values`) and `classes-and-objects`, at least 2 (PS2, PS3).
- **Task 11:** `rule-of-three`, `rule-of-five`, and `inheritance`, at least 2 each (PS3, PS4).

**Files:** Create `study/content/exercises/ex-*/`. No other files.

**Acceptance:** at least 14 exercises across the 7 Memory chapters; none needs threads or sockets; memory errors in a wrong answer produce the plain AddressSanitizer message.

### Task 12: Fill empty sessions

**Files:** Modify `study/content/topics/classes-and-objects.md`, `serialization.md`, `concurrency.md`.

- [ ] **Step 1: Write at least 4 practice problems each** with `:::check` blocks, explanations, and sources, in the existing format and voice, testing only what the chapter teaches. Add no exam-kind labels to new questions.
- [ ] **Step 2: Run `npm run build` and `check:session`.** Expected: pass, and each chapter has a session.
- [ ] **Step 3: Commit.**

**Acceptance:** only `course-review` has no session. The user reads the new questions, since they are new teaching content.

---

## Part 3: Finish

### Task 13: Remove the old design

**Files:** Modify `study/web/app/globals.css`, `tokens.css`, `base.css`, `layout.tsx`, `scripts/audit.mjs`, `DESIGN.md`. Replace `study/web/app/favicon.ico`, `apple-icon.png`.

- [ ] **Step 1: Delete all old selectors and tokens,** the old fonts (Familjen Grotesk, IBM Plex Sans, IBM Plex Sans Hebrew), and the `.key` styles.
- [ ] **Step 2: Generate the icons from `app/icon.svg`.**
- [ ] **Step 3: Run all checks and `impeccable detect`.** Expected: pass, with no finding referencing an old token.
- [ ] **Step 4: Refresh `DESIGN.md` and write `.impeccable/design.json`** from what actually shipped, using the impeccable documenter.
- [ ] **Step 5: Commit.**

**Acceptance:** `grep -r "color-accent\|font-familjen\|font-plex" study/web/app study/web/components` returns nothing.

Phase 6 (motion) and Phase 7 (full verification) follow as their own phases.
