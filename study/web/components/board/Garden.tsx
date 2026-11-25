import type { CSSProperties } from "react";
import { Flower } from "@/components/home/Flower";
import { LeafShape } from "@/components/home/LeafShape";
import { Stem } from "@/components/home/Stem";
import { climb, ordinal, type RankedRow } from "@/lib/leaderboard";
import { PLANT_STEM, pointAlong, spacedLeaves, stemTip, type Leaf } from "@/lib/stem";

export const GARDEN_MAX = 12;
const BOX = { width: 120, height: 300 };
const LEAF = 27;

// Every plant shares one stem and one set of leaf places, so the same chapter sits at the same height on all of them.
function shape(total: number) {
  return spacedLeaves(PLANT_STEM, total, 0.1, 0.9);
}

// One flower crowns each plant, at its growing tip. It stays a closed bud until the first review is done, and opens wider with each one.
// The leader's is the pale bloom that glows.
function Crown({ at, reviews, leader, index }: { at: { x: number; y: number; angle: number }; reviews: number; leader: boolean; index: number }) {
  const state = reviews === 0 ? "locked" : leader ? "here" : "done";
  const size = reviews === 0 ? 18 : 22 + Math.min(reviews, 6) * 3;
  return <Flower spot={{ x: at.x, y: at.y, heading: at.angle, angle: at.angle, side: 1, along: 0 }} size={size} state={state} index={index} delay={0} />;
}

// How far up the stem `solved` questions reach. A chapter's leaf is reached once its questions and every one before it are solved,
// and each question in between grows the stem part of the way to the next leaf.
function reach(leaves: Leaf[], marks: number[], solved: number) {
  const anchor = (k: number) => (k === 0 ? leaves[0].along * 0.4 : leaves[k - 1].along + 6);
  const at = climb(solved, marks);
  const below = Math.floor(at);
  return below >= leaves.length ? anchor(leaves.length) : anchor(below) + (anchor(below + 1) - anchor(below)) * (at - below);
}

function Plant({ row, index, total, marks, leader, you, geometry }: { row: RankedRow; index: number; total: number; marks: number[]; leader: boolean; you: boolean; geometry: ReturnType<typeof shape> }) {
  const { leaves } = geometry;
  const grown = Math.min(row.chapters, total);
  const finished = grown >= total || (marks.length > 0 && row.solved >= marks[marks.length - 1]);
  // The stem grows with every question solved. It never stops below a leaf it already carries,
  // which can happen when a student skipped a review or finished chapters out of order.
  const alive = finished ? undefined : Math.max(reach(leaves, marks, row.solved), grown === 0 ? 0 : leaves[grown - 1].along + 6);
  const id = `board-plant-${index}`;
  return (
    <figure className={`board-plant${you ? " is-you" : ""}${leader ? " is-leader" : ""}`} style={{ "--p": index } as CSSProperties} aria-label={`${row.name}: ${grown} of ${total} chapters done, ${row.solved} ${row.solved === 1 ? "question" : "questions"} solved, ${row.reviews} ${row.reviews === 1 ? "review" : "reviews"}`}>
      <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} aria-hidden="true">
        <Stem id={id} curves={PLANT_STEM} root={7} tip={2.4} alive={alive} tipSize={6} finished={finished} />
        {leaves.slice(0, grown).map((leaf, i) => (
          <LeafShape key={i} leaf={leaf} size={LEAF} state="done" num={0} numSize={0} index={i} delay={0} halo={`${id}-halo`} />
        ))}
        <Crown at={alive === undefined ? stemTip(PLANT_STEM) : pointAlong(PLANT_STEM, alive)} reviews={row.reviews} leader={leader} index={grown} />
      </svg>
      <figcaption>
        <span className="board-plaque">{ordinal(row.place)}</span>
        <bdi className="board-plant-name">{row.name}</bdi>
        <span className="board-plant-count">{you ? "You · " : ""}{grown} of {total}</span>
      </figcaption>
    </figure>
  );
}

// The bed: the leaders' plants side by side, most chapters first, each as tall as the questions its student solved, with the four parts marked across them at the heights where they begin.
export function Garden({ rows, you, total, marks, partStarts }: { rows: RankedRow[]; you: string | null; total: number; marks: number[]; partStarts: { label: string; num: number }[] }) {
  const shown = rows.filter((row) => !row.stale).slice(0, GARDEN_MAX);
  if (shown.length === 0) return null;
  const geometry = shape(total);
  const lines = partStarts.map(({ label, num }) => ({ label, at: geometry.leaves[Math.max(0, num - 1)].y / BOX.height }));
  return (
    <section className="board-garden" aria-label="Everyone's plants">
      <div className="board-garden-parts" aria-hidden="true">
        {lines.map((line) => (
          <span key={line.label} style={{ "--at": line.at } as CSSProperties}>{line.label}</span>
        ))}
      </div>
      <div className="board-garden-bed">
        <div className="board-garden-row" style={{ "--n": shown.length } as CSSProperties}>
          {lines.map((line) => (
            <i key={line.label} className="board-garden-line" style={{ "--at": line.at } as CSSProperties} aria-hidden="true" />
          ))}
          {shown.map((row, index) => (
            <Plant key={row.id} row={row} index={index} total={total} marks={marks} leader={row.place === 1} you={row.id === you} geometry={geometry} />
          ))}
        </div>
      </div>
    </section>
  );
}
