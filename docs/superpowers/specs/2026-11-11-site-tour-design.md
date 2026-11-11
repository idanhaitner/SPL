# First-visit site tour

## Goal
A guided spotlight tour shown once to every visitor (including people who already read chapters), replayable on demand. The home page has little to show, so the tour spends one short stop there and then walks through a real chapter and a real guided session, including its questions and the code editor.

## Behaviour
- The home page starts the tour about 1.2s after load when `localStorage["study:tour"]` is unset. The key is independent of reading progress.
- Finishing or skipping sets the key. A "Tour" button in the top bar and the footer replays it (from other pages it goes to `/#tour`).
- It starts only from the home page, so shared links to chapters are never interrupted.
- Steps (13):
  - Home: welcome; the path of chapters (finished chapters light up, reviews become flowers); Continue.
  - Chapter 1 reading page: sections; the lesson; the link to the guided session.
  - Chapter 1 session: the intro; questions (the tour clicks "Start step 1"); the step leaves; a coding exercise (the tour jumps to the last step); the editor; Run and Submit, with the note that code is compiled on godbolt.org.
  - Back home: done.
- Steps are anchored by CSS selector. A step whose element does not appear (a session already under way, a hidden desktop-only element) is skipped after a short wait.
- The tour opens real pages, so it snapshots the visitor's `study:<course>*` localStorage keys first and restores them when it ends or is skipped, and on the next page load if the tab was reloaded mid-tour. Visiting a chapter or session during the tour therefore leaves no trace in progress.
- Keyboard: arrows move, Esc skips, focus moves to the card, Tab stays on it.
- Phone: the card docks to the bottom. Under `prefers-reduced-motion` the tour still runs, without transitions.

## Parts
- `lib/tour.ts`: steps, seen flag, snapshot/restore, step filtering (unit tested).
- `components/tour/TourLauncher.tsx`: mounted in the root layout so it survives navigation; first-visit check, `#tour`, replay event.
- `components/tour/TourSpotlight.tsx`: overlay, hole, card, navigation between pages, waiting for elements.
- `components/tour/TourLink.tsx`, `components/tour/anchor.ts`, `app/tour.css`.

## Out of scope
Translations, analytics, touring other chapters, and a check-question stop (chapter 1's reading has no inline checks; practice lives in the session).
