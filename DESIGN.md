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
  new-leaf-hover: "#C9EE85"
  stem: "#5FA886"
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
  code-ground: "#2B2926"
  code-bar: "#35322E"
  code-mark: "#3D3A35"
  code-text: "#EAE5DA"
  code-keyword: "#C9B8E8"
  code-number: "#EDB48C"
  code-string: "#E3CC8F"
  code-function: "#A9C7EA"
  code-type: "#8FD0CC"
  code-comment: "#AAA496"
  code-punctuation: "#CFC9BC"
  code-line-number: "#A09A8C"
  code-plate: "#F1EEE7"
  code-chip: "#E8E4DA"
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
    backgroundColor: "{colors.new-leaf}"
    textColor: "{colors.new-leaf-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.new-leaf-hover}"
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
    backgroundColor: "{colors.code-chip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "1px 6px"
---

# Design System: Systems Programming study site

## Overview

**Creative North Star: "The Greenhouse"**

The student arrives knowing nothing, and that is the seed. The course is one plant: its stem is the order of the course, its leaves are chapters and steps, and a leaf opens only when the student has done the work. The feeling is a bright glasshouse: alive, curved, generous, and welcoming to someone who has never seen a pointer.

Green fields frame the journey (home, chapter tops, session bars). Reading happens in pale, quiet rooms, because a chapter runs to thousands of words and the world must step back while it teaches. Code sits on warm potting-bench panels in both themes, so it always looks like the same material and the green never competes with what the student is reading.

Rejected by the user: anything nerdy or squarish, including technical-datasheet, debugger, terminal, and hard-edged poster looks, plus the previous cobalt design.

**Key Characteristics:**
- One continuous stem, in every surface, that shows real progress
- Curves everywhere a corner would be unkind: pills, arches, soft panels
- All green: one lime action on the green fields, and a palette with no second hue except rust for errors
- Friendly, heavy Gabarito headings over calm Figtree prose
- Code treated as the star of the page

## Colors

A saturated botanical palette: deep bottle greens carry the frame, and fresh lime means growth and "do this next". Coral was tried for the action and removed: it fought the world instead of belonging to it.

### Primary
- **Canopy** (`canopy`, with `canopy-mid` and `canopy-high` for nested arches): the green fields of home, chapter tops, and session bars.
- **New Leaf** (`new-leaf`): anything grown or correct. Stems, open leaves, passed tests, links on dark grounds. Its text color is `new-leaf-ink`.
- **Bud** (`bud`): the session primary action, and the family of the leaves not yet opened.

### The primary action
One filled pill per screen. On green fields (home hero, close, mastheads, the 404) it is `new-leaf` with `new-leaf-ink` and a soft shadow. In reading rooms it is `canopy` with `canopy-ink` in light theme and `new-leaf` in dark (`--cta`). In sessions it is `bud` with white.

### Tertiary
- **Rust** (`rust`, `rust-deep`, `rust-wash`; `night-rust`, `night-rust-wash` in dark): wrong answers, failing tests, and traps, named after the plant disease. It is the only warm color on the site, so an error is never mistaken for anything else.

### Neutral
- **Sunroom** (`sunroom`, `sunroom-raised`, `sunroom-wash`): light reading grounds, tinted green rather than cream or gray.
- **Ink** (`ink`, `ink-soft`, `ink-muted`): text. `moss` is the link color on light grounds.
- **Night** (`night`, `night-raised`, `night-wash`, `night-ink*`): the same rooms after dark.
- **Rules** (`rule`, `night-rule`): dividers only. Control boundaries use `control-edge` and `night-control-edge`, which reach 3:1.

### Code
The syntax palette (`code-*`) is one set for both themes and maps onto Shiki's `--code-*` variables: keywords in wisteria, numbers in apricot, strings in honey, functions in sky, types in aqua. Green stays out of syntax, so it keeps meaning growth: the only green on code is the leaf that marks a line and the color of a pass.

**The One Action Rule.** At most one filled primary pill per screen, and it is always the next thing to do.

**The Earned Green Rule.** Lime on a stem or leaf always reports something the student really did. Never fill it for decoration or to look encouraging. Decorative leaves, like the closing sprig, stay tone on tone.

## Typography

**Display Font:** Gabarito (with system-ui)
**Body Font:** Figtree (with Heebo for Hebrew terms, then system-ui)
**Code Font:** JetBrains Mono (with ui-monospace)

