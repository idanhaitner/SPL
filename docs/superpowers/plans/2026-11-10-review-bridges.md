# Review Bridges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six "bridge" review sessions between chapters, each a guided session of recap cards, questions, and coding exercises that combine the previous 2-3 chapters.

**Architecture:** A bridge is a topic with `kind: bridge` in the same ordered topic list as chapters, so locking, resume, and progress reuse the chapter code. It has no reading page: every link goes to `/sessions/<id>/`, where a new `recap` step kind shows a reminder card between the existing question and exercise steps. Chapter numbers skip bridges; a new `pos` field carries list position.

**Tech Stack:** Next.js 15 static export (`study/web`), React 19, vitest, Python exporter (`study/web/scripts/course-export`), markdown content under `study/content`.

**Spec:** `docs/superpowers/specs/2026-11-10-review-bridges-design.md`

## Global Constraints

- All commands run from `study/web` unless a path says otherwise. Tests: `npm test`. Exercises: `npm run check:exercises`. Build: `npm run build`.
- Chapters stay numbered 1-16. A bridge has no number and is labelled "Review".
- A bridge teaches nothing new: every fact on a recap card already appears in a reviewed chapter.
- Every bridge question and exercise is new and needs at least two chapters to answer. Nothing is copied from chapter practice.
- Recap step id is `<bridge-id>--<slug of the section heading>`.
- Per bridge: 3 recap cards, 4-5 questions, 1-2 coding exercises.
- Site copy follows `DESIGN.md` and `PRODUCT.md`; new UI uses existing tokens in `app/greenhouse.css`, no new colours.
- The site is a static export: no redirects. Links to a bridge point at `/sessions/<id>/`.
- Do not change `docs/design/study-flow.md` behaviour for normal chapters; `stepsOf` output for a non-bridge topic must be byte-identical to today.

## Review Focus

1. **A student with saved progress past a bridge's position.** Expected: home's button leads to the bridge, later chapters show locked, `openAll` still opens everything. Test in Task 2.
2. **A bridge section with no problems, or a bridge whose first block is a `##` heading (no intro).** Expected: the recap card still appears; the intro falls back to the standard sentence. Test in Task 1.
3. **Two bridge sections with the same heading.** Expected: the export fails with a clear error instead of producing duplicate step ids. Test in Task 1 (`stepsOf` throws) .
4. **A saved session whose `current` step id no longer exists after content edits.** Expected: `openStep` already ignores unknown ids; add a recap-id case to `session-store.test.ts` in Task 3.
5. **Any surface that still links a bridge to `/topics/<id>/`** (search hits, drawer, bloom dialog, gate, finish screen). Expected: no generated page contains `href="/topics/bridge-`. Checked by grep on `out/` in Task 4.

---

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `study/web/scripts/course-export/export_course.py` | Emits course JSON | Pass `kind`, `reviews`; validate `reviews`; "Review" search hits |
| `study/web/lib/types.ts` | Shared types | `Topic.kind`, `Topic.reviews`, recap `SessionStep` |
| `study/web/lib/steps.ts` | Topic → session steps | Bridge branch with recap steps |
| `study/web/lib/progress.ts` | Progress, locking, resume | `ChapterInfo.kind`/`pos`; bridge rules; `hrefOf`, `nameOf` |
| `study/web/lib/nav.ts`, `lib/parts.ts` | Course navigation | Numbering skips bridges; bridge ids in parts |
| `study/web/app/sessions/[slug]/page.tsx`, `components/session/Stepper.tsx`, `StepStem.tsx` | Session player | Recap step, bridge intro and reread links |
| `study/web/app/topics/[slug]/page.tsx` | Chapter page | No page for bridges |
| `components/home/*`, `components/shell/ChapterBloom.tsx`, `components/chapter/CourseStrip.tsx`, `ChapterGate.tsx`, `app/page.tsx`, `app/glossary/page.tsx` | Surfaces that list chapters | Use `pos`, `hrefOf`, `nameOf`; bridge marker |
| `study/content/topics/bridge-*.md`, `study/content/exercises/ex-bridge-*/`, `study/content/course.yml` | Content | Six bridges |

---

### Task 1: Data model, exporter, and bridge steps

**Files:**
- Modify: `study/web/lib/types.ts`, `study/web/lib/steps.ts`, `study/web/scripts/course-export/export_course.py`
- Test: `study/web/lib/steps.test.ts` (new)

