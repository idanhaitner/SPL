import { describe, expect, it, vi } from "vitest";
import { ago, cleanName, climb, gained, labelOf, ordinal, rankRows, snapshotGate, solvedMarks, STALE_MS, summarize, toRow, type Row } from "./leaderboard";
import type { ChapterInfo } from "./progress";

const ch = (id: string, stepIds: string[] = []): ChapterInfo => ({ id, title: id, num: 1, pos: 0, stepIds });
const br = (id: string, stepIds: string[] = []): ChapterInfo => ({ id, title: id, num: 0, pos: 0, stepIds, kind: "bridge" });
const course = [ch("a", ["a1", "a2"]), ch("b", ["b1"]), br("r1", ["r1s"]), ch("c", ["c1"])].map((chapter, pos) => ({ ...chapter, pos }));

const row = (id: string, chapters: number, solved: number, reachedAt: number, extra: Partial<Row> = {}): Row => ({ id, name: id, chapters, reviews: 0, solved, current: null, reachedAt, updatedAt: 1000, hidden: false, ...extra });

describe("summarize", () => {
  it("a fresh student has nothing", () => {
    expect(summarize(course, { solved: [] })).toEqual({ chapters: 0, reviews: 0, solved: 0, current: "a" });
  });
  it("counts done chapters, not read ones", () => {
    expect(summarize(course, { solved: ["a1"], read: ["a", "b"] }).chapters).toBe(0);
    expect(summarize(course, { solved: ["a1", "a2", "b1"], read: ["a", "b"] })).toMatchObject({ chapters: 2, solved: 3, current: "r1" });
  });
  it("counts a review only when its steps are solved", () => {
    expect(summarize(course, { solved: ["a1", "a2", "b1", "r1s"], read: ["a", "b"] }).reviews).toBe(1);
  });
  it("an open-all student reading ahead without solving gains no chapters", () => {
    expect(summarize(course, { solved: [], read: ["a", "b", "c"], openAll: true }).chapters).toBe(0);
  });
  it("a student past a waived review is not credited with it", () => {
    expect(summarize(course, { solved: ["a1", "a2", "b1", "c1"], read: ["a", "b", "c"] })).toMatchObject({ chapters: 3, reviews: 0 });
  });
});

describe("solvedMarks", () => {
  it("counts every question up to and including each chapter, reviews before it too", () => {
    expect(solvedMarks(course)).toEqual([2, 3, 5]);
  });
});

describe("climb", () => {
  const marks = [2, 3, 5];
  it("nothing solved is the shoot", () => {
    expect(climb(0, marks)).toBe(0);
  });
  it("reaches a chapter's leaf once as many questions are solved as it and those before it hold", () => {
    expect(climb(2, marks)).toBe(1);
    expect(climb(3, marks)).toBe(2);
    expect(climb(5, marks)).toBe(3);
  });
  it("grows part of the way between leaves", () => {
    expect(climb(1, marks)).toBe(0.5);
    expect(climb(4, marks)).toBe(2.5);
  });
  it("never passes the last leaf", () => {
    expect(climb(99, marks)).toBe(3);
  });
  it("passes a chapter with no questions as soon as the one before it is reached", () => {
    expect(climb(3, [3, 3, 6])).toBe(2);
    expect(climb(6, [3, 6, 6])).toBe(3);
  });
  it("a course with no questions has nothing to climb", () => {
    expect(climb(0, [])).toBe(0);
  });
});

describe("gained", () => {
  it("only on chapters or solved going up", () => {
    const s = { chapters: 1, reviews: 0, solved: 2, current: "b" };
    expect(gained(null, s)).toBe(true);
    expect(gained(s, { ...s, current: "c" })).toBe(false);
    expect(gained(s, { ...s, solved: 3 })).toBe(true);
    expect(gained(s, { ...s, chapters: 2 })).toBe(true);
    expect(gained(s, { ...s, solved: 1 })).toBe(false);
  });
});

describe("cleanName", () => {
  it("trims and collapses spaces", () => {
    expect(cleanName("  Noa   Levi ")).toBe("Noa Levi");
  });
  it("rejects empty and over-long names", () => {
    expect(cleanName("   ")).toBeNull();
    expect(cleanName("x".repeat(25))).toBeNull();
    expect(cleanName("x".repeat(24))).toBe("x".repeat(24));
  });
  it("keeps Hebrew", () => {
    expect(cleanName("עידן")).toBe("עידן");
  });
});

