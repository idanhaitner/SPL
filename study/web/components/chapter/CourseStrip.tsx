"use client";

import Link from "next/link";
import { useRef } from "react";
import { LeafShape } from "@/components/home/LeafShape";
import { Stem } from "@/components/home/Stem";
import { useLeafBrush } from "@/components/home/useLeafBrush";
import { courseStates, lastOpen, useProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";
import { spacedLeaves, STRIP_STEM } from "@/lib/stem";

const strip = spacedLeaves(STRIP_STEM, 16, 0.03, 0.97);
const SIZE: Record<ChapterState, number> = { done: 60, read: 60, here: 78, ahead: 54, locked: 40 };

// This chapter's place on the one course stem.
export function CourseStrip({ courseId, chapters, currentId }: { courseId: string; chapters: ChapterInfo[]; currentId: string }) {
  const progress = useProgress(courseId);
  const plant = useRef<SVGSVGElement>(null);
  useLeafBrush(plant);
  // This page's chapter is the one marked here, wherever the course's next chapter is, unless it has not opened yet.
  const states = courseStates(chapters, progress).map((state, index): ChapterState => (state === "locked" ? state : chapters[index].id === currentId ? "here" : state === "here" ? "ahead" : state));
  const open = lastOpen(states);
  return (
    <nav className="course-strip" aria-label="Your place in the course">
      <svg ref={plant} viewBox="0 0 1360 176" role="group" aria-label="The 16 chapters of the course">
        <Stem id="stem-strip" curves={STRIP_STEM} root={7} tip={3} alive={open >= chapters.length - 1 ? undefined : strip.leaves[open].along + 30} tipSize={28} finished={states.every((state) => state === "done" || state === "read")} />
        {chapters.map((chapter, index) => {
          const state = states[index];
          return (
            <Link key={chapter.id} className="gh-leaf-link" href={`/topics/${chapter.id}/`} aria-label={`Chapter ${chapter.num}: ${chapter.title}${state === "locked" ? ", locked" : ""}`} aria-current={chapter.id === currentId ? "page" : undefined}>
              <title>{`${chapter.num}. ${chapter.title}`}</title>
              <LeafShape leaf={strip.leaves[index]} size={SIZE[state]} state={state} num={chapter.num} numSize={state === "here" ? 18 : state === "locked" ? 12 : 14} index={index} delay={0} halo="gh-halo-strip" />
            </Link>
          );
        })}
      </svg>
    </nav>
  );
}
