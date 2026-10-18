export type Progress = {
  solved: string[];
  last?: string;
};

export function storageKey(courseId: string) {
  return `study:${courseId}`;
}

export function readProgress(courseId: string): Progress {
  if (typeof window === "undefined") return { solved: [] };
  try {
    const raw = localStorage.getItem(storageKey(courseId));
    if (!raw) return { solved: [] };
    const parsed = JSON.parse(raw) as Progress;
    return {
      solved: Array.isArray(parsed.solved) ? parsed.solved.filter((id) => typeof id === "string") : [],
      last: typeof parsed.last === "string" ? parsed.last : undefined,
    };
  } catch {
    return { solved: [] };
  }
}

export function writeProgress(courseId: string, progress: Progress) {
  localStorage.setItem(storageKey(courseId), JSON.stringify(progress));
  window.dispatchEvent(new Event("study-progress"));
}
