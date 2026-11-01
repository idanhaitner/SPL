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
