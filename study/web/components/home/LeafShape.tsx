import type { ChapterState } from "@/lib/progress";
import type { Leaf } from "@/lib/stem";

const leafPath = (size: number) => {
  const [near, far, bulge, slim] = [0.35, 0.8, 0.42, 0.34].map((share) => Math.round(size * share * 100) / 100);
  return `M0 0C${near} ${-bulge} ${far} ${-slim} ${size} 0C${far} ${slim} ${near} ${bulge} 0 0Z`;
};

export function LeafShape({ leaf, size, state, num, numSize }: { leaf: Leaf; size: number; state: ChapterState; num: number; numSize: number }) {
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
