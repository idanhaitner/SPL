import { Blocks } from "@/components/Blocks";
import type { Hop } from "@/components/chapter/FinishReading";
import { SectionSwitch } from "@/components/SectionSwitch";
import { stepsOf } from "@/lib/steps";
import type { Block, Topic } from "@/lib/types";

function walk(blocks: Block[], visit: (block: Block) => void) {
  for (const block of blocks) {
    visit(block);
    if (block.type === "directive") walk(block.children, visit);
    if (block.type === "list") {
      for (const item of block.items) walk(item.children, visit);
    }
  }
}

function idsOf(blocks: Block[]) {
  const ids: string[] = [];
  walk(blocks, (block) => {
    if (block.type === "directive" && block.attrs.id) ids.push(block.attrs.id);
  });
  return ids;
}

const slugOf = (title: string) =>
  title.toLowerCase().replace(/`/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

// Practice lives in the chapter's session. Only worked examples stay in the reading.
function withoutPractice(blocks: Block[]): Block[] {
  return blocks.filter((block) => !(block.type === "directive" && block.name === "problem" && block.attrs.kind !== "worked"));
}

// `label` names a page in the section list when it differs from its heading.
type Slice = { title: string; blocks: Block[]; group?: string; label?: string };

// Roughly how many lines of the reading column some blocks fill, counting a figure, a table row, or a code line as what it takes up.
function linesOf(blocks: Block[]): number {
  let lines = 0;
  for (const block of blocks) {
    if (block.type === "paragraph" || block.type === "quote") lines += Math.ceil(block.text.length / 75) + 1 + (block.text.includes("![") ? 12 : 0);
    else if (block.type === "heading") lines += 2;
    else if (block.type === "code") lines += block.text.split("\n").length + 2;
    else if (block.type === "math") lines += 3;
    else if (block.type === "table") lines += block.rows.length * 1.6 + 2;
    else if (block.type === "list") for (const item of block.items) lines += Math.ceil(item.text.length / 70) + 0.4 + linesOf(item.children);
    else if (block.type === "directive") lines += 2 + linesOf(block.children);
  }
  return lines;
}

// About 3000 pixels: past this a section is a long scroll, so it is read one subsection at a time.
const LONG_SECTION = 110;
// An opening this short is a lead-in, not a page; it joins the first subsection.
const SHORT_OPENING = 25;

// A long section becomes a page for its opening and one for each of its subsections, all kept under its name.
function paged(slice: Slice): Slice[] {
  const subsections = slice.blocks.filter((block) => block.type === "heading" && block.level === 3).length;
  if (subsections === 0 || linesOf(slice.blocks) < LONG_SECTION) return [slice];
  const pages: Slice[] = [{ title: slice.title, blocks: [], group: slice.title }];
  for (const block of slice.blocks) {
    if (block.type === "heading" && block.level === 3) pages.push({ title: block.text, blocks: [], group: slice.title });
    else pages[pages.length - 1].blocks.push(block);
  }
  const [opening, first, ...rest] = pages;
  if (opening.blocks.length > 0 && linesOf(opening.blocks) >= SHORT_OPENING) return pages.filter((page) => page.blocks.length > 0);
  // The first page keeps the section's name as its heading, and is listed by the subsection it holds.
  const heading: Block = { type: "heading", level: 3, text: first.title };
  const merged = { title: slice.title, group: slice.title, label: first.title, blocks: [...opening.blocks, ...(opening.blocks.length > 0 ? [heading] : []), ...first.blocks] };
  return rest.length === 0 ? [slice] : [merged, ...rest];
}

export function Chapter({ topic, courseId, session, next }: { topic: Topic; courseId: string; session: Hop | null; next: Hop | null }) {
  const { blocks, id: chapterId } = topic;
  const intro: Block[] = [];
  const slices: Slice[] = [];
  for (const block of withoutPractice(blocks)) {
    if (block.type === "heading" && block.level === 2) slices.push({ title: block.text, blocks: [] });
    else if (slices.length === 0) intro.push(block);
    else slices[slices.length - 1].blocks.push(block);
  }
  const kept = slices.filter((slice) => slice.title.trim() !== "Practice" && slice.blocks.length > 0).flatMap(paged);
  const parts = (kept.length > 0 ? kept : [{ title: "Overview", blocks: intro }]).map((slice: Slice) => ({
    title: slice.title,
    slug: slugOf(slice.title),
    group: slice.group ? { title: slice.group, slug: slugOf(slice.group) } : undefined,
    label: slice.label,
    // A link to a subsection that now opens its section's first page still finds it.
    ids: [...idsOf(slice.blocks), ...(slice.label ? [slugOf(slice.label)] : [])],
    body: <Blocks blocks={slice.blocks} courseId={courseId} />,
  }));
  return (
    <SectionSwitch
      courseId={courseId}
      chapterId={chapterId}
      stepIds={stepsOf(topic).map((step) => step.id)}
      intro={kept.length > 0 && intro.length > 0 ? <Blocks blocks={intro} courseId={courseId} /> : null}
      parts={parts}
      session={session}
      next={next}
    />
  );
}
