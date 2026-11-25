import { isDone, leavesOf, nextChapter, type ChapterInfo, type Progress } from "./progress";

// What one student shares with the leaderboard: a summary of their progress, never the progress itself.
export type Summary = { chapters: number; reviews: number; solved: number; current: string | null };
// A row as the board holds it. Times are in milliseconds.
export type Row = Summary & { id: string; name: string; reachedAt: number; updatedAt: number; hidden: boolean };
export type RankedRow = Row & { place: number; stale: boolean };

export const NAME_MAX = 24;
export const STALE_MS = 60 * 24 * 60 * 60 * 1000;

// Chapters count once done: read to the end and every practice question solved. Reviews count once their steps are solved.
export function summarize(chapters: ChapterInfo[], progress: Progress): Summary {
  return {
    chapters: leavesOf(chapters).filter((chapter) => isDone(chapter, progress)).length,
    reviews: chapters.filter((chapter) => chapter.kind === "bridge" && isDone(chapter, progress)).length,
    solved: progress.solved.length,
    current: nextChapter(chapters, progress)?.id ?? null,
  };
}

// For each chapter, how many questions the course holds up to and including it, reviews before it counted too.
// A plant's stem reaches a chapter's leaf once that many are solved.
export function solvedMarks(chapters: ChapterInfo[]): number[] {
  let sum = 0;
  return chapters.flatMap((chapter) => {
    sum += chapter.stepIds.length;
    return chapter.kind === "bridge" ? [] : [sum];
  });
}

// How far up the leaves `solved` questions reach: 0 is the shoot, k is the k-th chapter's leaf, and in between is part of the way there.
export function climb(solved: number, marks: number[]): number {
  const next = marks.findIndex((mark) => mark > solved);
  if (next === -1) return marks.length;
  const from = next === 0 ? 0 : marks[next - 1];
  return next + (solved - from) / (marks[next] - from);
}

export function sameSummary(a: Summary, b: Summary) {
  return a.chapters === b.chapters && a.reviews === b.reviews && a.solved === b.solved && a.current === b.current;
}

// Whether the student moved forward, which is what dates their place in a tie.
export function gained(before: Summary | null, after: Summary) {
  return !before || after.chapters > before.chapters || after.solved > before.solved;
}

export function cleanName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= NAME_MAX ? name : null;
}

const count = (value: unknown) => (typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0);

function millis(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    const ms = value.toMillis();
    return typeof ms === "number" && Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

// Anyone can write to the board, so every stored row is checked before it is shown.
export function toRow(id: string, data: unknown): Row | null {
  if (!data || typeof data !== "object") return null;
  const doc = data as Record<string, unknown>;
  const name = typeof doc.name === "string" ? cleanName(doc.name) : null;
  if (!name) return null;
  return {
    id,
    name,
    chapters: count(doc.chapters),
    reviews: count(doc.reviews),
    solved: count(doc.solved),
    current: typeof doc.current === "string" ? doc.current : null,
    reachedAt: millis(doc.reachedAt),
    updatedAt: millis(doc.updatedAt),
    hidden: doc.hidden === true,
  };
}

// Most chapters first, then most solved, then whoever got there first. An exact tie shares a place.
export function rankRows(rows: Row[], now: number): RankedRow[] {
  const sorted = rows.filter((row) => !row.hidden).sort((a, b) => b.chapters - a.chapters || b.solved - a.solved || a.reachedAt - b.reachedAt);
  return sorted.map((row, index) => {
    const tiedWith = sorted.findIndex((other) => other.chapters === row.chapters && other.solved === row.solved && other.reachedAt === row.reachedAt);
    return { ...row, place: (tiedWith === -1 ? index : tiedWith) + 1, stale: now - row.updatedAt > STALE_MS };
  });
}

export function ordinal(n: number) {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["month", 30 * 86_400_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function ago(then: number, now: number) {
  const elapsed = now - then;
  for (const [unit, size] of UNITS) {
    if (elapsed >= size) return relative.format(-Math.floor(elapsed / size), unit);
  }
  return "just now";
}

// A chapter's label from a row's `current`. Rows come from anyone, so an id like "__proto__" must not reach what objects inherit.
export function labelOf(labels: Record<string, string>, id: string | null): string | null {
  return id !== null && Object.hasOwn(labels, id) ? labels[id] : null;
}

type Snapshot = { fromCache: boolean; rows: Row[] };

// When Firestore is blocked or offline it answers from its cache, often with nothing, instead of reporting an error.
// An empty answer from the cache waits for the server; if the server stays silent for `waitMs`, that is an error. Any real answer shows at once.
export function snapshotGate(onRows: (rows: Row[]) => void, onError: () => void, waitMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const gate = (snapshot: Snapshot) => {
    if (snapshot.fromCache && snapshot.rows.length === 0) {
      timer ??= setTimeout(onError, waitMs);
      return;
    }
    clearTimeout(timer);
    timer = undefined;
    onRows(snapshot.rows);
  };
  gate.stop = () => clearTimeout(timer);
  return gate;
}
