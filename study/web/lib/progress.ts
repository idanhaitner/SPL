"use client";

import { useEffect, useState } from "react";

export type Progress = {
  solved: string[];
  last?: string;
  seen?: string[];
  read?: string[];
  sections?: Record<string, string[]>;
};

export type ChapterInfo = { id: string; title: string; num: number; stepIds: string[] };
export type ChapterState = "done" | "read" | "here" | "ahead";

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

const allSolved = (chapter: ChapterInfo, progress: Progress) => chapter.stepIds.every((id) => progress.solved.includes(id));

// Read means Finish reading was pressed. Students from before that button count as read once all their practice was solved.
export function isRead(chapter: ChapterInfo, progress: Progress) {
  if ((progress.read ?? []).includes(chapter.id)) return true;
  return chapter.stepIds.length > 0 && (progress.seen ?? []).includes(chapter.id) && allSolved(chapter, progress);
}

export function isDone(chapter: ChapterInfo, progress: Progress) {
  return isRead(chapter, progress) && allSolved(chapter, progress);
}

// Where to go next: the chapter in progress, else the first one after it that isn't done, else the first one that isn't.
export function nextChapter(chapters: ChapterInfo[], progress: Progress): ChapterInfo | null {
  const lastIndex = chapters.findIndex((chapter) => chapter.id === progress.last);
  const ordered = lastIndex < 0 ? chapters : [...chapters.slice(lastIndex), ...chapters.slice(0, lastIndex)];
  return ordered.find((chapter) => !isDone(chapter, progress)) ?? null;
}

export function resumeHref(chapter: ChapterInfo, progress: Progress) {
  return isRead(chapter, progress) && !isDone(chapter, progress) ? `/sessions/${chapter.id}/` : `/topics/${chapter.id}/`;
}

export function chapterState(chapter: ChapterInfo, next: ChapterInfo | null, progress: Progress): ChapterState {
  if (isDone(chapter, progress)) return "done";
  if (next?.id === chapter.id) return "here";
  return isRead(chapter, progress) ? "read" : "ahead";
}

export function hasStarted(progress: Progress) {
  return Boolean(progress.last) || progress.solved.length > 0;
}

export function useProgress(courseId: string): Progress {
  const [progress, setProgress] = useState<Progress>({ solved: [] });
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
