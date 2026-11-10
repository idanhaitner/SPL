"use client";

import Link from "next/link";
import { LeafShape, LeafSpark, SparkGlow } from "./LeafShape";
import { Stem } from "./Stem";
import { useLeafBrush } from "./useLeafBrush";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { lastOpen, leafStates, leavesOf, useLoadedProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";
import { growthDelay, NARROW_STEM, spacedLeaves, STEM_GROW, STEM_START, stemTip, WIDE_STEM, type Leaf, type StemCurves } from "@/lib/stem";

const wide = spacedLeaves(WIDE_STEM, 16);
// The crown at the stem's end, placed like a leaf so a spark can open on it.
const tipOf = (curves: StemCurves) => {
  const { x, y, angle } = stemTip(curves);
  return { x, y, angle };
};
const narrow = spacedLeaves(NARROW_STEM, 16, 0.05, 0.98);

// A leaf is finished, the one to grow next, or not yet open. Nothing in between gets its own look.
const looks = (state: ChapterState): ChapterState => (state === "read" ? "done" : state === "ahead" ? "locked" : state);

const STATE_WORDS: Record<ChapterState, string> = { done: ", done", read: ", read", here: ", you are here", ahead: "", locked: ", locked until the chapter before it is read" };
const WIDE_SIZE: Record<ChapterState, number> = { done: 92, read: 92, here: 118, ahead: 84, locked: 58 };
const NARROW_SIZE: Record<ChapterState, number> = { done: 46, read: 46, here: 58, ahead: 42, locked: 28 };
// A regrowth, in ms from when it starts: sap climbs to the leaf just finished, that leaf ripens, then the stem grows on.
// SURGE_AT and REGROW_MS match .gh-surge and .is-regrowing .gh-stem-alive-line in motion.css.
const SURGE_AT = 200;
const RIPEN_AT = 950;
const GROW_AT = 1250;
const REGROW_MS = 1400;

type Phase = "rest" | "surge" | "ripe" | "growing";

// How far the stem reaches: a little past the last open leaf, or all the way once every chapter is open.
function reach(leaves: Leaf[], open: number, past: number) {
  return open >= leaves.length - 1 ? undefined : leaves[Math.max(0, open)].along + past;
}

// The plant remembers how far it had grown, so a chapter opened since the last visit grows in while you watch.
// It runs before paint, so the stem is never seen at full length first and then shrinking back to where it starts.
// `since` says where to grow from instead (the chapter just finished); then it plays even when nothing new opened, for the last chapter.
function useRegrowth(courseId: string, open: number | null, since?: number) {
  const [from, setFrom] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("rest");
  useLayoutEffect(() => {
    if (open === null) return;
    const key = `study:${courseId}:grown-to`;
    let before: number | null = null;
    try {
      const raw = localStorage.getItem(key);
      before = raw === null ? null : Number(raw);
    } catch {}
    // Saved a beat later, so an effect that runs twice in a row still sees where the plant was.
    const timers = [setTimeout(() => {
      try {
        localStorage.setItem(key, String(open));
      } catch {}
    })];
    const start = since ?? before;
    // On the first home visit of a browser session the whole plant grows in anyway.
    const grows = since === undefined ? before !== null && before < open && document.documentElement.dataset.grown : since <= open;
    if (start === null || !grows) return () => timers.forEach(clearTimeout);
    setFrom(start);
    setPhase("surge");
    timers.push(setTimeout(() => setPhase("ripe"), RIPEN_AT), setTimeout(() => setPhase("growing"), GROW_AT));
    return () => timers.forEach(clearTimeout);
  }, [courseId, open, since]);
  return { from, phase, shown: from !== null && phase !== "growing" ? from : open };
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
function LeafTitle({ title, leaf, size, delay }: { title: string; leaf: Leaf; size: number; delay?: string }) {
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
    <g className="gh-leaf-title" aria-hidden="true" style={{ visibility: width ? "visible" : "hidden", "--title-at": delay } as React.CSSProperties}>
      <rect x={left} y={tipY - 24} width={plate} height={48} rx={24} />
      <text ref={text} x={left + 18} y={tipY + 8}>{title}</text>
    </g>
  );
}

// `name` keeps its drawing's ids apart from another plant on the page; `since` is set when a finished chapter is being celebrated.
export function CourseStem({ courseId, chapters: all, partStarts, name = "stem", since }: { courseId: string; chapters: ChapterInfo[]; partStarts: { label: string; num: number }[]; name?: string; since?: number }) {
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

  // One leaf per chapter: the reviews between chapters are not drawn, though each still holds the next leaf shut.
  const chapters = leavesOf(all);
  const states = leafStates(all, loaded ?? { solved: [] });
  const { from, phase, shown: openShown } = useRegrowth(courseId, loaded ? lastOpen(states) : null, since);
  const open = openShown ?? lastOpen(states);
  const growing = phase === "growing";
  const regrowing = growing ? "is-regrowing" : undefined;
  const hereIndex = states.indexOf("here");
  // Until the regrowth reaches it, the leaf just finished still looks like the one to grow next, and the plant is not yet in flower.
  const waiting = phase === "surge" && from !== null;
  const finished = !waiting && phase !== "ripe" && states.every((state) => state === "done" || state === "read");
  // The last chapter opens no leaf; finishing it opens the crown instead.
  const flowering = growing && from === open && finished;
  // When a celebrated chapter opens a new leaf, its name comes up once the stem has reached it.
  const announced = since !== undefined && growing && from !== open ? open : null;
  const titled = hover ?? announced;
  const shown = titled === null ? null : wide.leaves[titled];
  const lookOf = (index: number): ChapterState => (waiting && index === from ? "here" : looks(index > open ? "locked" : states[index]));
  const ripening = (index: number) => from !== null && index === from && (phase === "ripe" || growing);
  // A leaf that opened since the last visit unfurls when the regrowing stem reaches it.
  const sprout = (index: number, leaves: Leaf[]) => {
    if (from === null || !growing || index <= from || index > open) return undefined;
    const start = leaves[from].along;
    const share = (leaves[index].along - start) / Math.max(1, leaves[open].along - start);
    return `${Math.round(share * REGROW_MS)}ms`;
  };
  const leafStyle = (index: number, leaves: Leaf[], sizes: Record<ChapterState, number>) => {
    const delay = sprout(index, leaves);
    if (delay) return { "--sprout": delay } as React.CSSProperties;
    // A ripening leaf shrinks from its "here" size to its finished size, so it starts drawn that much larger.
    if (ripening(index)) return { "--ripen-from": Math.round((sizes.here / sizes.done) * 1000) / 1000 } as React.CSSProperties;
    return undefined;
  };
  const leafClass = (index: number, leaves: Leaf[]) => (sprout(index, leaves) ? "is-sprouting" : ripening(index) ? "is-ripening" : undefined);
  // The burst that goes with a change: on the finished leaf as it ripens, on a new leaf as its bud breaks.
  const spark = (index: number, leaves: Leaf[], sizes: Record<ChapterState, number>, glow: string) => {
    const delay = sprout(index, leaves);
    if (delay) return <LeafSpark leaf={leaves[index]} size={sizes.here} at={delay} glow={glow} />;
    return ripening(index) ? <LeafSpark leaf={leaves[index]} size={sizes.done} at="0ms" glow={glow} /> : null;
  };
  // The bud a new leaf grows out of stays until the stem reaches it, then swells and breaks.
  const bud = (index: number, leaves: Leaf[], sizes: Record<ChapterState, number>, numSize: number) =>
    sprout(index, leaves) && (
      <g className="gh-bud-burst">
        <LeafShape leaf={leaves[index]} size={sizes.locked} state="locked" num={chapters[index].num} numSize={numSize} index={index} delay={0} halo="" />
      </g>
    );
  const surge = (leaves: Leaf[], length: number) => (from !== null && phase !== "rest" ? leaves[from].along / length : undefined);
  const front = (leaves: Leaf[], length: number, past: number) => (from !== null && from < lastOpen(states) && phase !== "rest" ? reach(leaves, open, past) ?? length : undefined);

  return (
    <>
      <div className="gh-stem-wide" data-ready={loaded ? "" : undefined}>
        <svg ref={plant} className={[regrowing, flowering && "is-flowering"].filter(Boolean).join(" ") || undefined} viewBox="0 0 1440 900" preserveAspectRatio="xMaxYMax meet" role="group" aria-label={`The course as one stem, with a leaf for each of its ${chapters.length} chapters. A chapter opens once the one before it is read.`}>
          {from !== null && <defs><SparkGlow id={`${name}-glow-wide`} /></defs>}
          <Stem id={`${name}-wide`} curves={WIDE_STEM} root={13} tip={5} alive={reach(wide.leaves, open, 52)} sapTo={hereIndex < 0 || waiting || phase === "ripe" ? undefined : wide.leaves[hereIndex].along / wide.length} surgeTo={surge(wide.leaves, wide.length)} front={front(wide.leaves, wide.length, 52)} tipSize={46} finished={finished} />
          {flowering && <LeafSpark leaf={{ ...wide.leaves[0], ...tipOf(WIDE_STEM), along: 0 }} size={92} at="0ms" glow={`${name}-glow-wide`} />}
          {partStarts.map(({ label, num }) => {
            const leaf = wide.leaves[num - 1];
            return <PartLabel key={label} label={label} leaf={leaf} leaves={wide.leaves} first={num === 1} delay={growthDelay(leaf.along / wide.length) + 280} locked={looks(states[num - 1]) === "locked"} />;
          })}
          {chapters.map((chapter, index) => {
            const current = lookOf(index);
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
                <g className={leafClass(index, wide.leaves)} style={leafStyle(index, wide.leaves, WIDE_SIZE)}>
                  {bud(index, wide.leaves, WIDE_SIZE, 17)}
                  <LeafShape leaf={leaf} size={WIDE_SIZE[current]} state={current} num={chapter.num} numSize={current === "here" ? 25 : current === "locked" ? 17 : 20} index={index} delay={growthDelay(leaf.along / wide.length)} halo={`${name}-halo-wide`} />
                  {spark(index, wide.leaves, WIDE_SIZE, `${name}-glow-wide`)}
                </g>
              </Link>
            );
          })}
          {shown && titled !== null && <LeafTitle key={titled} title={lookOf(titled) === "locked" ? `Locked · ${chapters[titled].title}` : chapters[titled].title} leaf={shown} size={WIDE_SIZE[lookOf(titled)]} delay={hover === null ? `${REGROW_MS}ms` : undefined} />}
        </svg>
      </div>
      <svg className={["gh-stem-narrow", regrowing, flowering && "is-flowering"].filter(Boolean).join(" ")} viewBox="0 0 390 290" aria-hidden="true" data-ready={loaded ? "" : undefined}>
        {from !== null && <defs><SparkGlow id={`${name}-glow-narrow`} /></defs>}
        <Stem id={`${name}-narrow`} curves={NARROW_STEM} root={6} tip={3} alive={reach(narrow.leaves, open, 14)} surgeTo={surge(narrow.leaves, narrow.length)} front={front(narrow.leaves, narrow.length, 14)} tipSize={22} finished={finished} />
        {flowering && <LeafSpark leaf={{ ...narrow.leaves[0], ...tipOf(NARROW_STEM), along: 0 }} size={46} at="0ms" glow={`${name}-glow-narrow`} />}
        {chapters.map((chapter, index) => {
          const current = lookOf(index);
          const leaf = narrow.leaves[index];
          // A transparent disc over the leaf gives a finger at least a 44-unit target, since the drawn leaves are tiny.
          const radians = (leaf.angle * Math.PI) / 180;
          const reachSize = NARROW_SIZE[current];
          return (
            <Link
              key={chapter.id}
              className="gh-leaf-link"
              href={`/topics/${chapter.id}`}
              aria-label={`Chapter ${chapter.num}: ${chapter.title}${STATE_WORDS[current]}`}
            >
              <g className={leafClass(index, narrow.leaves)} style={leafStyle(index, narrow.leaves, NARROW_SIZE)}>
                {bud(index, narrow.leaves, NARROW_SIZE, 9)}
                <LeafShape leaf={leaf} size={reachSize} state={current} num={chapter.num} numSize={current === "here" ? 14 : current === "locked" ? 9 : 11} index={index} delay={growthDelay(leaf.along / narrow.length)} halo={`${name}-halo-narrow`} />
                {spark(index, narrow.leaves, NARROW_SIZE, `${name}-glow-narrow`)}
              </g>
              <circle cx={leaf.x + Math.cos(radians) * reachSize * 0.5} cy={leaf.y + Math.sin(radians) * reachSize * 0.5} r={Math.max(22, reachSize * 0.55)} fill="transparent" />
            </Link>
          );
        })}
      </svg>
    </>
  );
}