**Interfaces:**
- Produces:
  - `Topic` gains `kind?: "bridge"` and `reviews?: string[]`.
  - `SessionStep` gains `{ kind: "recap"; id: string; title: string; blocks: Block[] }`.
  - `stepsOf(topic: Topic): SessionStep[]` (unchanged signature).
  - `introOf(topic: Topic): Block[]` in `lib/steps.ts`: the blocks before the first level-2 heading.
  - Course JSON topics carry `kind` and `reviews` when the frontmatter has them.

- [ ] **Step 1: Write the failing tests** in `lib/steps.test.ts`. Build topics from literal `Block` values (`heading` level 2, `paragraph`, `directive` name `problem` with `attrs.id`/`attrs.title`).

```ts
it("leaves a normal chapter as questions then exercises", ...)   // same ids and kinds as before, no recap
it("gives a bridge one recap per section, then that section's questions, then exercises", () => {
  // sections "Stack and heap" [para, problem q1], "Pointers" [para, problem q2, problem q3], exercises [ex1]
  expect(stepsOf(bridge).map((s) => `${s.kind}:${s.id}`)).toEqual([
    "recap:bridge-x--stack-and-heap", "question:q1",
    "recap:bridge-x--pointers", "question:q2", "question:q3",
    "exercise:ex1",
  ]);
});
it("strips problem directives from recap blocks and keeps the rest", ...) // recap.blocks has the paragraph, no directive named problem
it("uses the heading text as the recap title", ...)
it("keeps a section that has no problems", ...)                  // still one recap step
it("skips worked problems in a bridge", ...)                     // kind=worked not a step, and stays in recap blocks
it("throws when two sections share a heading", ...)              // message contains the bridge id and the heading
it("introOf returns blocks before the first section, or [] when the file opens on a heading", ...)
```

- [ ] **Step 2: Run** `npx vitest run lib/steps.test.ts`. Expected: FAIL (recap kind and `introOf` do not exist).

- [ ] **Step 3: Implement.** In `types.ts` add the fields and the recap variant. In `steps.ts`, branch on `topic.kind === "bridge"`: split `topic.blocks` at `heading` blocks with `level === 2`; slug the heading with lowercase, non-alphanumerics to `-`, trimmed of `-`. Recap `blocks` are the section's blocks minus top-level `problem` directives whose `attrs.kind !== "worked"`. The non-bridge path is untouched.

- [ ] **Step 4: Exporter.** In `export_course.py` `main()`: add `"kind"` and `"reviews"` to each topic dict from `meta` when `meta.get("kind") == "bridge"`. After topics are built, for each bridge raise `studylib.StudyError` when: `reviews` is empty or not a list; an id in `reviews` is unknown, is itself a bridge, or appears later in the topic order than the bridge. Message format: `"{bridge id}: reviews names {id}, which {reason}"`. For a bridge, emit its chapter-level search hit with `"kind": "Review"` and `"href": f"/sessions/{slug}"`.

- [ ] **Step 5: Verify.** `npx vitest run lib/steps.test.ts` passes; `npm test` passes; `python3 scripts/course-export/export_course.py --root ../.. | python3 -c "import json,sys; json.load(sys.stdin)"` exits 0 (no bridges exist yet, so output is unchanged).

- [ ] **Step 6: Commit** `Add bridge topics and recap steps to the course model`.

---

### Task 2: Numbering, progress, and locking across a bridge

**Files:**
- Modify: `study/web/lib/progress.ts`, `study/web/lib/nav.ts`
- Test: `study/web/lib/progress.test.ts`, `study/web/lib/nav.test.ts` (new)

**Interfaces:**
- Consumes: `Topic.kind`, `stepsOf` (Task 1).
- Produces:
  - `ChapterInfo = { id: string; title: string; num: number; pos: number; stepIds: string[]; kind?: "bridge" }`. `pos` is the 0-based index in the full ordered list. `num` is the chapter number for chapters (bridges not counted) and `0` for a bridge.
  - `hrefOf(chapter: ChapterInfo): string`: `/sessions/<id>/` for a bridge, `/topics/<id>/` otherwise.
  - `nameOf(chapter: ChapterInfo): string`: `"Review"` for a bridge, `"Chapter <num>"` otherwise.
  - `isRead` returns `true` for a bridge. `resumeHref` returns `hrefOf` for a bridge.

- [ ] **Step 1: Write the failing tests.**

`nav.test.ts` (build a `Course` literal with topics `a`, `b`, bridge `r`, `c`):

