# Review bridges: design

Date: 2026-11-10

## Purpose

The student forgets earlier chapters while moving through the course. A **bridge** is a stop between chapters that brings the last 2-3 chapters back: short reminders of what was learned, followed by questions and coding exercises that need those chapters together. The only look-back today is `course-review`, at the very end.

Success: after a bridge, the student has re-used every reviewed chapter at least once, in problems that no single chapter's practice already asked.

## Decisions made with the student

- Six bridges, one every 2-3 chapters, never crossing a part.
- Reminders cover the chapters just finished. Most exercises combine those chapters; one or two per bridge reach back to earlier chapters in the same language.
- A bridge is a guided session, not a reading page. Reminders are steps inside the session.
- A bridge is a topic of kind `bridge` that reuses the chapter machinery (approach A). A separate bridge system and a plain 17th-chapter approach were rejected.

## Principles

- A bridge teaches nothing new. Every fact on a recap card already appears in a reviewed chapter.
- Every bridge question and exercise is new, and needs at least two chapters to answer. Nothing is copied from chapter practice.
- `docs/design/study-flow.md` still holds: one step at a time, earned Next, guilt-free Skip, resume by step id.

## Content format

A bridge is one markdown file in `study/content/topics/`, named `bridge-<name>.md`.

Frontmatter:

```yaml
---
id: bridge-memory-basics
title: "Review: memory and pointers"
kind: bridge
reviews: [run-time-environment, memory-model, pointers]
blurb: "..."
sources: [...]
---
```

`course.yml` lists the bridge in `topics:` at its place in the order, with `kind: bridge`, and the `prerequisites` / `unlocks` chain of its neighbours is rewired through it.

Body:

- An opening paragraph is the session intro text.
- Each `##` section is one **recap card**: a few bullets, at most one small code sample, and `topic:` links to the chapters it summarises.
- `:::problem` blocks inside a section (not `kind=worked`) are question steps that follow that card, in the format chapters already use.
- Coding exercises live in `study/content/exercises/<id>/` with `chapter: <bridge-id>` in the README frontmatter, exactly as chapter exercises do. They come last.

Target size per bridge: 3 recap cards, 4-5 questions, 1-2 coding exercises, about 20-25 minutes.

## Data model

- `Topic` gains `kind?: "bridge"` and `reviews?: string[]`. The exporter (`scripts/course-export/export_course.py`) passes both through from frontmatter. Validation in `studylib.py`: every id in `reviews` is a real, earlier, non-bridge topic; a bridge has at least one non-worked problem or exercise.
- `SessionStep` gains a third kind: `{ kind: "recap"; id; title; blocks }`.
  - `id` is `<bridge-id>--<slug of the section heading>`, so it is stable when sections are reordered.
  - `blocks` are the section's blocks with its problem directives removed.
- `stepsOf(topic)` for a bridge returns, per section in file order, the recap step then that section's question steps, and finally the exercises. For a normal chapter it is unchanged.
- `ChapterInfo` gains `kind?: "bridge"`. `num` counts only non-bridge topics, so chapters stay 1-16; a bridge has no number.
- `PARTS` in `lib/parts.ts` lists each bridge id inside its part, in order.

## Player

- A bridge has no reading page. `app/topics/[slug]` does not generate params for bridges, and every link to a bridge (home map, drawer, search, the previous session's finish screen, the resume button) points at `/sessions/<bridge-id>/`.
- The session page renders recap steps through the existing `Blocks` renderer.
- In `Stepper`, a recap step shows the card with Next always enabled, and no hints, Skip, or checks. Pressing Next records the step id in `solved`, the same list other steps use, so the step stem, resume, and completion need no special case.
- The intro screen names the reviewed chapters, each linked to its chapter page.
- The finish screen is the existing one and leads to the next chapter.

## Progress and locking

- A bridge has no "read" state. `isRead` returns true for a bridge, so `isDone` is "every step is in `solved`" (recap steps included, since passing them records them).
- `isUnlocked`, `blockerOf`, and `nextChapter` work on the ordered list and need no change: a bridge unlocks when everything before it is done, and blocks what follows until it is done. `openAll` opens bridges too.
- `resumeHref` returns the session URL for a bridge.
- **Existing students keep going.** A bridge is waived for a student who is already past it: once a later chapter has been read, or any of its steps solved, the bridge no longer blocks anything and is never offered as the next step. It stays open to do whenever they like, shows as "Optional" on the map, as an open berry on the stem, and its intro says so. A new student has gone past nothing, so they have to cross every bridge. `openAll` opens the chapters but does not waive a bridge.

## Where a bridge appears

- **Home map and course drawer:** between its chapters, as a smaller marker than a chapter leaf, labelled "Review", with no number. It uses existing tokens from `DESIGN.md`; the exact shape is settled during implementation with a browser check.
- **Search:** bridge questions are indexed with kind "Review" and link to the session. Bridges add no glossary terms.
- **Course strip / top bar:** show "Review" where a chapter number would be.

## The six bridges

| # | id | After | Reviews | Reaches back to | Coding exercise |
| --- | --- | --- | --- | --- | --- |
| 1 | `bridge-memory-basics` | pointers | run-time-environment, memory-model, pointers | none | Build and release a heap array through pointers, with the right parameter passing |
| 2 | `bridge-objects-and-copies` | rule-of-three | classes-and-objects, rule-of-three | pointers, stack vs heap | A class owning a raw array: initializer list, `const` methods, destructor, deep copy, assignment |
| 3 | `bridge-ownership-and-polymorphism` | inheritance | rule-of-five, inheritance | rule-of-three | A container owning polymorphic objects: virtual destructor, `clone`, move |
| 4 | `bridge-threads-and-safety` | design-by-contract | concurrency, design-by-contract | what threads share (stack vs heap) | A Java class with a stated invariant, made safe by immutability |
| 5 | `bridge-locks-and-waiting` | waiting-and-liveness | synchronization, waiting-and-liveness | invariants and contracts | A bounded queue with `wait` / `notifyAll` that keeps its invariant |
| 6 | `bridge-servers` | serialization | networking, reactor, serialization | synchronization | A length-prefixed encoder/decoder feeding a small command protocol |

Databases has one chapter followed by `course-review`, so it gets no bridge.

## Build order

1. The mechanism plus bridge 1, complete and usable.
2. Bridges 2-6 as content only.

## Testing

- Unit tests (vitest): `stepsOf` for a bridge (order, recap ids, problems stripped from recap blocks); `courseNav` numbering skips bridges; `isDone` / `isUnlocked` / `resumeHref` across a bridge.
- `scripts/check-exercises.ts` runs every bridge exercise's solution against its tests.
- Exporter validation rejects a bad `reviews` id.
- Browser pass through bridge 1: home map marker, intro, recap Next, a question, a coding exercise, finish screen, resume from home.

## Out of scope

- Spaced repetition or scheduling of reviews by date.
- Reusing or randomly sampling existing chapter questions.
- A bridge for the Databases part.
