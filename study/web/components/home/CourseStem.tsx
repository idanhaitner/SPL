"use client";

import Link from "next/link";
import { LeafShape } from "./LeafShape";
import { Stem } from "./Stem";
import { useLeafBrush } from "./useLeafBrush";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { courseStates, lastOpen, useLoadedProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";
import { growthDelay, NARROW_STEM, spacedLeaves, STEM_GROW, STEM_START, WIDE_STEM, type Leaf } from "@/lib/stem";

const wide = spacedLeaves(WIDE_STEM, 16);
const narrow = spacedLeaves(NARROW_STEM, 16, 0.05, 0.98);

// A leaf is finished, the one to grow next, or not yet open. Nothing in between gets its own look.
const looks = (state: ChapterState): ChapterState => (state === "read" ? "done" : state === "ahead" ? "locked" : state);

const STATE_WORDS: Record<ChapterState, string> = { done: ", done", read: ", read", here: ", you are here", ahead: "", locked: ", locked until the chapter before it is read" };
const WIDE_SIZE: Record<ChapterState, number> = { done: 92, read: 92, here: 118, ahead: 84, locked: 58 };
const NARROW_SIZE: Record<ChapterState, number> = { done: 46, read: 46, here: 58, ahead: 42, locked: 28 };
// Matches .gh-stem-alive-line in motion.css.
const REGROW_MS = 1400;

// How far the stem reaches: a little past the last open leaf, or all the way once every chapter is open.
function reach(leaves: Leaf[], open: number, past: number) {
  return open >= leaves.length - 1 ? undefined : leaves[Math.max(0, open)].along + past;
}

// The plant remembers how far it had grown, so a chapter opened since the last visit grows in while you watch.
// It runs before paint, so the stem is never seen at full length first and then shrinking back to where it starts.
function useRegrowth(courseId: string, open: number | null) {
  const [from, setFrom] = useState<number | null>(null);
  const [growing, setGrowing] = useState(false);
  useLayoutEffect(() => {
    if (open === null) return;
    const key = `study:${courseId}:grown-to`;
    let before: number | null = null;
    try {
      const raw = localStorage.getItem(key);
      before = raw === null ? null : Number(raw);
      localStorage.setItem(key, String(open));
    } catch {}
    // On the first home visit of a browser session the whole plant grows in anyway.
    if (before === null || !(before < open) || !document.documentElement.dataset.grown) return;
    setFrom(before);
    setGrowing(false);
    // Two frames: the first paints the stem where it was, the second starts it growing from there.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setGrowing(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [courseId, open]);
  return { from, growing, shown: from !== null && !growing ? from : open };
}

// What a part's name must keep clear of: every leaf's blade, and the stem between the leaves.
function obstacles(leaves: Leaf[]) {
  const points: { x: number; y: number }[] = [];
  leaves.forEach((leaf, index) => {
    const radians = (leaf.angle * Math.PI) / 180;
    for (const t of [0, 0.35, 0.7, 1]) points.push({ x: leaf.x + Math.cos(radians) * 76 * t, y: leaf.y + Math.sin(radians) * 76 * t });
    const next = leaves[index + 1];
    if (next) points.push({ x: (leaf.x + next.x) / 2, y: (leaf.y + next.y) / 2 });
  });
  return points;
}

const LABEL_SPOTS = Array.from({ length: 12 }, (_, step) => (step * Math.PI) / 6);

// A thin tendril ties a part's name to the leaf where that part begins. The name goes wherever around the leaf is emptiest.
function PartLabel({ label, leaf, leaves, first, delay, locked }: { label: string; leaf: Leaf; leaves: Leaf[]; first: boolean; delay: number; locked: boolean }) {
  const { x, y } = leaf;
  const width = label.length * 13.5;
  const spots = LABEL_SPOTS.map((angle) => {
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
    const anchor: "start" | "end" | "middle" = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
    const [ax, ay] = [x + cos * 64, y + sin * 64];
    const left = anchor === "start" ? ax : anchor === "end" ? ax - width : ax - width / 2;
    const top = sin > 0.35 ? ay : sin < -0.35 ? ay - 26 : ay - 13;
    const clear = Math.min(...obstacles(leaves).map((point) => Math.hypot(Math.max(left - point.x, 0, point.x - (left + width)), Math.max(top - point.y, 0, point.y - (top + 26)))));
    const inside = left > 500 && left + width < 1420 && top > 70;
    return { ax, ay, anchor, top, clear: inside ? clear : -1 };
  });
  const best = first ? spots[9] : spots.reduce((a, b) => (b.clear > a.clear ? b : a));
  const tendril = `M${x} ${y}Q${Math.round((x + best.ax) / 2 + (best.ay - y) * 0.2)} ${Math.round((y + best.ay) / 2 - (best.ax - x) * 0.2)} ${Math.round(best.ax)} ${Math.round(best.ay)}`;
  return (
    <g aria-hidden="true" className={locked ? "is-locked" : undefined} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      <path className="gh-tendril" d={tendril} pathLength={1} />
      <text className="gh-part-label" x={Math.round(best.ax) + (best.anchor === "start" ? 6 : best.anchor === "end" ? -6 : 0)} y={Math.round(best.top + 20)} textAnchor={best.anchor}>{label}</text>
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
  const loaded = useLoadedProgress(courseId);
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

  const states = courseStates(chapters, loaded ?? { solved: [] });
  const { from, growing, shown: openShown } = useRegrowth(courseId, loaded ? lastOpen(states) : null);
  const open = openShown ?? lastOpen(states);
  const regrowing = growing ? "is-regrowing" : undefined;
  const hereIndex = states.indexOf("here");
  const finished = states.every((state) => state === "done" || state === "read");
  const shown = hover === null ? null : wide.leaves[hover];
  // A leaf that opened since the last visit unfurls when the regrowing stem reaches it.
  const sprout = (index: number, leaves: Leaf[]) => {
    if (from === null || !growing || index <= from || index > open) return undefined;
    const start = leaves[from].along;
    const share = (leaves[index].along - start) / Math.max(1, leaves[open].along - start);
    return `${Math.round(share * REGROW_MS)}ms`;
  };
  const leafStyle = (index: number, leaves: Leaf[]) => {
    const delay = sprout(index, leaves);
    return delay ? ({ "--sprout": delay } as React.CSSProperties) : undefined;
  };

  return (
    <>
      <div className="gh-stem-wide" data-ready={loaded ? "" : undefined}>
        <svg ref={plant} className={regrowing} viewBox="0 0 1440 900" preserveAspectRatio="xMaxYMax meet" role="group" aria-label={`The course as one stem, with a leaf for each of its ${chapters.length} chapters. A chapter opens once the one before it is read.`}>
          <Stem id="stem-wide" curves={WIDE_STEM} root={13} tip={5} alive={reach(wide.leaves, open, 52)} sapTo={hereIndex < 0 ? undefined : wide.leaves[hereIndex].along / wide.length} tipSize={46} finished={finished} />
          {partStarts.map(({ label, num }) => {
            const leaf = wide.leaves[num - 1];
            return <PartLabel key={label} label={label} leaf={leaf} leaves={wide.leaves} first={num === 1} delay={growthDelay(leaf.along / wide.length) + 280} locked={looks(states[num - 1]) === "locked"} />;
          })}
          {chapters.map((chapter, index) => {
            const current = looks(index > open ? "locked" : states[index]);
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
                <g className={sprout(index, wide.leaves) ? "is-sprouting" : undefined} style={leafStyle(index, wide.leaves)}>
                  <LeafShape leaf={leaf} size={WIDE_SIZE[current]} state={current} num={chapter.num} numSize={current === "here" ? 25 : current === "locked" ? 17 : 20} index={index} delay={growthDelay(leaf.along / wide.length)} halo="gh-halo-wide" />
                </g>
              </Link>
            );
          })}
          {shown && hover !== null && <LeafTitle key={hover} title={looks(states[hover]) === "locked" ? `Locked · ${chapters[hover].title}` : chapters[hover].title} leaf={shown} size={WIDE_SIZE[looks(states[hover])]} />}
        </svg>
      </div>
      <svg className={`gh-stem-narrow${regrowing ? ` ${regrowing}` : ""}`} viewBox="0 0 390 290" aria-hidden="true" data-ready={loaded ? "" : undefined}>
        <Stem id="stem-narrow" curves={NARROW_STEM} root={6} tip={3} alive={reach(narrow.leaves, open, 14)} tipSize={22} finished={finished} />
        {chapters.map((chapter, index) => {
          const current = looks(index > open ? "locked" : states[index]);
          const leaf = narrow.leaves[index];
          return (
            <g key={chapter.id} className={sprout(index, narrow.leaves) ? "is-sprouting" : undefined} style={leafStyle(index, narrow.leaves)}>
              <LeafShape leaf={leaf} size={NARROW_SIZE[current]} state={current} num={chapter.num} numSize={current === "here" ? 14 : current === "locked" ? 9 : 11} index={index} delay={growthDelay(leaf.along / narrow.length)} halo="gh-halo-narrow" />
            </g>
          );
        })}
      </svg>
    </>
  );
}
