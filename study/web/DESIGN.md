---
name: Systems Programming Study Guide
description: A tabbed reference manual for SPL; coloured divider boards per course part, a milk reading leaf punched at its bound edge.
colors:
  cover-sienna: "#7a3519"
  oxide-orange: "#b5441a"
  oxide-orange-ink: "#9a3410"
  chrome-yellow: "#f0b400"
  chrome-yellow-ink: "#775600"
  board-teal: "#0e7279"
  board-teal-ink: "#0b6168"
  ultramarine: "#2f43b5"
  review-violet: "#6b3fb8"
  review-violet-ink: "#5b33a3"
  on-board-light: "#ffffff"
  milk-leaf: "#f7f7f2"
  sheet: "#fdfdfb"
  print-ink: "#17181b"
  muted-ink: "#55585f"
  hairline: "#d6d6ce"
  hairline-strong: "#a9a9a0"
  field: "#eeeee7"
  danger: "#b4232f"
  code-ground: "#17181b"
  code-head: "#23252b"
  code-ink: "#e8e8e3"
  code-muted: "#a2a5ad"
  code-gutter: "#7d818a"
typography:
  display:
    fontFamily: "Archivo, Heebo, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 5.5vw, 4.25rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 92"
  headline:
    fontFamily: "Archivo, Heebo, system-ui, sans-serif"
    fontSize: "clamp(2.35rem, 4.4vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 92"
  title:
    fontFamily: "Archivo, Heebo, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title-sm:
    fontFamily: "Archivo, Heebo, system-ui, sans-serif"
    fontSize: "1.22rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Source Serif 4, Frank Ruhl Libre, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
  lead:
    fontFamily: "Source Serif 4, Frank Ruhl Libre, Georgia, serif"
    fontSize: "1.22rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, Heebo, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.1em"
  tab-label:
    fontFamily: "Archivo, Heebo, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    letterSpacing: "0.07em"
    fontVariation: "'wdth' 78"
  ui:
    fontFamily: "Archivo, Heebo, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 500
    lineHeight: 1.3
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  mark: "1px"
  numeral: "2px"
  leaf: "3px"
  control: "4px"
  tab: "6px"
  hole: "50%"
spacing:
  tab-gap: "3px"
  gutter: "1.75rem"
  punch: "2.25rem"
  tabs: "3.5rem"
  contents: "17rem"
  reading: "44rem"
  card-pad: "1.1rem 1.25rem 1.15rem"
  section-gap: "2.75rem"
components:
  button:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.print-ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "0.4rem 1rem"
    height: "2.6rem"
  button-pressed:
    backgroundColor: "{colors.print-ink}"
    textColor: "{colors.milk-leaf}"
    rounded: "{rounded.control}"
  fore-edge-tab:
    backgroundColor: "{colors.oxide-orange}"
    textColor: "{colors.on-board-light}"
    typography: "{typography.tab-label}"
    rounded: "{rounded.tab}"
    width: "2.5rem"
  fore-edge-tab-current:
    backgroundColor: "{colors.milk-leaf}"
    textColor: "{colors.oxide-orange-ink}"
    rounded: "{rounded.tab}"
    width: "3.5rem"
  section-tab:
    backgroundColor: "{colors.field}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.control}"
    padding: "0.35rem 0.9rem"
    height: "2.4rem"
  section-tab-current:
    backgroundColor: "{colors.oxide-orange}"
    textColor: "{colors.on-board-light}"
    rounded: "{rounded.control}"
  card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.print-ink}"
    rounded: "{rounded.control}"
    padding: "{spacing.card-pad}"
  code-panel:
    backgroundColor: "{colors.code-ground}"
    textColor: "{colors.code-ink}"
    typography: "{typography.code}"
    rounded: "{rounded.control}"
  search-input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.print-ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    height: "2.5rem"
  chapter-number:
    backgroundColor: "{colors.oxide-orange}"
    textColor: "{colors.on-board-light}"
    rounded: "{rounded.leaf}"
    padding: "0.35rem 0.55rem 0.3rem"
  continue-board:
    backgroundColor: "{colors.cover-sienna}"
    textColor: "{colors.on-board-light}"
    rounded: "{rounded.control}"
    padding: "1.1rem 1.25rem 1.1rem 1.4rem"
---

