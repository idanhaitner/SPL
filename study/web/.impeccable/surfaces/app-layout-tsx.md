---
version: 1
slug: "app-layout-tsx"
primary_target: "app/layout.tsx"
related_targets: ["app/page.tsx","app/topics/[slug]/page.tsx","app/glossary/page.tsx"]
---

Scope: the whole study site (home, chapter, glossary). Mode: Read.

Audience and job: SPL students reading the week's chapter straight through, then checking themselves on practice. Must never look like a template; must stay comfortable for long reading.

## Direction contract

THESIS: The guide is a tabbed reference manual. The course's four parts are coloured divider boards, stepped down the fore edge by length; each chapter is a milk reading leaf hinged at a punched edge over its part's board. It refuses the docs-site default of a white page, grey sidebar tree and one brand blue.

OWN-WORLD: Board hues per part: oxide orange (I, memory in C++), chrome yellow (II, concurrency in Java), teal (III, communication), ultramarine (IV, databases), violet (review), and sienna, from the same divider wheel, as the cover board for the home page and glossary. Milk leaf, near-black print ink, hairline rules. Archivo for heads and labels (condensed caps for tabs), Source Serif 4 for reading, JetBrains Mono for code. State is a mark, not a hue: open box, filled box, punched hole for the current place.

STORY: The reader always sees which part they are in (the board) and how far the course runs (the tabs), reads one leaf calmly, checks themselves, then turns to the next leaf.

FIRST VIEWPORT: Desktop: board fills the window; a fore-edge tab rail at the right with five stepped tabs, the current one extended into the board. On the board, the leaf: punched holes at its left edge, a contents column (current part's chapters, search, glossary) and the reading column at about 68 characters; chapter number in board hue over a large Archivo title. Phone: tabs become a stepped strip under a slim header; the leaf runs full width.

FORM: Tabbed reference manual (challenger, catalog rw-manual-acetate-tab-board), chosen over the assigned Programmer's Manual. seed:7fdb13b015c0e9b9

Signature interaction: turning a section or chapter hinges the leaf from its punched edge (short, ease-out, transform and opacity only); tab hover lifts the tab a few pixels out of the fore edge on pointer devices. Motion grammar: Emil Kowalski's rules; nothing ambient, nothing over 300ms in UI, reduced motion keeps fades only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