describe("toRow", () => {
  it("drops rows without a valid name", () => {
    expect(toRow("x", null)).toBeNull();
    expect(toRow("x", { name: 5 })).toBeNull();
    expect(toRow("x", { name: "   " })).toBeNull();
  });
  it("normalizes junk fields", () => {
    expect(toRow("x", { name: "Dana", chapters: "7", solved: -3, reachedAt: { toMillis: () => 10 } })).toEqual({ id: "x", name: "Dana", chapters: 0, reviews: 0, solved: 0, current: null, reachedAt: 10, updatedAt: 0, hidden: false });
  });
  it("keeps good fields", () => {
    expect(toRow("y", { name: "Noa", chapters: 4, reviews: 1, solved: 20, current: "threads", reachedAt: 5, updatedAt: { toMillis: () => 9 }, hidden: true })).toEqual({ id: "y", name: "Noa", chapters: 4, reviews: 1, solved: 20, current: "threads", reachedAt: 5, updatedAt: 9, hidden: true });
  });
});

describe("rankRows", () => {
  it("ranks with shared places and drops hidden rows", () => {
    const ranked = rankRows([row("a", 3, 10, 5), row("b", 5, 1, 9), row("c", 3, 10, 5), row("d", 3, 10, 2), row("e", 9, 9, 1, { hidden: true })], 2000);
    expect(ranked.map((r) => [r.id, r.place])).toEqual([["b", 1], ["d", 2], ["a", 3], ["c", 3]]);
  });
  it("marks rows idle for over 60 days as stale", () => {
    const now = STALE_MS + 5000;
    expect(rankRows([row("a", 0, 0, 0)], now)[0].stale).toBe(true);
    expect(rankRows([row("a", 0, 0, 0)], 2000)[0].stale).toBe(false);
  });
});

describe("words", () => {
  it("writes ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st", "111th"]);
  });
  it("says how long ago", () => {
    expect(ago(0, 30_000)).toBe("just now");
    expect(ago(0, 5 * 60_000)).toBe("5 minutes ago");
    expect(ago(0, 2 * 3600_000)).toBe("2 hours ago");
    expect(ago(0, 86_400_000)).toBe("yesterday");
    expect(ago(0, 90 * 86_400_000)).toBe("3 months ago");
  });
});

describe("labelOf", () => {
  it("only finds real chapter ids, never what an object inherits", () => {
    const labels = { threads: "Chapter 8 · Threads" };
    expect(labelOf(labels, "threads")).toBe("Chapter 8 · Threads");
    expect(labelOf(labels, "__proto__")).toBeNull();
    expect(labelOf(labels, "constructor")).toBeNull();
    expect(labelOf(labels, "toString")).toBeNull();
    expect(labelOf(labels, null)).toBeNull();
  });
});

describe("snapshotGate", () => {
  it("waits on an empty answer from the cache, then calls it an error if the server never answers", () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const gate = snapshotGate((rows) => seen.push(`rows:${rows.length}`), () => seen.push("error"), 8000);
    gate({ fromCache: true, rows: [] });
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(8000);
    expect(seen).toEqual(["error"]);
    gate({ fromCache: false, rows: [row("a", 1, 1, 1)] });
    expect(seen).toEqual(["error", "rows:1"]);
    gate.stop();
    vi.useRealTimers();
  });
  it("shows the server's answer at once, even an empty one", () => {
    const seen: string[] = [];
    const gate = snapshotGate((rows) => seen.push(`rows:${rows.length}`), () => seen.push("error"), 8000);
    gate({ fromCache: false, rows: [] });
    expect(seen).toEqual(["rows:0"]);
    gate.stop();
  });
  it("shows cached rows while the server is away", () => {
    const seen: string[] = [];
    const gate = snapshotGate((rows) => seen.push(`rows:${rows.length}`), () => seen.push("error"), 8000);
    gate({ fromCache: true, rows: [row("a", 1, 1, 1)] });
    expect(seen).toEqual(["rows:1"]);
    gate.stop();
  });
});
