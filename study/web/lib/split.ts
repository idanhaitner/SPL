export type Limits = { min: number; max: number };

const STEP = 0.02;
const BIG_STEP = 0.1;

// The range the divider may travel so neither pane drops below its minimum size.
// Before the container has a size there is nothing to protect, so no limit.
export function fractionLimits(total: number, minFirst: number, minSecond: number): Limits {
  if (!(total > 0)) return { min: 0, max: 1 };
  const min = minFirst / total;
  const max = (total - minSecond) / total;
  // Too small for both minimums: share the space in proportion to them.
  if (min > max) {
    const shared = minFirst / (minFirst + minSecond);
    return { min: shared, max: shared };
  }
  return { min, max };
}

export function clampFraction(fraction: number, limits: Limits): number {
  return Math.min(limits.max, Math.max(limits.min, fraction));
}

// Where a key press moves the divider, or null when the key is not one it handles.
// Only the arrows along the divider's own axis count: left and right for a vertical
// divider, up and down for a horizontal one.
export function moveFraction(
  current: number,
  key: string,
  shift: boolean,
  orientation: "vertical" | "horizontal",
  limits: Limits,
): number | null {
  if (key === "Home") return limits.min;
  if (key === "End") return limits.max;
  const [back, forward] = orientation === "vertical" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
  if (key !== back && key !== forward) return null;
  const step = shift ? BIG_STEP : STEP;
  return clampFraction(current + (key === forward ? step : -step), limits);
}

// A saved position is only trusted when it is a real fraction strictly between 0 and 1.
export function parseSaved(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 && value < 1 ? value : fallback;
}
