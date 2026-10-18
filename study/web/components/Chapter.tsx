import type { ReactNode } from "react";
import { Blocks } from "@/components/Blocks";
import { SectionSwitch } from "@/components/SectionSwitch";
import type { Block } from "@/lib/types";

type Slice = { title: string; blocks: Block[] };

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

function splitAt(blocks: Block[], level: number) {
  const intro: Block[] = [];
  const slices: Slice[] = [];
  for (const block of blocks) {
    if (block.type === "heading" && block.level === level) {
      slices.push({ title: block.text, blocks: [] });
    } else if (slices.length === 0) {
      intro.push(block);
    } else {
      slices[slices.length - 1].blocks.push(block);
    }
  }
  return { intro, slices };
}

function renderBlocks(blocks: Block[], courseId: string) {
  return <Blocks blocks={blocks} courseId={courseId} />;
}

export function Chapter({ blocks, courseId }: { blocks: Block[]; courseId: string }) {
  const { intro, slices } = splitAt(blocks, 2);
  if (slices.length === 0) return renderBlocks(blocks, courseId);

  const parts = slices.map((slice) => {
    const inner = splitAt(slice.blocks, 3);
    const grouped = inner.slices.length >= 2;
    const groups = grouped
      ? inner.slices.map((group) => ({
          title: group.title,
          ids: idsOf(group.blocks),
          body: renderBlocks(group.blocks, courseId) as ReactNode,
        }))
      : [];
    return {
      title: slice.title,
      ids: idsOf(grouped ? inner.intro : slice.blocks),
      intro: renderBlocks(grouped ? inner.intro : slice.blocks, courseId) as ReactNode,
      groups,
    };
  });

  return <SectionSwitch intro={renderBlocks(intro, courseId)} parts={parts} />;
}
