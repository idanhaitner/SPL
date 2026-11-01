import { LeafBlade } from "./LeafShape";
import { curvePath, stemTip, taperedPath, type StemCurves } from "@/lib/stem";

// The stem itself: a tapered shape, revealed through a mask so it can still grow along its length.
export function Stem({ id, curves, root, tip, grown, lead, sapTo, tipSize }: { id: string; curves: StemCurves; root: number; tip: number; grown: number; lead?: { x: number; y: number }; sapTo?: number; tipSize: number }) {
  const spine = curvePath(curves);
  const body = taperedPath(curves, root, tip);
  const end = stemTip(curves);
  const box = { maskUnits: "userSpaceOnUse", x: -1000, y: -200, width: 3400, height: 1500 } as const;
  return (
    <>
      <mask id={`${id}-reveal`} {...box}>
        <path className="gh-stem-reveal" d={spine} pathLength={1} fill="none" stroke="#fff" strokeWidth={root + 30} />
      </mask>
      <mask id={`${id}-grown`} {...box}>
        <path className="gh-stem-grown-line" d={spine} fill="none" stroke="#fff" strokeWidth={root + 30} strokeDasharray={`${grown} 9999`} />
      </mask>
      {lead && <path className="gh-stem-lead" d={`M${lead.x} ${lead.y}L${curves[0][0].x} ${curves[0][0].y}`} pathLength={1} strokeWidth={root} />}
      <g mask={`url(#${id}-reveal)`}>
        <path className="gh-stem-body" d={body} />
        {grown > 0 && <path className="gh-stem-body is-grown" d={body} mask={`url(#${id}-grown)`} />}
      </g>
      {sapTo !== undefined && <path className="gh-sap" d={spine} pathLength={1} style={{ "--to": sapTo } as React.CSSProperties} />}
      <g className="gh-stem-tip" transform={`translate(${end.x} ${end.y}) rotate(${end.angle})`}>
        <g className="gh-stem-tip-bud"><LeafBlade size={tipSize} /></g>
      </g>
    </>
  );
}
