---
name: Systems Programming study site
description: A course that grows from a seed, one chapter at a time
colors:
  canopy: "#0F3D2E"
  canopy-mid: "#14503C"
  canopy-high: "#1A6149"
  canopy-ink: "#F2F7EE"
  canopy-ink-soft: "#BFD6C6"
  new-leaf: "#B7E36B"
  new-leaf-ink: "#0F3D2E"
  bud: "#27755A"
  bloom: "#FF6F59"
  bloom-hover: "#FF8470"
  bloom-ink: "#20100C"
  bloom-edge: "#A8341F"
  sunroom: "#F2F7EE"
  sunroom-raised: "#FBFDF9"
  sunroom-wash: "#E2EFD8"
  ink: "#12291F"
  ink-soft: "#3C5449"
  ink-muted: "#566E61"
  moss: "#1F6B4F"
  rule: "#D5E2D3"
  control-edge: "#6A8A79"
  rust: "#A8481A"
  rust-deep: "#8F3C14"
  rust-wash: "#FBEBDD"
  night: "#0B2A20"
  night-raised: "#103428"
  night-wash: "#174736"
  night-ink: "#E8F1E6"
  night-ink-soft: "#A9C2B3"
  night-ink-muted: "#8BA898"
  night-rule: "#24503F"
  night-control-edge: "#6F9483"
  night-rust: "#F2A36F"
  night-rust-wash: "#3A2A1C"
  code-ground: "#0A2C21"
  code-bar: "#0F3D2E"
  code-mark: "#123D2E"
  code-text: "#E6F0E6"
  code-keyword: "#B7E36B"
  code-number: "#FFC48A"
  code-string: "#F4D58D"
  code-function: "#8FE3CF"
  code-type: "#9FD6FF"
  code-comment: "#8DAD9D"
  code-punctuation: "#C8D8CD"
  code-line-number: "#8DAD9D"
typography:
  display:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6vw + 0.5rem, 6rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 1.5vw + 1.4rem, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  chapter-title:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 3.4vw + 1rem, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.2
  card-title:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
  button:
    fontFamily: "Gabarito, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 800
    lineHeight: 1.2
  lede:
    fontFamily: "Figtree, Heebo, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Figtree, Heebo, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
  body-small:
    fontFamily: "Figtree, Heebo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, Heebo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.35
  caption:
    fontFamily: "Figtree, Heebo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.35
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  xs: "6px"
  sm: "10px"
  md: "18px"
  lg: "28px"
  arch: "999px 999px 0 0"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
  3xl: "104px"
components:
  button-primary:
    backgroundColor: "{colors.bloom}"
    textColor: "{colors.bloom-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.bloom-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    height: "44px"
  code-panel:
    backgroundColor: "{colors.code-ground}"
    textColor: "{colors.code-text}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
  inline-code:
    backgroundColor: "{colors.sunroom-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "1px 6px"
---

# Design System: Systems Programming study site

## Overview

**Creative North Star: "The Greenhouse"**

The student arrives knowing nothing, and that is the seed. The course is one plant: its stem is the order of the course, its leaves are chapters and steps, and a leaf opens only when the student has done the work. The feeling is a bright glasshouse: alive, curved, generous, and welcoming to someone who has never seen a pointer.

Green fields frame the journey (home, chapter tops, session bars). Reading happens in pale, quiet rooms, because a chapter runs to thousands of words and the world must step back while it teaches. Code sits in deep green panels in both themes, so it always looks like the same material.

Rejected by the user: anything nerdy or squarish, including technical-datasheet, debugger, terminal, and hard-edged poster looks, plus the previous cobalt design.

**Key Characteristics:**
- One continuous stem, in every surface, that shows real progress
- Curves everywhere a corner would be unkind: pills, arches, soft panels
- Lots of green, one coral action
- Friendly, heavy Gabarito headings over calm Figtree prose
- Code treated as the star of the page

## Colors

A saturated botanical palette: deep bottle greens carry the frame, fresh lime means growth, and a single coral means "do this next".

### Primary
- **Canopy** (`canopy`, with `canopy-mid` and `canopy-high` for nested arches): the green fields of home, chapter tops, and session bars.
- **New Leaf** (`new-leaf`): anything grown or correct. Stems, open leaves, passed tests, links on dark grounds. Its text color is `new-leaf-ink`.
- **Bud** (`bud`): leaves not yet opened.

### Secondary
- **Bloom** (`bloom`, text `bloom-ink`, edge `bloom-edge`): the one next action on a screen. Coral on pale ground is only 2.5:1, so light-theme buttons carry the darker edge to keep a visible boundary.

### Tertiary
- **Rust** (`rust`, `rust-deep`, `rust-wash`; `night-rust`, `night-rust-wash` in dark): wrong answers, failing tests, and traps, named after the plant disease. It is deliberately not coral, so errors never look like the action to take.

