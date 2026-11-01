// The course stem's shape, computed without a browser so its leaves are in the static HTML.

type Point = { x: number; y: number };
type Curve = [Point, Point, Point, Point];
export type Leaf = { x: number; y: number; angle: number; along: number };

function at([a, b, c, d]: Curve, t: number): Point {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return { x: w[0] * a.x + w[1] * b.x + w[2] * c.x + w[3] * d.x, y: w[0] * a.y + w[1] * b.y + w[2] * c.y + w[3] * d.y };
}

// Rounded, so the server's HTML and the browser's render agree to the digit.
const tidy = (value: number) => Math.round(value * 100) / 100;

export function curvePath(curves: Curve[], lead: Point | null = null) {
  const [first] = curves;
  const start = lead ? `M${lead.x} ${lead.y}L${first[0].x} ${first[0].y}` : `M${first[0].x} ${first[0].y}`;
  return start + curves.map(([, b, c, d]) => `C${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`).join("");
}

// Spaces `count` points evenly by length along the curves, each with the direction the stem is growing there.
export function spacedLeaves(curves: Curve[], count: number, from = 0.04, to = 0.97): { leaves: Leaf[]; length: number } {
  const samples: { point: Point; length: number }[] = [];
  let length = 0;
  let previous: Point | null = null;
  for (const curve of curves) {
    for (let step = 0; step <= 200; step += 1) {
      const point = at(curve, step / 200);
      if (previous) length += Math.hypot(point.x - previous.x, point.y - previous.y);
      samples.push({ point, length });
      previous = point;
    }
  }
  const leaves = Array.from({ length: count }, (_, index) => {
    const along = length * (from + ((to - from) * index) / Math.max(1, count - 1));
    const position = samples.findIndex((sample) => sample.length >= along);
    const here = samples[Math.max(0, position)];
    const ahead = samples[Math.min(samples.length - 1, Math.max(0, position) + 3)];
    const base = (Math.atan2(ahead.point.y - here.point.y, ahead.point.x - here.point.x) * 180) / Math.PI;
    return { x: tidy(here.point.x), y: tidy(here.point.y), angle: tidy(base + (index % 2 ? 54 : -54)), along: tidy(along) };
  });
  return { leaves, length: tidy(length) };
}

export const WIDE_STEM: Curve[] = [
  [{ x: 420, y: 790 }, { x: 700, y: 800 }, { x: 860, y: 720 }, { x: 900, y: 590 }],
  [{ x: 900, y: 590 }, { x: 950, y: 430 }, { x: 1040, y: 400 }, { x: 1090, y: 290 }],
  [{ x: 1090, y: 290 }, { x: 1125, y: 225 }, { x: 1130, y: 150 }, { x: 1185, y: 96 }],
];

export const NARROW_STEM: Curve[] = [
  [{ x: 24, y: 262 }, { x: 170, y: 282 }, { x: 330, y: 250 }, { x: 320, y: 185 }],
  [{ x: 320, y: 185 }, { x: 310, y: 130 }, { x: 90, y: 160 }, { x: 90, y: 96 }],
  [{ x: 90, y: 96 }, { x: 90, y: 50 }, { x: 230, y: 56 }, { x: 340, y: 14 }],
];