# Design System: Systems Programming Study Guide

## Overview

**Creative North Star: "The Tabbed Reference Manual"**

The guide is a physical reference manual. Each of the course's parts is a coloured divider board that fills the window; each chapter is a milk reading leaf laid on its part's board, punched with holes down its bound edge so the board shows through. Down the fore edge, one tab per part steps the length of the course: each tab is as tall as its part has chapters, and the open part's tab is the leaf itself pulled out into the board. The reader always knows which part they are in (the board colour) and how far the course runs (the tabs).

The leaf is calm: near-black print ink on milk, hairline rules, a serif reading column of about 68 characters, Archivo for heads and labels. Colour lives on the boards and in a single part ink on the leaf; everything else is ink, hairline and paper. State is a printed mark, never a new hue: an open box for an unsolved exercise, a filled box when solved, a punched hole in board colour for the current place.

Motion is a page being handled: a section or chapter turn hinges the leaf from its punched edge, tabs slide a few pixels out of the fore edge on hover, popovers pop from 97%. Nothing ambient, nothing over 300ms in UI, and reduced motion keeps only the fades.

**Key Characteristics:**
- One board colour per part, set by the page's `data-part` and inherited by the whole manual.
- A milk leaf with a punched bound edge on a full-bleed board.
- Fore-edge tabs stepped by part length; the current tab is the leaf.
- Serif reading, wide-axis Archivo heads, condensed caps only on tabs.
- State as marks in ink: open box, filled box, punched hole.
- Short ease-out motion; transform and opacity only.

## Colors

A divider wheel of six saturated boards around a quiet milk-and-ink leaf.

### Primary
- **Divider boards** (cover-sienna, oxide-orange, chrome-yellow, board-teal, ultramarine, review-violet): one per part: cover (home, glossary), I Memory in C++, II Concurrency in Java, III Communication, IV Databases, V Review. A board fills the window behind the leaf, colours the fore-edge tabs, the current section tab, the chapter number, the current-chapter hole, the code-label square, the home "continue" slab and the next-chapter hop. Print on a board uses its paired on-board colour: white for all boards except chrome yellow, which takes print ink.
- **Part inks** (oxide-orange-ink, chrome-yellow-ink, board-teal-ink, ultramarine, review-violet-ink): the same hue darkened to read on the leaf. Used for links, list markers, focus rings, the open tab's text, block-type words and small part labels. Cover's part ink is cover-sienna.

### Neutral
- **Milk Leaf** (milk-leaf, tinted 3% toward the current board): the reading page and the open tab.
- **Sheet** (sheet): cards, buttons, inputs, popovers; a whiter paper laid on the leaf.
- **Print Ink** (print-ink): text, heading rules under part groups and table heads, filled marks, pressed buttons, the reading-progress bar.
- **Muted Ink** (muted-ink): secondary text, unselected navigation, captions, counts.
- **Hairline / Hairline Strong** (hairline, hairline-strong): 1px rules and borders; strong for buttons, marks and open boxes.
- **Field** (field, tinted 5% toward the board): hover fills, inline code, unselected section tabs, picked answers.
- **Danger** (danger): only for the "Watch for this" trap callout border, tint and lead-in.
- **Code ground** (code-ground, code-head, code-ink, code-muted, code-gutter): code panels are print-ink slabs with a slightly lighter label strip and a line-number gutter.

### Named Rules
**The One Board Rule.** A page shows exactly one board: the part it belongs to. Other parts' hues appear only as their own tabs and numerals, never as accents on the leaf.

**The Mark Not Hue Rule.** Progress and correctness are shown as ink marks (open box, filled box, struck box, filled hole), never as green/red fills. Danger tints only the trap callout.

**The Readable Ink Rule.** Board hues never carry text on the leaf; use the part ink (the darkened pair) for any coloured text on milk.

## Typography

**Display Font:** Archivo (variable, wdth axis), Heebo for Hebrew, system-ui fallback
**Body Font:** Source Serif 4 (variable, opsz axis, optical sizing auto), Frank Ruhl Libre for Hebrew, Georgia fallback
**Label/Mono Font:** JetBrains Mono for code, line numbers and chapter numbers in holes

**Character:** A heavy, slightly condensed grotesque for heads and the manual's furniture over a calm optical-size serif for long reading; the pairing reads as a printed technical manual rather than a docs site.

