"use client";

import { useEffect, useState } from "react";
import { hrefOf } from "./chapters";

export { hrefOf, nameOf } from "./chapters";

export type Progress = {
  solved: string[];
  last?: string;
  seen?: string[];
  read?: string[];
  sections?: Record<string, string[]>;
  // The student chose to open every chapter instead of unlocking them in order.
  openAll?: boolean;
};

// pos is the place in the course, counting bridges. num is the printed chapter number, which skips bridges; a bridge has 0.
export type ChapterInfo = { id: string; title: string; num: number; pos: number; stepIds: string[]; kind?: "bridge" };
export type ChapterState = "done" | "read" | "here" | "ahead" | "locked";

export function storageKey(courseId: string) {
  return `study:${courseId}`;
}

const strings = (value: unknown) => (Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);

function sectionsOf(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([chapter, titles]) => [chapter, strings(titles)]));
}

export function readProgress(courseId: string): Progress {
  if (typeof window === "undefined") return { solved: [] };
  try {
    const raw = localStorage.getItem(storageKey(courseId));
    if (!raw) return { solved: [] };
    const parsed = JSON.parse(raw) as Progress;
    return {
      solved: strings(parsed.solved),
      last: typeof parsed.last === "string" ? parsed.last : undefined,
      seen: strings(parsed.seen),
      read: strings(parsed.read),
      sections: sectionsOf(parsed.sections),
      openAll: parsed.openAll === true || undefined,
    };
  } catch {
    return { solved: [] };
  }
}

export function writeProgress(courseId: string, progress: Progress) {
  try {
    localStorage.setItem(storageKey(courseId), JSON.stringify(progress));
  } catch {
    // Storage can be blocked or full; progress just won't be saved.
  }
  window.dispatchEvent(new Event("study-progress"));
}

export function markRead(courseId: string, chapterId: string) {
  const progress = readProgress(courseId);
  const read = progress.read ?? [];
  if (!read.includes(chapterId)) writeProgress(courseId, { ...progress, read: [...read, chapterId] });
}

export function markSection(courseId: string, chapterId: string, title: string) {
  const progress = readProgress(courseId);
  const sections = progress.sections ?? {};
  const done = sections[chapterId] ?? [];
  if (!done.includes(title)) writeProgress(courseId, { ...progress, sections: { ...sections, [chapterId]: [...done, title] } });
}

// Opening every chapter changes only what is locked; what was read and solved stays as it is either way.
export function setOpenAll(courseId: string, on: boolean) {
  const { openAll: _, ...progress } = readProgress(courseId);
  writeProgress(courseId, on ? { ...progress, openAll: true } : progress);
}

const allSolved =(chapter: ChapterInfo, progress: Progress) => chapter.stepIds.every((id) => progress.solved.includes(id));

// Read means Finish reading was pressed. Students from before that button count as read once all their practice was solved.
// A bridge has nothing to read, so only its steps count.
export function isRead(chapter: ChapterInfo, progress: Progress) {
  if (chapter.kind === "bridge") return true;
  if ((progress.read ?? []).includes(chapter.id)) return true;
  return chapter.stepIds.length > 0 && (progress.seen ?? []).includes(chapter.id) && allSolved(chapter, progress);
}

export function isDone(chapter: ChapterInfo, progress: Progress) {
  return isRead(chapter, progress) && allSolved(chapter, progress);
}

// A chapter opens only once every chapter before it is finished: read to the end and every practice question solved,
// unless the student chose to open every chapter.
export function isUnlocked(chapters: ChapterInfo[], chapterId: string, progress: Progress) {
  if (progress.openAll) return true;
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  return chapters.slice(0, Math.max(0, index)).every((chapter) => isDone(chapter, progress));
}

// The chapter to finish before a locked one opens: the first unfinished chapter before it.
export function blockerOf(chapters: ChapterInfo[], chapterId: string, progress: Progress): ChapterInfo | null {
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  return chapters.slice(0, Math.max(0, index)).find((chapter) => !isDone(chapter, progress)) ?? null;
}

// Where to go next: the chapter in progress, else the first open one after it that isn't done, else the first that isn't.
export function nextChapter(chapters: ChapterInfo[], progress: Progress): ChapterInfo | null {
  const visited = chapters.findIndex((chapter) => chapter.id === progress.last);
  // Looking at a locked chapter's page records it as the last one; resume from the furthest open chapter instead.
  const lastIndex = visited >= 0 && !isUnlocked(chapters, chapters[visited].id, progress)
    ? chapters.findLastIndex((chapter) => isUnlocked(chapters, chapter.id, progress))
    : visited;
  const ordered = lastIndex < 0 ? chapters : [...chapters.slice(lastIndex), ...chapters.slice(0, lastIndex)];
  return ordered.find((chapter) => !isDone(chapter, progress) && isUnlocked(chapters, chapter.id, progress)) ?? null;
}

export function resumeHref(chapter: ChapterInfo, progress: Progress) {
  if (chapter.kind === "bridge") return hrefOf(chapter);
  return isRead(chapter, progress) && !isDone(chapter, progress) ? `/sessions/${chapter.id}/` : `/topics/${chapter.id}/`;
}

export function chapterState(chapter: ChapterInfo, next: ChapterInfo | null, progress: Progress): ChapterState {
  if (isDone(chapter, progress)) return "done";
  if (next?.id === chapter.id) return "here";
  return chapter.kind !== "bridge" && isRead(chapter, progress) ? "read" : "ahead";
}

// Every chapter's state, with the ones that have not opened yet as locked.
export function courseStates(chapters: ChapterInfo[], progress: Progress): ChapterState[] {
  const next = nextChapter(chapters, progress);
  return chapters.map((chapter) => {
    const state = chapterState(chapter, next, progress);
    return !isUnlocked(chapters, chapter.id, progress) ? "locked" : state;
  });
}

// How far the plant has grown: the index of the last chapter that is open.
export function lastOpen(states: ChapterState[]) {
  return states.findLastIndex((state) => state !== "locked");
}

export function hasStarted(progress: Progress) {
  return Boolean(progress.last) || progress.solved.length > 0;
}

const EMPTY: Progress = { solved: [] };

export function useProgress(courseId: string): Progress {
  return useLoadedProgress(courseId) ?? EMPTY;
}

// null until this browser's progress has been read, for drawings that would otherwise show a fresh student's plant first.
export function useLoadedProgress(courseId: string): Progress | null {
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => {
    const sync = () => setProgress(readProgress(courseId));
    sync();
    window.addEventListener("study-progress", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("study-progress", sync);
      window.removeEventListener("storage", sync);
    };
  }, [courseId]);
  return progress;
}