**Character:** Gabarito is round, heavy, and friendly without being childish, which suits a course that must not intimidate. Figtree stays out of the way across long reading. JetBrains Mono is kept from the first design on purpose: it keeps `*`, `&`, `0`, `O`, `l`, and `1` clearly apart, which matters more here than novelty. Ligatures stay off, because a beginner must see the real characters.

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

## Motion

Things used all day stay fast or do not animate; growth is the only slow motion, because growth is progress. One UI easing: `cubic-bezier(0.23, 1, 0.32, 1)` (`--ease-out`), with `--gh-ease` for the larger home entrances.

- **The focal moment (home, once per browser session):** the headline's words lift out of their baselines. The shoot leaves the action button, the stem climbs over 2s with a quick start that slows, and each leaf unfurls exactly as the tip passes it (`growthDelay` in `lib/stem.ts`). Tendrils draw to the part names, the next leaf lights up, and "Grow" turns lime. Everything is visible and clickable afterwards without any of this running, and a later home visit in the session skips it (`data-grown`).
- **Life (home hero):** a slow breeze travels up the plant, the next leaf breathes light, a point of sap runs from the button to that leaf every 8s (at once while the button is hovered), and pollen drifts in the arches. Moving the pointer through the plant pushes the leaves it passes, on a spring, and stirs the pollen; a soft light follows the pointer. The chapter strip has the push and the breathing light only. All of it pauses off screen.
- **Scroll (home):** the arches part at different speeds, sections fade up, each chapter's mark opens as it arrives, and the closing sprig climbs and opens with the scroll. Only where scroll timelines exist; elsewhere everything simply shows.
- **Frequent actions (fast, no travel):** page arrival is a 140ms fade with no movement; press feedback is 120ms with a scale of 0.97 to 0.98; a new session step rises 6px over 200ms. Links, navigation, typing, and Next never wait on an animation.
- **Growth:** the grown part of the stem lengthens over 600ms and the session mini bar fills over 300ms when progress is earned. A chapter's own leaf opens in 460ms on arrival.
- **Feedback:** a correct answer pops its mark (280ms), and on home throws up small leaves (760ms); a wrong one nudges once sideways 4px (220ms). Leaves lift 1.14 under a mouse pointer only.

**The Growth Is Slow Rule.** Anything the student does repeatedly is fast or still. Only the plant may take longer than 300ms, and it never blocks a click.

**Reduced motion.** Page, step, and results arrivals shrink to a 100ms linear fade. Everything else above switches off, including pollen, light, and sap. Every state still reads through shape and color alone.

## Shapes

- **Small corners** (`xs`, `sm`): inline code chips and editor tabs.
- **Pills** (`pill`): every button, chip, and search field.
- **Arches** (`arch`): the signature silhouette, nested in green fields as depth. Use in the green fields only: home, chapter tops, the glossary top, and the 404.
- **Soft panels** (`md`, `lg`): cards at 18px, code panels at 18px, large fields at 28px.
- **Leaves**: one drawing everywhere (`LeafBlade`): a stalk from the stem, two tones split by a curved midrib, fine veins, a pointed tip. Never a rotated rectangle.
- **Stems**: tapered, thick at the root and thin at the tip, ending in a small furled leaf. No circles or dots on a stem, anywhere: a part begins where a thin tendril ties its name to the stem, and list marks are buds that open into leaves.
- **Square corners** are not used on anything the student can see, apart from tables' inner cells.

## Components

### Navigation
- **Top bar:** one bar only: the plant mark, part and chapter, search, theme toggle, and a Course button. Green everywhere, and pinned to the top of the window from 1024px up, so the course stays one click away while reading.
- **Course drawer:** the whole plant, grouped by the four parts, with every chapter listed and the next one offered. This replaces the permanent 16-item sidebar.

### Buttons
- **Primary:** filled pill in the color for its ground (see Colors), arrow icon, 56px tall (44px in compact bars). Hover lightens it and its arrow leans 4px ahead; press scales to 0.97.
- **Secondary:** transparent pill with a `control-edge` outline.
- **Quiet:** text with an underline on hover, for Skip, Back, and Reread.
- **Focus, everywhere:** a 2px ring with 2px offset, `moss` on light, `new-leaf` on dark and on code.