### Hierarchy
- **Display** (800, clamp(2.6rem, 5.5vw, 4.25rem), 1.02, wdth 92): the home page's course title only.
- **Headline** (800, clamp(2.35rem, 4.4vw, 3.5rem), 1.02, -0.025em, wdth 92): chapter and glossary titles, beside the board-coloured chapter number. Phone: clamp(2rem, 9vw, 2.6rem).
- **Title** (750, 1.6rem, 1.15): section heads inside a chapter. h3 at 1.22rem/700, h4 at 1.02rem/700.
- **Body** (400, 1.125rem, 1.65): reading text in a column of max 44rem (about 68ch). Phone raises it to 1.25rem/1.6. Bold is 650.
- **Lead** (400, 1.22rem, 1.6, muted): the summary under a page title.
- **UI** (500-600, 0.85-0.9rem, Archivo): navigation, buttons, inputs, section tabs.
- **Label** (700, 0.66-0.72rem, 0.08-0.12em, uppercase): small furniture labels only: the rail's part label, table heads, code language strip, search-result part, "Open", "End of chapter".
- **Tab label** (700, 0.7rem, wdth 78, 0.07em, uppercase, vertical on desktop): the fore-edge tab names.

### Named Rules
**The Serif Reads, The Grotesque Labels Rule.** Running prose is always Source Serif 4; Archivo is for headings, navigation, controls and labels.

**The Lead-In Rule.** A content block names its kind with a sentence-case Archivo lead-in ("Watch for this", "Proof", "Solution") or as a part-ink word inside its heading ("Example · An array on the heap"); never as a tracked-caps eyebrow above a heading.

## Layout

