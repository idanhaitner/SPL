import { describe, expect, it } from "vitest";
import { bridgeSpots, reachPast, spacedLeaves, WIDE_STEM } from "./stem";

const { leaves } = spacedLeaves(WIDE_STEM, 16);

describe("bridgeSpots", () => {
  it("puts a bridge on the stem between the two leaves around it", () => {
    const [spot] = bridgeSpots(WIDE_STEM, leaves, [2]);
    expect(spot.along).toBeGreaterThan(leaves[2].along);
    expect(spot.along).toBeLessThan(leaves[3].along);
  });
  it("hangs the berry on the next leaf's side, clear of the blade of the leaf before it", () => {
    const [spot] = bridgeSpots(WIDE_STEM, leaves, [2]);
    expect(spot.side).toBe(leaves[3].side);
    expect(spot.side).toBe(-leaves[2].side);
  });
  it("points the berry straight out from the stem", () => {
    const [spot] = bridgeSpots(WIDE_STEM, leaves, [2]);
    expect(Math.abs(((spot.angle - spot.heading) * spot.side) % 360)).toBeCloseTo(90, 0);
  });
  it("keeps the order of the bridges, and gives a bridge after the last leaf a place on the stem", () => {
    const spots = bridgeSpots(WIDE_STEM, leaves, [2, 6, 15]);
    expect(spots.map((spot) => spot.along)).toEqual([...spots.map((spot) => spot.along)].sort((a, b) => a - b));
    expect(spots[2].along).toBeGreaterThan(leaves[15].along);
  });
});

describe("reachPast", () => {
  it("reaches a little past the last open leaf", () => {
    expect(reachPast(leaves, 4, 50, [])).toBe(leaves[4].along + 50);
  });
  it("reaches the whole stem once the last leaf is open", () => {
    expect(reachPast(leaves, 15, 50, [])).toBeUndefined();
  });
  it("grows on past an open bridge, but not into the next leaf", () => {
    const [spot] = bridgeSpots(WIDE_STEM, leaves, [4]);
    const reach = reachPast(leaves, 4, 50, [spot.along]) as number;
    expect(reach).toBeGreaterThan(spot.along);
    expect(reach).toBeLessThan(leaves[5].along);
  });
});
