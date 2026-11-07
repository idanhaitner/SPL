import type { CSSProperties } from "react";
import type { ChapterState } from "@/lib/progress";
import type { Leaf } from "@/lib/stem";

// One leaf, drawn along +x from where its stalk meets the stem. Every number is a share of its length.
const UPPER = [[0.14, 0, 0.2, -0.25, 0.44, -0.34, 0.65, -0.23], [0.8, -0.15, 0.92, -0.06, 1, -0.02]];
const LOWER = [[0.14, 0, 0.17, 0.2, 0.38, 0.31, 0.59, 0.22], [0.76, 0.15, 0.9, 0.04, 1, -0.02]];
const MIDRIB = [0.74, -0.04, 0.42, 0.02, 0.14, 0];
const VEINS = [
  [0.28, 0, 0.35, -0.13, 0.46, -0.215], [0.43, 0, 0.52, -0.12, 0.64, -0.19], [0.58, -0.01, 0.67, -0.08, 0.78, -0.12],
  [0.28, 0, 0.34, 0.11, 0.43, 0.2], [0.43, 0, 0.51, 0.11, 0.6, 0.18], [0.58, -0.01, 0.66, 0.06, 0.76, 0.1],
];

const scaled = (values: number[], size: number) => values.map((value) => Math.round(value * size * 100) / 100).join(" ");

function half([first, second]: number[][], size: number) {
  return `M${scaled(first.slice(0, 2), size)}C${scaled(first.slice(2), size)}C${scaled(second, size)}C${scaled(MIDRIB, size)}Z`;
}

function outline(size: number) {
  const back = (curve: number[], from: number[]) => [curve[2], curve[3], curve[0], curve[1], from[0], from[1]];
  return `M${scaled(UPPER[0].slice(0, 2), size)}C${scaled(UPPER[0].slice(2), size)}C${scaled(UPPER[1], size)}C${scaled(back(LOWER[1], LOWER[0].slice(6)), size)}C${scaled(back(LOWER[0].slice(2), LOWER[0]), size)}Z`;
}

// The blade alone: two tones split by a curved midrib, with fine veins. `flip` mirrors it across the midrib.
export function LeafBlade({ size, flip = false }: { size: number; flip?: boolean }) {
  return (
    <g transform={flip ? "scale(1 -1)" : undefined}>
      <path className="gh-blade-shade" d={half(LOWER, size)} />
      <path className="gh-blade-light" d={half(UPPER, size)} />
      <path className="gh-blade-veins" d={`M${scaled(UPPER[1].slice(4), size)}C${scaled(MIDRIB, size)}${VEINS.map((vein) => `M${scaled(vein.slice(0, 2), size)}Q${scaled(vein.slice(2), size)}`).join("")}`} />
      <path className="gh-blade-edge" d={outline(size)} />
    </g>
  );
}

const STALK = 0.15;

const r = (value: number) => Math.round(value * 100) / 100;