### Stem (signature)
- **Course stem:** a curved line with one leaf for each chapter, at the top of home and each chapter. Leaves are links above 900px and carry the four part names. Below that they are too small to tap, so the stem only shows progress, and the chapter list and Course drawer do the navigating. Color only ever means how far along a chapter is, on one ripening scale: **ahead** is deep teal with a fine rim, **read** is mint (opened, practice unfinished), **done** is lime, and **here** is the largest, a pale leaf with soft light around it. A chapter's name appears on a plate past the leaf's tip on hover or focus.
- **Section stem:** a vertical stem with one bud per `##` section. Buds become leaves once the section has been read. The current one is a larger solid bud in the text color.
- **Session stem:** one leaf per step, and each is a button. **Done** is a lime leaf, **skipped** a dashed outline ("dormant"), **current** is a large pale bud, and **upcoming** is a small outlined bud. Each state differs in shape as well as color, and each carries a full `aria-label`. Below 640px it shows "Step 7 of 26" with a stem that fills, and tapping opens the step list, because 26 leaves cannot be tappable at phone width.

### Course Windows (home)
"The whole course, in order" is a glasshouse elevation: one arch per part, standing on a shared sill, each as tall as its part is long, so the course's shape is the skyline. The heading and a leaf-color legend fill the sky above the shorter arches. Each arch holds the part's name, language, and summary, then a vine with one numbered leaf per chapter, using the same leaves and colors as the hero. The next chapter's row sits on a lighter plate with an arrow. "Before the exam" is the sill itself. Below 1240px the arches pair up; below 900px they stack. The Course drawer keeps a plain list with bud marks, since it is for quick navigation.

### Glossary
A green masthead with a sprig, then a sticky bar with a live filter over terms and definitions, jump links to the parts, and a count. Each part opens with a green banner. Each chapter has its numbered leaf and title, pinned while its terms scroll, beside a grid of term cards with leaf-like corners and a faint leaf watermark. Term names link to their chapter; a term arrived at through search flashes lime and keeps a ring.

### Lecture Page
Green top with nested arches, the chapter number on a leaf, title, one-line summary, and the course stem. Then the three-zone layout. It ends by handing off: the next section, then the chapter's session.

### Guided Session Steps
- **Bar:** back to chapter, step count, session stem, and Back, Skip for now, and Next. Next is the primary action once the step is done. Every primary action (Start step 1, Next, Submit, Next chapter) is a `bud` pill with white text, a brighter step of the session bar's green that holds on the pale ground, the bar, and the code bar alike. Hover uses `#2C8265`. On question steps Check stays a quiet pill, because one step can hold several checks.
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
- **Frame:** warm neutral panel, 18px corners, identical in both themes.
- **Bar:** language name, optional file name, and a Copy button that confirms in place.
- **Lines:** line numbers that are not selected when copying, with tabular figures.
- **Marked lines:** a tone change plus a small leaf in the gutter, for the line being discussed.
- **Long lines:** wrap above 640px, because a beginner must not lose the end of a comment. At phone width they scroll sideways inside the panel, never the page, with a fade at the edge while more is hidden. The panel is keyboard focusable.
- **Edge:** in dark theme the panel gets a 1px `night-rule` outline so it does not melt into the ground.
- **Output:** joined to the bottom of its code panel in the same material, labeled, and separated by a rule.
- **Selection:** wisteria at 30% over code.
- **Inline code:** a `code-chip` in the text's own color. Examples and hints that hold code sit on `code-plate`. Both are warm neutrals, and in dark theme they follow the code panel's tones (`#3D3A35`, `#2B2926`).

### Inputs
Pill search field; `control-edge` outline; focus uses the standard ring. The editor uses the code panel's colors, and its errors use `night-rust`.

## Do's and Don'ts

### Do:
- **Do** keep every stem and leaf truthful: progress comes from `localStorage`. A first visit shows no lime at all, with chapter 1 marked as the place to start. Opening a chapter makes it read; only solving its practice makes it done.
- **Do** keep the plant outside the prose. Teaching text, figures, and code stay clear of decoration.
- **Do** theme selection, scrollbars, caret, and focus from the palette.
- **Do** make animation optional: every state must read correctly under `prefers-reduced-motion`, and keep frequent actions fast (see Motion).
- **Do** color figures only through the `--fig-*` roles in `greenhouse.css`. All 25 are inlined at build time and sit directly on a `--raised` panel with a `--rule` border in both themes, with no light plate.

### Don't:
- **Don't** return to datasheet, debugger, terminal, or hard-edged poster looks.
- **Don't** use more than one filled primary action per screen.
- **Don't** add garden wordplay to instructions. "Start chapter 1" is clearer than a plant pun wherever the student must act.
- **Don't** use leaf or stem decoration on reading pages beyond the stems described above.
- **Don't** bring coral or another warm accent back for actions.
- **Don't** use gradients on text, colored side stripes on cards, or glass effects.
- **Don't** show exam years on questions.
