import { LeafBlade } from "./LeafShape";

const SPRIG = [
  { x: 209, y: 475, angle: -158, size: 190, flip: true },
  { x: 227, y: 365, angle: -28, size: 200, flip: false },
  { x: 234, y: 255, angle: -150, size: 170, flip: true },
  { x: 252, y: 157, angle: -36, size: 150, flip: false },
  { x: 268, y: 92, angle: -78, size: 92, flip: false },
];

// One tall sprig in the closing arch. It opens as the page scrolls to it, and is tone on tone because it reports nothing.
export function CloseSprig() {
  return (
    <svg className="gh-sprig" viewBox="0 0 520 620" aria-hidden="true">
      <path className="gh-sprig-stem" d="M170 640C200 520 226 420 228 340 230 240 250 160 268 92" pathLength={1} />
      {SPRIG.map((leaf, index) => (
        <g key={index} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle})`}>
          <g className="gh-sprig-leaf" style={{ "--side": leaf.flip ? -1 : 1, "--i": index } as React.CSSProperties}>
            <path className="gh-sprig-stalk" d={`M0 0L${leaf.size * 0.16} 0`} />
            <LeafBlade size={leaf.size} flip={leaf.flip} />
          </g>
        </g>
      ))}
    </svg>
  );
}