### Neutral
- **Sunroom** (`sunroom`, `sunroom-raised`, `sunroom-wash`): light reading grounds, tinted green rather than cream or gray.
- **Ink** (`ink`, `ink-soft`, `ink-muted`): text. `moss` is the link color on light grounds.
- **Night** (`night`, `night-raised`, `night-wash`, `night-ink*`): the same rooms after dark.
- **Rules** (`rule`, `night-rule`): dividers only. Control boundaries use `control-edge` and `night-control-edge`, which reach 3:1.

### Code
The syntax palette (`code-*`) is one set for both themes and maps onto Shiki's `--code-*` variables: keywords in new leaf, numbers in peach, strings in pollen, functions in aqua, types in sky.

**The One Bloom Rule.** At most one coral element per screen, and it is always the next thing to do. Never decorate with it, and never use it for selection, errors, or progress.

**The Earned Green Rule.** Lime on a stem or leaf always reports something the student really did. Never fill it for decoration or to look encouraging.

## Typography

**Display Font:** Gabarito (with system-ui)
**Body Font:** Figtree (with Heebo for Hebrew terms, then system-ui)
**Code Font:** JetBrains Mono (with ui-monospace)

**Character:** Gabarito is round, heavy, and friendly without being childish, which suits a course that must not intimidate. Figtree stays out of the way across long reading. JetBrains Mono stays from the old design on purpose: it keeps `*`, `&`, `0`, `O`, `l`, and `1` clearly apart, which matters more here than novelty. Ligatures stay off, because a beginner must see the real characters.

All are served through `next/font`, so builds never depend on a font host. (The sample page loads them from Google Fonts only because it is a standalone file.)

### Hierarchy
- **Display**: home headline and session finish only.
- **Chapter title**: the top of chapter pages.
- **Lede**: the one-line summary under a chapter title.
- **Headline**: `##` sections.
- **Title**: `###` subsections and exercise names.
- **Card title**: definitions and check questions.
- **Button**: primary buttons.
- **Body**: prose at 18px, kept to 68ch.
- **Body small**: card text, examples, and answers' explanations.
- **Label**: navigation and chips.
- **Caption**: code panel bars and notes.
- **Code**: 15px in panels. Inline code is 0.9em of the surrounding text.

**The No Kicker Rule.** No small label above a heading. A heading carries its own weight; the chapter number lives on a leaf.

**The Quiet Mono Rule.** Monospace is only for code and program output, never for labels or decoration.

## Layout

- **Chapter page, 1280px and up:** three zones. A 220px section stem on the left, a 68ch reading column, and a 300px margin where definitions and checks sit beside the idea they belong to.
- **1024 to 1279px:** the section stem stays and margin cards move inline.
- **Below 1024px:** one column with 16px gutters at phone width. The section stem collapses to a bar under the header that shows the current section and opens a list.
- **Session steps:** reading and question steps use a centered column. Code steps fill the window as a split: question on the left, editor over output on the right, with a draggable divider. Below 900px the split stacks with tabs.
- **Rhythm:** 4px base. 64px above `##`, 24px below; 40px above `###`, 12px below.

## Elevation & Depth

Depth comes mostly from nested tones of green. Pale rooms are flat with soft shadows only where something floats.

### Shadow Vocabulary
- **Resting card** (`0 1px 2px rgba(15,61,46,.06), 0 8px 24px -12px rgba(15,61,46,.18)`): margin cards and check cards.
- **Floating** (`0 4px 8px rgba(15,61,46,.08), 0 24px 56px -20px rgba(15,61,46,.35)`): menus, the course drawer, and the search panel.

In dark theme, cards drop their shadow and rise through `night-raised` instead.

## Shapes

- **Small corners** (`xs`, `sm`): inline code chips and editor tabs.
- **Pills** (`pill`): every button, chip, and search field.
- **Arches** (`arch`): the signature silhouette, nested in green fields as depth. Use in the green fields only: home, chapter tops, the glossary top, and the 404.
- **Soft panels** (`md`, `lg`): cards at 18px, code panels at 18px, large fields at 28px.
- **Leaves**: drawn as SVG paths from the stem, never as rotated rectangles.
- **Square corners** are not used on anything the student can see, apart from tables' inner cells.

## Components

### Navigation
- **Top bar:** one bar only: the plant mark, part and chapter, search, theme toggle, and a Course button. Green everywhere, and pinned to the top of the window from 1024px up, so the course stays one click away while reading.
- **Course drawer:** the whole plant, grouped by the four parts, with every chapter listed and the next one offered. This replaces the permanent 16-item sidebar.

