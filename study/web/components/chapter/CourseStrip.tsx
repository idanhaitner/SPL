"use client";

import Link from "next/link";
import { LeafShape } from "@/components/home/LeafShape";
import { isDone, isRead, useProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";
import { curvePath, spacedLeaves, STRIP_STEM } from "@/lib/stem";

const strip = spacedLeaves(STRIP_STEM, 16, 0.03, 0.98);

// This chapter's place on the one course stem.
export function CourseStrip({ courseId, chapters, currentId }: { courseId: string; chapters: ChapterInfo[]; currentId: string }) {
  const progress = useProgress(courseId);
  const stateOf = (chapter: ChapterInfo): ChapterState => {
    if (isDone(chapter, progress)) return "done";
    if (chapter.id === currentId) return "here";
    return isRead(chapter, progress) ? "read" : "ahead";
  };
  const states = chapters.map(stateOf);
  const broken = states.findIndex((state) => state !== "done" && state !== "read");
  const run = broken < 0 ? chapters.length : broken;
  const grown = run === 0 ? 0 : strip.leaves[run - 1].along;
  return (
    <nav className="course-strip" aria-label="Your place in the course">
      <svg viewBox="0 0 1360 176" role="group" aria-label="The 16 chapters of the course">
        <path className="gh-stem is-thin" d={curvePath(STRIP_STEM)} />
        {grown > 0 && <path className="gh-stem is-thin is-grown" d={curvePath(STRIP_STEM)} strokeDasharray={`${grown} 9999`} />}
        {chapters.map((chapter, index) => {
          const state = states[index];
          return (
            <Link key={chapter.id} className="gh-leaf-link" href={`/topics/${chapter.id}/`} aria-label={`Chapter ${chapter.num}: ${chapter.title}`} aria-current={chapter.id === currentId ? "page" : undefined}>
              <title>{`${chapter.num}. ${chapter.title}`}</title>
              <LeafShape leaf={strip.leaves[index]} size={state === "ahead" ? 44 : 60} state={state} num={chapter.num} numSize={state === "ahead" ? 13 : 16} />
            </Link>
          );
        })}
      </svg>
    </nav>
  );
}