Desktop is a two-column board: the leaf takes the width, the fore-edge tab rail takes 3.5rem at the right. The board pads the leaf by a 1.75rem gutter on top, bottom and the bound side. Inside the leaf, a 2.25rem punched margin, then a sticky 17rem contents column (course name, search, overview/glossary, the current part's chapters, a solved count pinned to the foot), separated by a hairline from the reading column (max 44rem, offset from the rail by clamp(0rem, 6vw - 2.5rem, 5rem), padded 3.25rem 2.5rem 5rem). The home column widens to 50rem.

Chapters are split into sections, switched by a sticky row of index tabs along the top edge of the reading column, underlined by a 2px board-colour rule. Previous and next section hang in the leaf's outer margin at 1280px and up; below that they sit in the chapter foot. Next/previous chapter hops close every chapter.

At 800px and below the gutter and punch collapse to zero, the contents column becomes a slim board-coloured header bar (3.25rem plus safe area) with a menu drawer, the fore-edge tabs become a stepped horizontal strip under it (the current tab grows four times wider), and the leaf runs full width. At 420px only the current tab keeps its name.

Vertical rhythm: h2 sits 2.75rem below prior content, blocks take 1.5rem margins, paragraphs 0.8rem, list items 0.4rem.

## Elevation & Depth

Depth is physical and sparse: the leaf lies on the board with one long soft shadow, tabs sit just under the leaf's edge, and only floating things (search results, section turns, the continue slab) lift. Everything on the leaf is flat, separated by hairlines rather than shadow.

### Shadow Vocabulary
- **Leaf** (`box-shadow: 0 1px 0 rgb(0 0 0 / 0.06), 0 18px 40px -18px rgb(0 0 0 / 0.45)`): the reading leaf on its board. Removed on phone.
- **Lift** (`box-shadow: 0 1px 1px rgb(0 0 0 / 0.06), 0 8px 18px -10px rgb(0 0 0 / 0.35)`): search results, section-turn popovers, the home continue slab.
- **Tab** (`box-shadow: inset 1px 0 0 rgb(0 0 0 / 0.18), 2px 2px 6px -3px rgb(0 0 0 / 0.4)`): a divider tab tucked under the leaf edge; the current tab drops the inset.
- **Punch** (`filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.12))`): the rim of each punched hole.

### Named Rules
**The Flat Leaf Rule.** Nothing on the leaf casts a shadow at rest; cards and code are separated by hairline or ground, and only floating overlays use Lift.

## Shapes

Cut paper, nearly square. Leaf corners are 3px on the free edge only; cards, buttons, inputs and code panels are 4px; part numerals 2px; marks 1px. Tabs are rounded only on their outer edge (0 6px 6px 0 on the fore edge, 0 0 5px 5px on the phone strip; section tabs 4px 4px 0 0, open at the bottom into the board rule). The only circles are punched holes: the leaf's bound edge (0.4rem holes every 15rem) and the 1.65rem chapter holes in the contents column.

## Components

### Buttons
- **Shape:** gently squared (4px), min height 2.6rem (2.75rem on phone).
- **Default:** sheet ground, 1px hairline-strong border, print ink, Archivo 600 0.88rem.
- **Hover / Focus:** border darkens to print ink on fine pointers; focus is a 2px part-ink outline offset 2px; press scales to 0.97 in 160ms ease-out.
- **Pressed / on:** inverted, print-ink ground with milk text.

### Fore-Edge Tabs (signature)
- One per part, flex-grown by chapter count so the rail steps by part length; 2.5rem wide, board ground, numeral over a vertical condensed-caps name (hidden when the tab is under 7.5rem tall).
- The current part's tab is the leaf: milk ground, part-ink text, 3.5rem wide, min 8rem tall.
- Hover slides it 3px out of the fore edge (180ms ease-out); press 1px.

### Section Tabs
- Index tabs along the top of the reading column: field ground, hairline border without a bottom edge, muted Archivo 600 0.85rem. The current section is the board colour with on-board text, sitting on a 2px board rule. The glossary's letter jump uses the same tabs.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** sheet on the leaf; trap callouts tint 4% toward danger with a danger-mixed border.
- **Shadow Strategy:** none (Flat Leaf Rule).
- **Border:** 1px hairline; solved practice takes hairline-strong.
- **Internal Padding:** 1.1rem 1.25rem 1.15rem.
- Practice cards fold to a single row: open box mark, Archivo 600 summary, part-ink "Open".

### Inputs / Fields
- **Search:** sheet ground, 1px hairline, 4px, inline stroke magnifier, Archivo 500 0.9rem, min 2.5rem. Focus swaps the border to part ink with a 1px part-ink ring.
- **Choices:** full-width 2.75rem rows, field fill on hover and when picked (with hairline-strong border); radio accent in part ink.
- **Blanks:** inline selects, 3px, hairline-strong border; inside code they take the code-head ground.

### Navigation
- **Contents column:** Archivo, muted 500 0.9rem links with 3px field hover; current is print ink 700. Chapters are numbered holes in mono: an open ring, filled ink when solved, filled board when current.
- **Phone:** board-coloured header bar with course name and a three-line menu that rotates to a cross; the drawer slides 8px down in 240ms on the drawer curve.

### Code Panel
- Print-ink slab, 4px, with a 2.1rem label strip: a small board-colour square then the language in tracked caps. Line numbers counted in the gutter; JetBrains Mono 0.86rem/1.55.

### Continue and Chapter Hops
- The home "continue" slab and the next-chapter hop are board-coloured with on-board text and a square-capped SVG arrow that nudges 3px on hover; the previous hop is a sheet card. All press to 0.97.

## Do's and Don'ts

### Do:
- **Do** set the board by the page's part (`data-part`) and let every board-coloured element inherit it.
- **Do** size each fore-edge tab by the number of chapters in its part.
- **Do** show state with ink marks: open box, filled box, struck box, punched hole in board colour.
- **Do** keep the reading column at 44rem max in Source Serif 4, 1.125rem/1.65.
- **Do** use the part ink, not the board hue, for coloured text on the leaf.
- **Do** animate only transform and opacity, ease-out (cubic-bezier(0.23, 1, 0.32, 1)), 150-240ms; keep only fades under reduced motion.
- **Do** gate hover movement behind `(hover: hover) and (pointer: fine)`.

### Don't:
- **Don't** put a second part's hue on a page's leaf, or add a brand accent outside the divider wheel.
- **Don't** colour correctness green or red; danger is reserved for the trap callout.
- **Don't** place tracked-caps eyebrows or kickers above titles; block kinds are sentence-case lead-ins or part-ink words in the heading.
- **Don't** give cards, code or figures a shadow on the leaf.
- **Don't** round beyond 6px; the only circles are punched holes.
- **Don't** add ambient or looping motion, or UI transitions over 300ms.