// A chapter that has not opened yet: a closed bud waiting on the line the stem will climb.
function Bud({ leaf, size, num, numSize, style }: { leaf: Leaf; size: number; num: number; numSize: number; style: CSSProperties }) {
  const [from, to, wide] = [size * 0.12, size, size * 0.3];
  const mid = (from + to) / 2;
  return (
    <g className="gh-leaf is-locked" transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`} style={style}>
      <path className="gh-leaf-stalk" d={`M0 0L${r(from)} 0`} strokeWidth={2} />
      <path className="gh-bud" d={`M${r(from)} 0C${r(mid - size * 0.2)} ${r(wide)} ${r(mid + size * 0.2)} ${r(wide)} ${r(to)} 0C${r(mid + size * 0.2)} ${r(-wide)} ${r(mid - size * 0.2)} ${r(-wide)} ${r(from)} 0Z`} />
      <text className="gh-leaf-num" x={r(mid)} y={r(numSize * 0.35)} textAnchor="middle" fontSize={numSize} transform={`rotate(${-leaf.angle} ${r(mid)} 0)`}>{num}</text>
    </g>
  );
}

export function LeafShape({ leaf, size, state, num, numSize, index, delay, halo }: { leaf: Leaf; size: number; state: ChapterState; num: number; numSize: number; index: number; delay: number; halo: string }) {
  const textX = Math.round(size * 0.52 * 100) / 100;
  const textY = Math.round(numSize * 0.35 * 100) / 100;
  const style = { "--i": index, "--d": `${delay}ms`, "--side": leaf.side } as CSSProperties;
  if (state === "locked") return <Bud leaf={leaf} size={size} num={num} numSize={numSize} style={style} />;
  return (
    <g className={`gh-leaf is-${state}`} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`} style={style} data-x={leaf.x} data-y={leaf.y} data-angle={leaf.angle}>
      {state === "here" && (
        <>
          <radialGradient id={halo}>
            <stop offset="0" stopColor="#F4FBD9" stopOpacity="0.7" />
            <stop offset="0.55" stopColor="#D9F0A3" stopOpacity="0.24" />
            <stop offset="1" stopColor="#D9F0A3" stopOpacity="0" />
          </radialGradient>
          <ellipse className="gh-leaf-halo" cx={size * 0.55} cy="0" rx={size * 1.15} ry={size} fill={`url(#${halo})`} />
        </>
      )}
      <g className="gh-leaf-brush">
        <g className="gh-leaf-body">
          <path className="gh-leaf-stalk" d={`M0 0L${Math.round(size * STALK * 100) / 100} 0`} strokeWidth={Math.max(2, size * 0.035)} />
          <LeafBlade size={size} flip={leaf.side < 0} />
          <text className="gh-leaf-num" x={textX} y={textY} textAnchor="middle" fontSize={numSize} transform={`rotate(${-leaf.angle} ${textX} 0)`}>{num}</text>
        </g>
      </g>
    </g>
  );
}

// Where the motes fly: an angle, how far (a share of the leaf's length), and whether it is a leaflet or a speck of light.
const MOTES: [number, number, boolean][] = [
  [-170, 0.95, true], [-128, 0.7, false], [-96, 1.05, true], [-58, 0.8, false], [-22, 1.1, true], [12, 0.75, false],
  [44, 1, true], [78, 0.68, false], [110, 1.08, true], [146, 0.82, false], [190, 0.9, true], [228, 0.72, false],
];

// The moment a leaf changes: a flash and a handful of leaflets and light thrown off the blade.
// It sits on the middle of the blade, and everything in it starts at --spark (see .gh-spark in motion.css). `glow` names the flash's gradient (SparkGlow).
export function LeafSpark({ leaf, size, at, glow }: { leaf: Leaf; size: number; at: string; glow: string }) {
  const radians = (leaf.angle * Math.PI) / 180;
  const [x, y] = [r(leaf.x + Math.cos(radians) * size * 0.5), r(leaf.y + Math.sin(radians) * size * 0.5)];
  const mote = r(size * 0.09);
  return (
    <g className="gh-spark" transform={`translate(${x} ${y})`} style={{ "--spark": at } as CSSProperties} aria-hidden="true">
      <circle className="gh-spark-flash" r={r(size * 0.75)} fill={`url(#${glow})`} />
      {MOTES.map(([angle, far, leaflet], index) => (
        <g key={index} style={{ "--a": `${angle}deg`, "--far": `${r(size * far)}px`, "--spin": `${(index % 2 ? 1 : -1) * (90 + index * 14)}deg` } as CSSProperties}>
          {leaflet
            ? <path className="gh-spark-leaflet" d={`M${-mote} 0C${r(-mote * 0.4)} ${r(-mote * 0.75)} ${r(mote * 0.4)} ${r(-mote * 0.75)} ${mote} 0C${r(mote * 0.4)} ${r(mote * 0.75)} ${r(-mote * 0.4)} ${r(mote * 0.75)} ${-mote} 0Z`} />
            : <circle className="gh-spark-speck" r={r(Math.max(1.5, mote * 0.38))} />}
        </g>
      ))}
    </g>
  );
}

// The soft light a spark's flash is painted with, one per drawing.
export function SparkGlow({ id }: { id: string }) {
  return (
    <radialGradient id={id}>
      <stop offset="0" stopColor="#F4FBD9" stopOpacity="0.9" />
      <stop offset="0.45" stopColor="#D9F0A3" stopOpacity="0.35" />
      <stop offset="1" stopColor="#D9F0A3" stopOpacity="0" />
    </radialGradient>
  );
}
