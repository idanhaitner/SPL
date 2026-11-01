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

export function Chapter({ topic, courseId, session, next }: { topic: Topic; courseId: string; session: Hop | null; next: Hop | null }) {
  const { blocks, id: chapterId } = topic;
  const intro: Block[] = [];
  const slices: { title: string; blocks: Block[] }[] = [];
  for (const block of withoutPractice(blocks)) {
    if (block.type === "heading" && block.level === 2) slices.push({ title: block.text, blocks: [] });
    else if (slices.length === 0) intro.push(block);
    else slices[slices.length - 1].blocks.push(block);
  }
  const kept = slices.filter((slice) => slice.title.trim() !== "Practice" && slice.blocks.length > 0);
  const parts = (kept.length > 0 ? kept : [{ title: "Overview", blocks: intro }]).map((slice) => ({
    title: slice.title,
    slug: slugOf(slice.title),
    ids: idsOf(slice.blocks),
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
