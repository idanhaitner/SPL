import type { CSSProperties } from "react";
import type { ChapterState } from "@/lib/progress";
import type { BridgeSpot } from "@/lib/stem";

const r = (value: number) => Math.round(value * 100) / 100;

// A review on the stem: a berry on a short stalk. It carries no number, and its round body sets it apart from the pointed chapter leaves.
// It is classed `gh-leaf` so it takes the same state colors, sway, glow, and brush as a leaf. `size` is the whole reach, stalk and berry.
export function Berry({ spot, size, state, index, delay }: { spot: BridgeSpot; size: number; state: ChapterState; index: number; delay: number }) {
  const stalk = size * 0.2;
  const radius = size * 0.4;
  const center = r(stalk + radius);
  const style = { "--i": index, "--d": `${delay}ms`, "--side": spot.side } as CSSProperties;
  return (
    <g className={`gh-leaf gh-berry is-${state}`} transform={`translate(${spot.x} ${spot.y}) rotate(${spot.angle})`} style={style} data-x={spot.x} data-y={spot.y} data-angle={spot.angle}>
      <g className="gh-leaf-brush">
        <g className="gh-leaf-body">
          <path className="gh-leaf-stalk" d={`M0 0L${r(stalk + 1)} 0`} strokeWidth={Math.max(2, size * 0.05)} />
          {state === "locked" ? (
            <circle className="gh-bud" cx={center} cy="0" r={r(radius * 0.8)} />
          ) : (
            <g transform={`rotate(${-spot.angle} ${center} 0)`}>
              <circle className="gh-berry-shade" cx={center} cy="0" r={r(radius)} />
              <circle className="gh-berry-light" cx={r(center - radius * 0.1)} cy={r(-radius * 0.12)} r={r(radius * 0.84)} />
              <ellipse className="gh-berry-glint" cx={r(center - radius * 0.38)} cy={r(-radius * 0.4)} rx={r(radius * 0.22)} ry={r(radius * 0.14)} transform={`rotate(-35 ${r(center - radius * 0.38)} ${r(-radius * 0.4)})`} />
            </g>
          )}
          <g className="gh-berry-calyx">
            <ellipse cx={r(stalk + radius * 0.3)} cy={r(radius * 0.2)} rx={r(radius * 0.42)} ry={r(radius * 0.15)} transform={`rotate(32 ${r(stalk + radius * 0.3)} ${r(radius * 0.2)})`} />
            <ellipse cx={r(stalk + radius * 0.3)} cy={r(-radius * 0.2)} rx={r(radius * 0.42)} ry={r(radius * 0.15)} transform={`rotate(-32 ${r(stalk + radius * 0.3)} ${r(-radius * 0.2)})`} />
          </g>
        </g>
      </g>
    </g>
  );
}