### Buttons
- **Primary:** Bloom pill, arrow icon, 52px tall (44px in compact bars). Hover uses `bloom-hover`; press scales to 0.98.
- **Secondary:** transparent pill with a `control-edge` outline.
- **Quiet:** text with an underline on hover, for Skip, Back, and Reread.
- **Focus, everywhere:** a 2px ring with 2px offset, `moss` on light, `new-leaf` on dark and on code.

### Stem (signature)
- **Course stem:** a curved line with one leaf for each chapter, at the top of home and each chapter. Leaves are links above 900px and carry the four part names. Below that they are too small to tap, so the stem only shows progress, and the chapter list and Course drawer do the navigating. **Done** is a lime leaf, **read** an outlined leaf (opened, practice unfinished), **here** a pale leaf, and **ahead** a small dark leaf.
- **Section stem:** a vertical stem with one node per `##` section. Nodes become leaves once the section has been read. The current node is ringed in the text color.
- **Session stem:** one leaf per step, and each is a button. **Done** is a lime leaf, **skipped** a dashed outline ("dormant"), **current** is ringed, and **upcoming** is a small bud. Each state differs in shape as well as color, and each carries a full `aria-label`. Below 640px it shows "Step 7 of 26" with a stem that fills, and tapping opens the step list, because 26 leaves cannot be tappable at phone width.

### Lecture Page
Green top with nested arches, the chapter number on a leaf, title, one-line summary, and the course stem. Then the three-zone layout. It ends by handing off: the next section, then the chapter's session.

### Guided Session Steps
- **Bar:** back to chapter, step count, session stem, and Back, Skip for now, and Next. Next is the Bloom once the step is done. Before that nothing in the bar is coral; on code steps Submit holds the Bloom, and on question steps Check stays a quiet pill, because one step can hold several checks.
- **Learn:** one section in the reading column. It counts as done when the student presses Next, not when it loads.
- **Check:** one question with large pill-shaped answers. A wrong answer explains itself in rust and can be retried; a right answer opens a leaf and unlocks Next.
- **Code:** the split workspace, with only Run, Submit, and Reset as code actions; hints and solution live in the question panel.
- **Lab:** files to download, the commands to run, and a confirmation.
- **Always present:** a Reread link to the chapter section, and a note that code sent to run leaves the browser.

### Check Cards
Soft raised card, title-weight question, pill answers with a radio mark. States: resting, hover, selected, correct (lime with a check icon), and wrong (rust with an X icon). Color is never the only signal.

### Definitions and Traps
- **Definition:** a plant label, a soft card with a small round "tie hole" at its top, on `sunroom-wash`.
- **Trap:** a `rust-wash` card with a warning icon. No colored side stripes.

### Code Blocks
The most important component on the site.
- **Frame:** deep green panel, 18px corners, identical in both themes.
- **Bar:** language name, optional file name, and a Copy button that confirms in place.
- **Lines:** line numbers that are not selected when copying, with tabular figures.
- **Marked lines:** a tone change plus a small leaf in the gutter, for the line being discussed.
- **Long lines:** wrap above 640px, because a beginner must not lose the end of a comment. At phone width they scroll sideways inside the panel, never the page, with a fade at the edge while more is hidden. The panel is keyboard focusable.
- **Edge:** in dark theme the panel gets a 1px `night-rule` outline so it does not melt into the ground.
- **Output:** joined to the bottom of its code panel in the same material, labeled, and separated by a rule.
- **Selection:** `new-leaf` at 30% over code.
- **Inline code:** a `sunroom-wash` chip in the text's own color.

### Inputs
Pill search field; `control-edge` outline; focus uses the standard ring. The editor uses the code panel's colors, and its errors use `night-rust`.

## Do's and Don'ts

### Do:
- **Do** keep every stem and leaf truthful: progress comes from `localStorage`. A first visit shows no lime at all, with chapter 1 marked as the place to start. Opening a chapter makes it read; only solving its practice makes it done.
- **Do** keep the plant outside the prose. Teaching text, figures, and code stay clear of decoration.
- **Do** theme selection, scrollbars, caret, and focus from the palette.
- **Do** make animation optional: every state must read correctly under `prefers-reduced-motion`.
- **Do** put existing figures on a light plate in dark theme until they are redrawn. All 25 still use the old blue palette, and recoloring them is planned work.

### Don't:
- **Don't** return to datasheet, debugger, terminal, or hard-edged poster looks.
- **Don't** use more than one Bloom per screen.
- **Don't** add garden wordplay to instructions. "Start chapter 1" is clearer than a plant pun wherever the student must act.
- **Don't** use leaf or stem decoration on reading pages beyond the stems described above.
- **Don't** use gradients on text, colored side stripes on cards, or glass effects.
- **Don't** show exam years on questions.
