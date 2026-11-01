"use client";

import Link from "next/link";
import { useState } from "react";
import { chapterState, isDone, nextChapter, useProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";
import { curvePath, NARROW_STEM, spacedLeaves, WIDE_STEM, type Leaf } from "@/lib/stem";

const LEAD = { x: -900, y: 790 };
const wide = spacedLeaves(WIDE_STEM, 16);
const narrow = spacedLeaves(NARROW_STEM, 16, 0.05, 0.98);

const leafPath = (size: number) => {
  const [near, far, bulge, slim] = [0.35, 0.8, 0.42, 0.34].map((share) => Math.round(size * share * 100) / 100);
  return `M0 0C${near} ${-bulge} ${far} ${-slim} ${size} 0C${far} ${slim} ${near} ${bulge} 0 0Z`;
};

const STATE_WORDS: Record<ChapterState, string> = { done: ", done", read: ", read", here: ", you are here", ahead: "" };

function LeafShape({ leaf, size, state, num, numSize }: { leaf: Leaf; size: number; state: ChapterState; num: number; numSize: number }) {
  const radians = (leaf.angle * Math.PI) / 180;
  const textX = Math.round((leaf.x + Math.cos(radians) * size * 0.55) * 100) / 100;
  const textY = Math.round((leaf.y + Math.sin(radians) * size * 0.55 + numSize * 0.34) * 100) / 100;
  return (
    <g className={`gh-leaf is-${state}`}>
      <path d={leafPath(size)} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`} />
      <text x={textX} y={textY} textAnchor="middle" fontSize={numSize}>{num}</text>
    </g>
  );
}

// The length of stem that has grown: up to the last chapter in an unbroken run of read or finished ones.
function grown(chapters: ChapterInfo[], states: ChapterState[], leaves: Leaf[]) {
  const broken = chapters.findIndex((_, index) => states[index] !== "done" && states[index] !== "read");
  const run = broken < 0 ? chapters.length : broken;
  return run === 0 ? 0 : leaves[run - 1].along;
}

export function CourseStem({ courseId, chapters, partStarts }: { courseId: string; chapters: ChapterInfo[]; partStarts: { label: string; num: number }[] }) {
  const progress = useProgress(courseId);
  const [hover, setHover] = useState<number | null>(null);
  const next = nextChapter(chapters, progress);
  const states = chapters.map((chapter) => chapterState(chapter, next, progress));
  const wideLength = grown(chapters, states, wide.leaves);
  const narrowLength = grown(chapters, states, narrow.leaves);
  const shown = hover === null ? null : wide.leaves[hover];

  return (
    <>
      <div className="gh-stem-wide">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMaxYMax meet" role="group" aria-label="The course as one stem, with a leaf for each of its 16 chapters">
          <path className="gh-stem" d={curvePath(WIDE_STEM, LEAD)} />
          {wideLength > 0 && <path className="gh-stem is-grown" d={curvePath(WIDE_STEM)} strokeDasharray={`${wideLength} 9999`} />}
          {partStarts.map(({ label, num }) => {
            const leaf = wide.leaves[num - 1];
            return (
              <g key={label} aria-hidden="true">
                <circle className="gh-part-node" cx={leaf.x} cy={leaf.y} r="9" />
                {/* The first part starts low on the stem, where its leaves would cover a label to the right. */}
                <text className="gh-part-label" x={num === 1 ? leaf.x - 18 : leaf.x + 96} y={num === 1 ? leaf.y - 24 : leaf.y + 44} textAnchor={num === 1 ? "end" : "start"}>{label}</text>
              </g>
            );
          })}
          {chapters.map((chapter, index) => {
            const current = states[index];
            const big = current !== "ahead";
            return (
              <Link
                key={chapter.id}
                className="gh-leaf-link"
                href={`/topics/${chapter.id}`}
                aria-label={`Chapter ${chapter.num}: ${chapter.title}${STATE_WORDS[current]}`}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(index)}
                onBlur={() => setHover(null)}
              >
                <LeafShape leaf={wide.leaves[index]} size={big ? 92 : 66} state={current} num={chapter.num} numSize={big ? 20 : 16} />
              </Link>
            );
          })}
          {shown && hover !== null && (
            <text className="gh-leaf-title" aria-hidden="true" x={shown.x < 760 ? shown.x - 16 : shown.x - 84} y={shown.x < 760 ? shown.y - 84 : shown.y + 6} textAnchor={shown.x < 760 ? "start" : "end"}>
              {chapters[hover].title}
            </text>
          )}
        </svg>
      </div>
      <svg className="gh-stem-narrow" viewBox="0 0 390 290" aria-hidden="true">
        <path className="gh-stem" d={curvePath(NARROW_STEM)} />
        {narrowLength > 0 && <path className="gh-stem is-grown" d={curvePath(NARROW_STEM)} strokeDasharray={`${narrowLength} 9999`} />}
        {chapters.map((chapter, index) => {
          const current = states[index];
          return <LeafShape key={chapter.id} leaf={narrow.leaves[index]} size={current === "ahead" ? 40 : 50} state={current} num={chapter.num} numSize={12} />;
        })}
      </svg>
    </>
  );
}
