import { curvePath, pointAlong, stemTip, taperedPath, type StemCurves } from "@/lib/stem";

// The growing end of the vine: a small coil, the way a tendril searches for what to climb next. `size` is its reach.
function curl(size: number) {
  const p = (x: number, y: number) => `${Math.round(x * size * 100) / 100} ${Math.round(y * size * 100) / 100}`;
  return `M0 0C${p(0.4, 0.02)} ${p(0.78, -0.06)} ${p(0.88, -0.32)}C${p(0.96, -0.56)} ${p(0.76, -0.8)} ${p(0.54, -0.68)}C${p(0.36, -0.58)} ${p(0.42, -0.34)} ${p(0.58, -0.38)}`;
}

// The vine's last word: a bud that closes it off. It stays a dashed outline until every chapter is finished, then opens as a lime flower.
function Crown({ size, finished }: { size: number; finished: boolean }) {
  const p = (x: number, y: number) => `${Math.round(x * size * 100) / 100} ${Math.round(y * size * 100) / 100}`;
  const bud = `M${p(0.1, 0)}C${p(0.3, 0.34)} ${p(0.78, 0.34)} ${p(1.05, 0)}C${p(0.78, -0.34)} ${p(0.3, -0.34)} ${p(0.1, 0)}Z`;
  const sepal = (side: 1 | -1) => `M${p(0.1, 0)}C${p(0.18, side * 0.26)} ${p(0.34, side * 0.42)} ${p(0.5, side * 0.46)}C${p(0.46, side * 0.3)} ${p(0.34, side * 0.12)} ${p(0.1, 0)}Z`;
  return (
    <g className={`gh-crown${finished ? " is-finished" : ""}`}>
      <path className="gh-crown-sepal" d={sepal(1)} />
      <path className="gh-crown-sepal" d={sepal(-1)} />
      <path className="gh-crown-bud" d={bud} />
      {finished && <path className="gh-crown-rib" d={`M${p(0.14, 0)}L${p(0.92, 0)}`} />}
    </g>
  );
}

// The stem itself: a tapered shape, revealed through a mask so it can still grow along its length.
// `alive` is how far the plant has grown so far; past it, a dotted line marks where it will climb.
// While it regrows, `front` is where its growing end is headed (a light rides there), and `surgeTo` is the share of the stem a burst of sap climbs first.
export function Stem({ id, curves, root, tip, alive, sapTo, surgeTo, front, tipSize, finished = false }: { id: string; curves: StemCurves; root: number; tip: number; alive?: number; sapTo?: number; surgeTo?: number; front?: number; tipSize: number; finished?: boolean }) {
  const spine = curvePath(curves);
  const body = taperedPath(curves, root, tip);
  const last = stemTip(curves);
  const end = alive === undefined ? last : pointAlong(curves, alive);
  const box = { maskUnits: "userSpaceOnUse", x: -1000, y: -200, width: 3400, height: 1500 } as const;
  const reach = { strokeDasharray: `${alive ?? 99999} 99999` };
  return (
    <>
      <mask id={`${id}-reveal`} {...box}>
        <path className="gh-stem-reveal" d={spine} pathLength={1} fill="none" stroke="#fff" strokeWidth={root + 30} />
      </mask>
      {alive !== undefined && (
        <>
          <mask id={`${id}-alive`} {...box}>
            <path className="gh-stem-alive-line" d={spine} fill="none" stroke="#fff" strokeWidth={root + 30} style={reach} />
          </mask>
          <mask id={`${id}-ahead`} {...box}>
            <rect {...{ x: box.x, y: box.y, width: box.width, height: box.height }} fill="#fff" />
            <path className="gh-stem-alive-line" d={spine} fill="none" stroke="#000" strokeWidth={root + 30} style={reach} />
          </mask>
          <path className="gh-stem-ghost" d={spine} mask={`url(#${id}-ahead)`} />
        </>
      )}
      <g mask={alive === undefined ? undefined : `url(#${id}-alive)`}>
        <g mask={`url(#${id}-reveal)`}>
          <path className="gh-stem-body" d={body} />
        </g>
      </g>
      {sapTo !== undefined && <path className="gh-sap" d={spine} pathLength={1} style={{ "--to": sapTo } as React.CSSProperties} />}
      {surgeTo !== undefined && (
        <g className="gh-surge" style={{ "--to": surgeTo } as React.CSSProperties}>
          <path className="gh-surge-glow" d={spine} pathLength={1} />
          <path className="gh-surge-core" d={spine} pathLength={1} />
        </g>
      )}
      {front !== undefined && (
        <g className="gh-front" style={{ strokeDashoffset: -front }}>
          <path className="gh-front-glow" d={spine} />
          <path className="gh-front-core" d={spine} />
        </g>
      )}
      <g className="gh-stem-tip" transform={`translate(${last.x} ${last.y}) rotate(${last.angle})`}>
        <g className="gh-stem-tip-bud"><Crown size={tipSize * 1.5} finished={finished} /></g>
      </g>
      {/* Keyed by where it is, so a tip that moves up opens again in its new place. */}
      {alive !== undefined && <g key={`${end.x} ${end.y}`} className="gh-stem-tip" transform={`translate(${end.x} ${end.y}) rotate(${end.angle})`}>
        <path className="gh-stem-tip-bud gh-stem-curl" d={curl(tipSize)} strokeWidth={tip} />
      </g>}
    </>
  );
}