```ts
expect(courseNav(course).chapters.map((c) => [c.id, c.num, c.pos, c.kind])).toEqual([
  ["a", 1, 0, undefined], ["b", 2, 1, undefined], ["r", 0, 2, "bridge"], ["c", 3, 3, undefined],
]);
```

`progress.test.ts` (extend the `ch` helper with `pos` and an optional `kind`):

```ts
it("a bridge is done once every step is solved, with no read mark", ...)      // isDone true with read: []
it("a bridge with an unsolved step is not done", ...)
it("a bridge blocks the chapter after it until done", ...)                    // isUnlocked false, blockerOf returns the bridge
it("openAll opens past an unfinished bridge", ...)
it("resumes a bridge in its session", ...)                                    // resumeHref === "/sessions/r/"
it("sends a student already past a bridge back to it", ...)                   // chapters a,b done; c done; r not: nextChapter is r when last is c
it("hrefOf and nameOf", ...)                                                  // "/topics/a/", "Chapter 1", "/sessions/r/", "Review"
```

- [ ] **Step 2: Run** `npx vitest run lib/progress.test.ts lib/nav.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement** in `progress.ts` and `nav.ts`. `courseNav` passes `kind` through and computes `num` with a running count of non-bridge topics. `stemParts` keeps using the first chapter of each part.

- [ ] **Step 4: Run** `npm test`. Expected: PASS. `npx tsc --noEmit` will report components that build `ChapterInfo` without `pos`; none should (only `courseNav` builds it), so expect 0 errors.

- [ ] **Step 5: Commit** `Number chapters past bridges and lock across them`.

---

### Task 3: The session player

**Files:**
- Modify: `study/web/app/sessions/[slug]/page.tsx`, `study/web/components/session/Stepper.tsx`, `study/web/components/session/StepStem.tsx`, `study/web/app/topics/[slug]/page.tsx`, `study/web/app/reader.css` (or the stylesheet that holds `.session-reading`)
- Test: `study/web/lib/session-store.test.ts`

**Interfaces:**
- Consumes: recap `SessionStep`, `introOf`, `ChapterInfo.kind`, `hrefOf`, `nameOf`.
- Produces:
  - `StepMeta.kind` is `"question" | "exercise" | "recap"`; `KIND.recap = "Reminder"`.
  - `Stepper` gains props `intro?: ReactNode` and `reviews?: { id: string; title: string }[]`.
  - `next` for both session and topic pages is `{ href: hrefOf(nextChapter), title }`.

- [ ] **Step 1: Test** in `session-store.test.ts`: `openStep(["b--one", "q1"], { current: "b--gone", skipped: [] }, [], null)` returns `0`; with `solved: ["b--one"]` returns `1`.

- [ ] **Step 2: Session page.** Render each recap step's `blocks` into `rendered[step.id]` with the existing `render`. For a bridge pass `intro={render(introOf(topic))}` (omit when empty) and `reviews` resolved from `topic.reviews` to `{ id, title }`.

- [ ] **Step 3: Stepper.** For a step of kind `recap`:
  - content is `rendered[id]` inside `.session-reading`, with class `session-recap` added and a small "Reminder" kicker above it;
  - no "Skip for now" button; Next (or Finish) is always enabled;
  - pressing Next or Finish, or leaving via the step stem, records the id in `solved` with the same `readProgress`/`writeProgress` pattern `onComplete` uses.

  For a bridge (`chapter.kind === "bridge"`):
  - the back link is `<Link href="/">Review</Link>` instead of `Chapter N`;
  - the intro heading is `Review: <title>`; body is `intro` when given, else "This review teaches nothing new. It brings back the last chapters and has you use them together."; below it, "Reviews:" and one link per entry of `reviews` to `/topics/<id>/`;
  - the `reread` node is "Reread:" followed by those same links;
  - the "You haven't finished reading this chapter" line never shows (already true through `isRead`).

- [ ] **Step 4: Topics page.** `generateStaticParams` in `app/topics/[slug]/page.tsx` filters out bridges, and the page calls `notFound()` for one.

- [ ] **Step 5: Style** `.session-recap` with existing tokens: the card reads as a note (the same surface the chapter's definition blocks use), not as a question.

- [ ] **Step 6: Verify.** `npm test` and `npx tsc --noEmit` pass. Browser check is in Task 5, once a bridge exists.

- [ ] **Step 7: Commit** `Play recap steps and bridge intros in the session`.

---

### Task 4: Surfaces that list chapters

**Files:**
- Modify: `components/home/CourseMap.tsx`, `CourseBed.tsx`, `CourseStem.tsx`, `ContinueButton.tsx`, `LeafShape.tsx`, `components/chapter/CourseStrip.tsx`, `components/chapter/ChapterGate.tsx`, `components/shell/ChapterBloom.tsx`, `app/page.tsx`, `app/glossary/page.tsx`, `lib/parts.ts`, `app/greenhouse.css`
- Test: `study/web/lib/nav.test.ts`

**Interfaces:**
- Consumes: `ChapterInfo.pos`, `kind`, `hrefOf`, `nameOf`.

- [ ] **Step 1: Position, not number.** Replace every `states[chapter.num - 1]` with `states[chapter.pos]`, and every comparison of `num` against a position (`chapter.num <= run`, `=== 1`, `=== total` in `CourseBed.tsx`; `partStarts` consumers in `CourseStem.tsx` and `ChapterBloom.tsx`) with `pos`-based equivalents. `stemParts` returns `{ label, pos }` if its consumers index by position; keep the name `num` only where it is the printed number.

- [ ] **Step 2: Links and names.** Replace `/topics/${chapter.id}` with `hrefOf(chapter)` and `Chapter ${chapter.num}` / `chapter ${...num}` wording with `nameOf(chapter)` in: `CourseMap`, `CourseBed`, `CourseStem`, `CourseStrip`, `ChapterGate`, `ChapterBloom`, `ContinueButton` ("Continue review" / "Start review" for a bridge). `ChapterGate` copy for a bridge blocker: "To unlock it, finish the review, <title>: pass every step." `app/glossary/page.tsx` and the home `questionChapter` skip bridges.

- [ ] **Step 3: Bridge marker.** Where a chapter shows its number (`.gh-row-num`, the `Vine`, `LeafShape`'s `num`), a bridge shows no digit: `CourseMap` rows print "Review" in the number slot with class `is-review`; leaf drawings render the bud without a number at the smallest existing size. No new colours.

- [ ] **Step 4: Parts.** In `lib/parts.ts` add the six bridge ids to `ids` at their places (see the table in Task 5 and Task 6). `courseNav` already drops ids that do not exist yet, so this is safe before the content lands. Add a `nav.test.ts` case: a bridge listed in a part appears in `parts[n].chapters` between its neighbours and not in `finale`.

- [ ] **Step 5: Verify.** `npm test`, `npx tsc --noEmit`, `npm run build` pass. `grep -rn "chapter.num - 1\|\.num <= \|/topics/\${chapter" components app` returns nothing.

- [ ] **Step 6: Commit** `Show bridges on the course map, stem, and drawer`.

---

### Task 5: Bridge 1, end to end

**Files:**
- Create: `study/content/topics/bridge-memory-basics.md`, `study/content/exercises/ex-bridge-heap-ledger/{README.md,starter.cpp,solution.cpp,test.cpp}`
- Modify: `study/content/course.yml`

**Interfaces:**
- Consumes: everything above. Content format per the spec's "Content format" section; exercise layout copies `study/content/exercises/ex-swap-values/`.

- [ ] **Step 1: Read** `study/content/topics/run-time-environment.md`, `memory-model.md`, `pointers.md` and their existing practice ids, so nothing is repeated and every recap fact has a home.

- [ ] **Step 2: `course.yml`.** Add after `pointers`:

```yaml
  - id: bridge-memory-basics
    file: topics/bridge-memory-basics.md
    title: "Review: memory and pointers"
    kind: bridge
    exam_weight: taught
    prerequisites: [pointers]
    unlocks: [classes-and-objects]
