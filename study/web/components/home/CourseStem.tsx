"use client";

import Link from "next/link";
import { LeafShape } from "./LeafShape";
import { Stem } from "./Stem";
import { useLeafBrush } from "./useLeafBrush";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { chapterState, nextChapter, useProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";
import { growthDelay, NARROW_STEM, spacedLeaves, STEM_GROW, STEM_START, WIDE_STEM, type Leaf } from "@/lib/stem";

const LEAD = { x: -900, y: 790 };
const wide = spacedLeaves(WIDE_STEM, 16);
const narrow = spacedLeaves(NARROW_STEM, 16, 0.05, 0.98);

const STATE_WORDS: Record<ChapterState, string> = { done: ", done", read: ", read", here: ", you are here", ahead: "" };
const WIDE_SIZE: Record<ChapterState, number> = { done: 92, read: 92, here: 118, ahead: 84 };
const NARROW_SIZE: Record<ChapterState, number> = { done: 46, read: 46, here: 58, ahead: 42 };

// The length of stem that has grown: up to the last chapter in an unbroken run of read or finished ones.
function grown(chapters: ChapterInfo[], states: ChapterState[], leaves: Leaf[]) {
  const broken = chapters.findIndex((_, index) => states[index] !== "done" && states[index] !== "read");
  const run = broken < 0 ? chapters.length : broken;
  return run === 0 ? 0 : leaves[run - 1].along;
}

// A thin tendril ties a part's name to the leaf where that part begins.
function PartLabel({ label, leaf, first, last, delay }: { label: string; leaf: Leaf; first: boolean; last: boolean; delay: number }) {
  const { x, y } = leaf;
  // The last part starts near the top, where a tendril curving down would cross the next leaf, so it reaches straight out.
  const tendril = first
    ? `M${x} ${y}C${x - 4} ${y - 18} ${x - 10} ${y - 26} ${x - 22} ${y - 30}`
    : last
      ? `M${x} ${y}C${x + 14} ${y + 10} ${x + 36} ${y + 14} ${x + 62} ${y + 8}`
      : `M${x} ${y}C${x + 18} ${y + 42} ${x + 54} ${y + 56} ${x + 104} ${y + 48}`;
  const labelX = first ? x - 30 : last ? x + 72 : x + 114;
  const labelY = first ? y - 24 : last ? y + 15 : y + 55;
  return (
    <g aria-hidden="true" style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      <path className="gh-tendril" d={tendril} pathLength={1} />
      <text className="gh-part-label" x={labelX} y={labelY} textAnchor={first ? "end" : "start"}>{label}</text>
    </g>
  );
}

// A chapter's name on a small plate, measured so the plate fits it exactly.
function LeafTitle({ title, leaf, size }: { title: string; leaf: Leaf; size: number }) {
  const text = useRef<SVGTextElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => setWidth(text.current?.getComputedTextLength() ?? 0), [title]);
  const radians = (leaf.angle * Math.PI) / 180;
  const tipX = leaf.x + Math.cos(radians) * size;
  const tipY = leaf.y + Math.sin(radians) * size;
  const plate = width + 36;
  // The plate sits past the leaf's tip, on the side it points to, so it never covers the leaf it names.
  const toLeft = Math.cos(radians) < 0 || tipX + 14 + plate > 1430;
  const left = toLeft ? Math.min(leaf.x, tipX) - 14 - plate : tipX + 14;
  return (
    <g className="gh-leaf-title" aria-hidden="true" style={{ visibility: width ? "visible" : "hidden" }}>
      <rect x={left} y={tipY - 24} width={plate} height={48} rx={24} />
      <text ref={text} x={left + 18} y={tipY + 8}>{title}</text>
    </g>
  );
}

export function CourseStem({ courseId, chapters, partStarts }: { courseId: string; chapters: ChapterInfo[]; partStarts: { label: string; num: number }[] }) {
  const progress = useProgress(courseId);
  const [hover, setHover] = useState<number | null>(null);
  const plant = useRef<SVGSVGElement>(null);
  useLeafBrush(plant);

  // The plant grows once per browser session; coming back to home later, it is simply there.
  useEffect(() => {
    const settle = () => {
      try {
        sessionStorage.setItem("study:grown", "1");
      } catch {}
      document.documentElement.dataset.grown = "1";
    };
    const timer = setTimeout(settle, STEM_START + STEM_GROW + 1200);
    return () => {
      clearTimeout(timer);
      settle();
    };
  }, []);

  const next = nextChapter(chapters, progress);
  const states = chapters.map((chapter) => chapterState(chapter, next, progress));
  const wideLength = grown(chapters, states, wide.leaves);
  const narrowLength = grown(chapters, states, narrow.leaves);
  const hereIndex = states.indexOf("here");
  const shown = hover === null ? null : wide.leaves[hover];

  return (
    <>
      <div className="gh-stem-wide">
        <svg ref={plant} viewBox="0 0 1440 900" preserveAspectRatio="xMaxYMax meet" role="group" aria-label="The course as one stem, with a leaf for each of its 16 chapters">
          <Stem id="stem-wide" curves={WIDE_STEM} root={13} tip={5} grown={wideLength} lead={LEAD} sapTo={hereIndex < 0 ? undefined : wide.leaves[hereIndex].along / wide.length} tipSize={46} />
          {partStarts.map(({ label, num }) => {
            const leaf = wide.leaves[num - 1];
            return <PartLabel key={label} label={label} leaf={leaf} first={num === 1} last={label === partStarts[partStarts.length - 1].label} delay={growthDelay(leaf.along / wide.length) + 280} />;
          })}
          {chapters.map((chapter, index) => {
            const current = states[index];
            const leaf = wide.leaves[index];
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
                <LeafShape leaf={leaf} size={WIDE_SIZE[current]} state={current} num={chapter.num} numSize={current === "here" ? 25 : 20} index={index} delay={growthDelay(leaf.along / wide.length)} halo="gh-halo-wide" />
              </Link>
            );
          })}
          {shown && hover !== null && <LeafTitle key={hover} title={chapters[hover].title} leaf={shown} size={WIDE_SIZE[states[hover]]} />}
        </svg>
      </div>
      <svg className="gh-stem-narrow" viewBox="0 0 390 290" aria-hidden="true">
        <Stem id="stem-narrow" curves={NARROW_STEM} root={6} tip={3} grown={narrowLength} tipSize={22} />
        {chapters.map((chapter, index) => {
          const current = states[index];
          const leaf = narrow.leaves[index];
          return <LeafShape key={chapter.id} leaf={leaf} size={NARROW_SIZE[current]} state={current} num={chapter.num} numSize={current === "here" ? 14 : 11} index={index} delay={growthDelay(leaf.along / narrow.length)} halo="gh-halo-narrow" />;
        })}
      </svg>
    </>
  );
}
