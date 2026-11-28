import { storageKey } from "./progress";

export type SessionState = { current?: string; skipped: string[] };

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

const sessionKey = (courseId: string, chapterId: string) => `${storageKey(courseId)}:session:${chapterId}`;

export function readSession(courseId: string, chapterId: string): SessionState {
  try {
    const parsed = JSON.parse(localStorage.getItem(sessionKey(courseId, chapterId)) ?? "null") as Partial<SessionState> | null;
    if (!parsed || typeof parsed !== "object") return { skipped: [] };
    return { current: typeof parsed.current === "string" ? parsed.current : undefined, skipped: strings(parsed.skipped) };
  } catch {
    return { skipped: [] };
  }
}

export function writeSession(courseId: string, chapterId: string, state: SessionState) {
  try {
    localStorage.setItem(sessionKey(courseId, chapterId), JSON.stringify(state));
  } catch {
    // Storage can be blocked or full; progress just won't be saved.
  }
}

// The first step not yet solved or skipped. Past the last step means every step has been handled.
export function resumeStep(stepIds: string[], solved: string[], skipped: string[]) {
  const open = stepIds.findIndex((id) => !solved.includes(id) && !skipped.includes(id));
  return open === -1 ? stepIds.length : open;
}

// A link to a step wins, then the step the student was on, then the first step still open. Ids that no longer exist are ignored.
export function openStep(stepIds: string[], state: SessionState, solved: string[], requested?: string | null) {
  for (const id of [requested, state.current]) {
    const index = id ? stepIds.indexOf(id) : -1;
    if (index >= 0) return index;
  }
  return resumeStep(stepIds, solved, state.skipped);
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked or full; the work just won't be saved.
  }
}

export const readCode = (courseId: string, exerciseId: string) => read(`${storageKey(courseId)}:code:${exerciseId}`);
export const writeCode = (courseId: string, exerciseId: string, code: string) => write(`${storageKey(courseId)}:code:${exerciseId}`, code);
export const readSplit = (courseId: string, name: string) => read(`${storageKey(courseId)}:split:${name}`);
export const writeSplit = (courseId: string, name: string, fraction: number) => write(`${storageKey(courseId)}:split:${name}`, String(fraction));

// A check's last answer, so leaving the page (say, to reread the chapter) does not wipe what was already answered.
export type CheckAnswer = { picked: number | null; pickedMany: number[]; values: string[]; graded: boolean };

export function readCheck(courseId: string, checkId: string): CheckAnswer | null {
  try {
    const parsed = JSON.parse(read(`${storageKey(courseId)}:check:${checkId}`) ?? "null") as Partial<CheckAnswer> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const numbers = Array.isArray(parsed.pickedMany) ? parsed.pickedMany.filter((item): item is number => Number.isInteger(item)) : [];
    return { picked: Number.isInteger(parsed.picked) ? (parsed.picked as number) : null, pickedMany: numbers, values: strings(parsed.values), graded: parsed.graded === true };
  } catch {
    return null;
  }
}

export const writeCheck = (courseId: string, checkId: string, answer: CheckAnswer) => write(`${storageKey(courseId)}:check:${checkId}`, JSON.stringify(answer));

export function clearCode(courseId: string, exerciseId: string) {
  try {
    localStorage.removeItem(`${storageKey(courseId)}:code:${exerciseId}`);
  } catch {
    // Nothing to do.
  }
}