```

  Set `pointers.unlocks` to `[bridge-memory-basics]` and `classes-and-objects.prerequisites` to `[bridge-memory-basics]`. Add a changelog line dated 2026-11-10.

- [ ] **Step 3: Write the bridge file.** Frontmatter: `id`, `title` (matching `course.yml`), `kind: bridge`, `reviews: [run-time-environment, memory-model, pointers]`, `blurb`, `sources: ["materials/notes/lecture-notes.docx.pdf"]`. Body: a two-sentence intro, then three sections:

| Section heading | Recap covers | Questions (each needs ≥ 2 chapters) |
| --- | --- | --- |
| Where a running program lives | process, address space, the four regions | 1: place each variable of a short program in its region and say when it dies |
| Frames and the heap | call frames, `new`/`delete`/`delete[]`, leaks | 2: trace a function that returns a heap array; mark the leak. 3: which `delete` form, and what is still reachable after it |
| Addresses, pointers, and references | `*`/`&`, pointer steps, pass and return modes | 4: a pointer into a dead frame vs a pointer into the heap. 5: choose the parameter mode for three signatures and say what each copies |

  Questions use `:::problem id=br1-... title="..." kind=exercise solution_origin=derived` with `:::check` parts, like the Practice section of `pointers.md`.

- [ ] **Step 4: Write the exercise** `ex-bridge-heap-ledger` (`chapter: bridge-memory-basics`, `order: 1`): the student writes `int* makeLedger(int n)`, `void deposit(int* ledger, int n, int index, int amount)`, `int total(const int* ledger, int n)`, and `void closeLedger(int*& ledger)` (frees with `delete[]` and nulls the caller's pointer). Tests cover: zero-initialised cells, an out-of-range `deposit` changing nothing, `total` by pointer walk, and `closeLedger` leaving the caller's pointer null.

- [ ] **Step 5: Verify.** `npm run check:exercises` passes for the new exercise. `npm test` and `npm run build` pass. `grep -rl 'href="[^"]*/topics/bridge-' out | wc -l` prints `0`.

- [ ] **Step 6: Browser pass** (`preview_start`, then walk it): home shows the Review marker between chapters 3 and 4 and chapter 4 is locked behind it; the bridge opens at its intro with three chapter links; a recap's Next is enabled and it shows done in the step stem afterwards; one question can be answered; the exercise runs and passes with the solution; the finish screen leads to chapter 4; home's button resumes mid-bridge. Check at phone width and in dark mode.

- [ ] **Step 7: Commit** `Add the first review bridge: memory and pointers`.

---

### Task 6: Bridges 2-6 (content only)

One commit per bridge. Each repeats Task 5's steps 1-5 (read the reviewed chapters, wire `course.yml` between the two neighbours, write the file with three recap sections and 4-5 new questions, write the exercise, verify), with these values:

| # | id / title | Insert after | `reviews` | Reach-back question draws on | Exercise (dir, language, what the student writes) |
| --- | --- | --- | --- | --- | --- |
| 2 | `bridge-objects-and-copies` / "Review: objects that own memory" | `rule-of-three` | `[classes-and-objects, rule-of-three]` | `pointers`, `memory-model` | `ex-bridge-gradebook`, C++: a class owning a raw `int` array with an initializer list, `const` accessors, destructor, deep copy constructor, copy assignment safe under self-assignment |
| 3 | `bridge-ownership-and-polymorphism` / "Review: ownership and polymorphism" | `inheritance` | `[rule-of-five, inheritance]` | `rule-of-three` | `ex-bridge-shape-box`, C++: a container owning `Shape*` items with a virtual destructor in the base, `clone()`, deep copy through `clone`, and a move constructor that leaves the source empty |
| 4 | `bridge-threads-and-safety` / "Review: threads and safe objects" | `design-by-contract` | `[concurrency, design-by-contract]` | `memory-model` (what threads share) | `ex-bridge-java-range`, Java: an immutable `Range` with invariant `lo <= hi`, checked in the constructor, with `widen` returning a new object |
| 5 | `bridge-locks-and-waiting` / "Review: locks and waiting" | `waiting-and-liveness` | `[synchronization, waiting-and-liveness]` | `design-by-contract` | `ex-bridge-java-bounded-queue`, Java: a bounded queue with `put`/`take` using `while` around `wait` and `notifyAll`, keeping `0 <= size <= capacity` |
| 6 | `bridge-servers` / "Review: protocols and servers" | `serialization` | `[networking, reactor, serialization]` | `synchronization` | `ex-bridge-java-length-frames`, Java: a length-prefixed encoder and a decoder that accepts bytes in arbitrary chunks and yields whole messages, feeding a two-command protocol |

- [ ] **Bridge 2**: content, exercise, verify (`npm run check:exercises && npm test && npm run build`), commit.
- [ ] **Bridge 3**: same.
- [ ] **Bridge 4**: same. Java exercise layout copies `study/content/exercises/ex-java-safe-counter/`.
- [ ] **Bridge 5**: same.
- [ ] **Bridge 6**: same.
- [ ] **Final check:** `npm test && npm run check:exercises && npm run build`; `grep -rl 'href="[^"]*/topics/bridge-' out | wc -l` prints `0`; browser look at the home map with all six markers at desktop and phone width.
