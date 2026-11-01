---
target: home page
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/idanhaitner/Desktop/University/Year B/SPL/study/web/app/page.tsx"
target_fingerprint: "sha256:f2233701d0950695daa195412138ece18e90256d9394e39cd50da5e5d0a71f1c"
target_path: /Users/idanhaitner/Desktop/University/Year B/SPL/study/web/app/page.tsx
timestamp: 2026-11-01T12-38-09Z
slug: study-web-app-page-tsx
---
Method: two isolated sub-agents, run one after the other at the user's request (no parallel agents before Phase 5).

Score before fixes: 23/32 (72%, Good). Heuristics 7 and 10 n/a. Not rescored after fixes.

Design specificity: the hero was authored for this product; the lower page drifted generic.

Priority issues, all addressed:
- P1: the stem showed order, not content. Added part labels, part nodes, next chapter under the button, leaf titles on hover or focus, and outlines on unopened leaves.
- P1: 16 links came before the headline and main action. Moved the stem after them in source order, and made the focus ring leaf-shaped.
- P1: progress ignored reading and treated opening a practice-free chapter as done. Added a read state.
- P2: the course map left the world and gave no start signal. One column threaded on a stem, with chapter 1 marked Start here.
- P2: small-screen navigation and finished-state copy. Glossary stays in the nav, button width is capped, closing copy follows progress.

Detector: 0 findings on source and rendered URL, including the production build. axe: 3 landmark issues fixed; a contrast report was verified as a false positive (14.17:1 measured) and did not recur on the final run.

Open: whether a chapter with no practice should need an explicit mark-as-read; search misses Hebrew terms such as מצביע; favicon.ico and apple-icon.png still show the old mark.
