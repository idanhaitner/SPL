"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { Flower } from "@/components/home/Flower";
import { LeafShape } from "@/components/home/LeafShape";
import { Stem } from "@/components/home/Stem";
import { useLeafBrush } from "@/components/home/useLeafBrush";
import { berryLook, courseStates, hrefOf, leafStates, leavesOf, lastOpen, useProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";
import { bridgeSpots, reachPast, spacedLeaves, STRIP_STEM } from "@/lib/stem";

const strip = spacedLeaves(STRIP_STEM, 16, 0.03, 0.97);
const SIZE: Record<ChapterState, number> = { done: 60, read: 60, here: 78, ahead: 54, locked: 40 };
const BERRY: Record<ChapterState, number> = { done: 34, read: 34, here: 42, ahead: 30, locked: 24 };

// This chapter's place on the one course stem.
export function CourseStrip({ courseId, chapters: all, currentId }: { courseId: string; chapters: ChapterInfo[]; currentId: string }) {
  // One leaf per chapter: the reviews between chapters are not drawn.
  const chapters = leavesOf(all);
  const progress = useProgress(courseId);
  const plant = useRef<SVGSVGElement>(null);
  useLeafBrush(plant);
  // This page's chapter is the one marked here, wherever the course's next chapter is, unless it has not opened yet.
  const states = leafStates(all, progress).map((state, index): ChapterState => (state === "locked" ? state : chapters[index].id === currentId ? "here" : state === "here" ? "ahead" : state));
  const open = lastOpen(states);
  // Each review hangs on the stem after the leaf before it. It has no page of its own, so none of them is ever "here" on a chapter page.
  const bridges = useMemo(() => all.filter((chapter) => chapter.kind === "bridge").map((chapter) => ({ chapter, after: leavesOf(all.slice(0, chapter.pos)).length - 1 })), [all]);
  const berries = useMemo(() => bridgeSpots(STRIP_STEM, strip.leaves, bridges.map((bridge) => bridge.after)), [bridges]);
  const everyState = courseStates(all, progress);
  const berryState = (index: number): ChapterState => {
    const state = everyState[bridges[index].chapter.pos];
    return berryLook(state === "here" ? "ahead" : state, bridges[index].chapter, progress);
  };
  return (
    <nav className="course-strip" aria-label="Your place in the course">
      <svg ref={plant} viewBox="0 0 1360 176" role="group" aria-label="The 16 chapters of the course">
        <Stem id="stem-strip" curves={STRIP_STEM} root={7} tip={3} alive={reachPast(strip.leaves, open, 30, berries.filter((_, index) => berryState(index) !== "locked").map((spot) => spot.along))} tipSize={28} finished={states.every((state) => state === "done" || state === "read")} />
        {chapters.map((chapter, index) => {
          const state = states[index];
          return (
            <Link key={chapter.id} className="gh-leaf-link" href={`/topics/${chapter.id}/`} aria-label={`Chapter ${chapter.num}: ${chapter.title}${state === "locked" ? ", locked" : ""}`} aria-current={chapter.id === currentId ? "page" : undefined}>
              <title>{`${chapter.num}. ${chapter.title}`}</title>
              <LeafShape leaf={strip.leaves[index]} size={SIZE[state]} state={state} num={chapter.num} numSize={state === "here" ? 18 : state === "locked" ? 12 : 14} index={index} delay={0} halo="gh-halo-strip" />
            </Link>
          );
        })}
        {bridges.map(({ chapter }, index) => {
          const state = berryState(index);
          return (
            <Link key={chapter.id} className="gh-leaf-link" href={hrefOf(chapter)} aria-label={`${chapter.title}${state === "locked" ? ", locked" : state === "done" ? ", done" : ", optional"}`}>
              <title>{chapter.title}</title>
              <Flower spot={berries[index]} size={BERRY[state]} state={state} index={chapter.pos} delay={0} />
            </Link>
          );
        })}
      </svg>
    </nav>
  );
}
