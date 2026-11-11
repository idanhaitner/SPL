import type { CSSProperties } from "react";
import type { ChapterState } from "@/lib/progress";
import type { BridgeSpot } from "@/lib/stem";

const r = (value: number) => Math.round(value * 100) / 100;
const PETALS = 5;

// A review on the stem: a small five-petal flower on a short stalk. It carries no number, and its blossom sets it apart from the pointed chapter leaves.
// It is classed `gh-leaf` so it takes the same sway, glow, and brush as a leaf; its petal colors come from the state in greenhouse.css.
// `size` is the whole reach, stalk and flower. A locked review is a closed bud.
export function Flower({ spot, size, state, index, delay }: { spot: BridgeSpot; size: number; state: ChapterState; index: number; delay: number }) {
  const stalk = size * 0.18;
  const radius = size * 0.41;
  const center = r(stalk + radius);
  const style = { "--i": index, "--d": `${delay}ms`, "--side": spot.side } as CSSProperties;
  // One petal, pointing along +x from the flower's middle: a rounded teardrop, wide at the tip and notched a little.
  const reach = radius;
  const wide = radius * 0.5;
  const petal = `M0 0C${r(reach * 0.25)} ${r(-wide * 0.95)} ${r(reach * 0.85)} ${r(-wide * 1.05)} ${r(reach)} ${r(-wide * 0.12)}Q${r(reach * 1.04)} 0 ${r(reach)} ${r(wide * 0.12)}C${r(reach * 0.85)} ${r(wide * 1.05)} ${r(reach * 0.25)} ${r(wide * 0.95)} 0 0Z`;
  const inner = `M${r(reach * 0.2)} 0C${r(reach * 0.35)} ${r(-wide * 0.55)} ${r(reach * 0.7)} ${r(-wide * 0.62)} ${r(reach * 0.86)} ${r(-wide * 0.05)}C${r(reach * 0.7)} ${r(wide * 0.62)} ${r(reach * 0.35)} ${r(wide * 0.55)} ${r(reach * 0.2)} 0Z`;
  return (
    <g className={`gh-leaf gh-flower is-${state}`} transform={`translate(${spot.x} ${spot.y}) rotate(${spot.angle})`} style={style} data-x={spot.x} data-y={spot.y} data-angle={spot.angle}>
      <g className="gh-leaf-brush">
        <g className="gh-leaf-body">
          <path className="gh-leaf-stalk" d={`M0 0L${r(stalk + 1)} 0`} strokeWidth={Math.max(2, size * 0.05)} />
          {state === "locked" ? (
            <g transform={`rotate(${-spot.angle} ${center} 0)`}>
              <circle className="gh-bud" cx={center} cy="0" r={r(radius * 0.62)} />
            </g>
          ) : (
            <g transform={`translate(${center} 0) rotate(${-spot.angle - 18})`}>
              {Array.from({ length: PETALS }, (_, i) => (
                <g key={i} transform={`rotate(${(360 / PETALS) * i})`}>
                  <path className="gh-flower-petal" d={petal} />
                  <path className="gh-flower-sheen" d={inner} />
                </g>
              ))}
              <circle className="gh-flower-heart" cx="0" cy="0" r={r(radius * 0.27)} />
              {Array.from({ length: 5 }, (_, i) => {
                const a = (Math.PI * 2 * i) / 5 + 0.4;
                return <circle key={i} className="gh-flower-seed" cx={r(Math.cos(a) * radius * 0.13)} cy={r(Math.sin(a) * radius * 0.13)} r={r(Math.max(0.6, radius * 0.045))} />;
              })}
            </g>
          )}
          <g className="gh-flower-calyx">
            <ellipse cx={r(stalk * 0.55)} cy={r(radius * 0.1)} rx={r(radius * 0.3)} ry={r(radius * 0.1)} transform={`rotate(38 ${r(stalk * 0.55)} ${r(radius * 0.1)})`} />
            <ellipse cx={r(stalk * 0.55)} cy={r(-radius * 0.1)} rx={r(radius * 0.3)} ry={r(radius * 0.1)} transform={`rotate(-38 ${r(stalk * 0.55)} ${r(-radius * 0.1)})`} />
          </g>
        </g>
      </g>
    </g>
  );
}
