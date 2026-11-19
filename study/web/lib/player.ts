import type { Summary } from "./leaderboard";
import { hasStarted, storageKey, type Progress } from "./progress";

// Who this device is on the leaderboard. The id keys the shared row; the name is only a label on it.
export type Player = { id: string; name: string };
export type PlayerState = Player | { declined: true } | null;
// What this device last sent, so an unchanged summary is not sent again.
export type Published = { id: string; name: string; summary: Summary; reachedAt: number; hidden?: boolean };
export type Seed = "existing" | "new";

const playerKey = (courseId: string) => `${storageKey(courseId)}:player`;
const seedKey = (courseId: string) => `${storageKey(courseId)}:board-seed`;
const publishedKey = (courseId: string) => `${storageKey(courseId)}:published`;

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked or full; the leaderboard just won't remember.
  }
}

const tell = () => window.dispatchEvent(new Event("study-player"));
const isPlayer = (value: unknown): value is Player =>
  !!value && typeof value === "object" && typeof (value as Player).id === "string" && typeof (value as Player).name === "string";

export function readPlayer(courseId: string): PlayerState {
  const value = read(playerKey(courseId));
  if (isPlayer(value)) return { id: value.id, name: value.name };
  if (value && typeof value === "object" && (value as { declined?: unknown }).declined === true) return { declined: true };
  return null;
}

// Callers pass a name already cleaned by cleanName.
export function joinAs(courseId: string, name: string): Player {
  const current = readPlayer(courseId);
  const player = { id: current && "id" in current ? current.id : crypto.randomUUID(), name };
  write(playerKey(courseId), player);
  tell();
  return player;
}

export function renamePlayer(courseId: string, name: string): Player | null {
  const current = readPlayer(courseId);
  if (!current || !("id" in current)) return null;
  return joinAs(courseId, name);
}

export function declinePlayer(courseId: string) {
  write(playerKey(courseId), { declined: true });
  write(publishedKey(courseId), null);
  tell();
}

export function readSeed(courseId: string): Seed {
  try {
    return localStorage.getItem(seedKey(courseId)) === "existing" ? "existing" : "new";
  } catch {
    return "new";
  }
}

// Runs in the page head, before any page records a visit, to tell a browser that already had progress before the leaderboard
// apart from one that starts fresh. It is set once and never changes.
// The layout renders it on the server, where storageKey (a client module) cannot be called, so it spells the same key out.
export function boardSeedScript(courseId: string) {
  const key = JSON.stringify(`study:${courseId}`);
  return `try{var b=${key};if(!localStorage.getItem(b+":board-seed"))localStorage.setItem(b+":board-seed",localStorage.getItem(b)?"existing":"new")}catch(e){}`;
}

// A student who studied here before the leaderboard is asked on their next visit. A new student is asked once they have
// read a chapter or solved a question, so they never join with nothing to show.
export function shouldAsk(progress: Progress, player: PlayerState, seed: Seed) {
  if (player) return false;
  if (seed === "existing") return hasStarted(progress);
  return (progress.read ?? []).length > 0 || progress.solved.length > 0;
}

export function readPublished(courseId: string): Published | null {
  const value = read(publishedKey(courseId));
  if (!value || typeof value !== "object") return null;
  const published = value as Published;
  const summary = published.summary;
  if (typeof published.id !== "string" || typeof published.name !== "string" || typeof published.reachedAt !== "number" || !summary || typeof summary !== "object") return null;
  return published;
}

export function writePublished(courseId: string, published: Published) {
  write(publishedKey(courseId), published);
}
