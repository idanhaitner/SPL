"use client";

import { useEffect, useState } from "react";

export type Progress = {
  solved: string[];
  last?: string;
  seen?: string[];
};

export type ChapterInfo = { id: string; title: string; num: number; practiceIds: string[] };
export type ChapterState = "done" | "read" | "here" | "ahead";

export function storageKey(courseId: string) {
  return `study:${courseId}`;
}

const strings = (value: unknown) => (Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);

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

// Done means all of a chapter's practice is solved. Opening a chapter only makes it "read".
export function isDone(chapter: ChapterInfo, progress: Progress) {
  return chapter.practiceIds.length > 0 && chapter.practiceIds.every((id) => progress.solved.includes(id));
}

const isSeen = (chapter: ChapterInfo, progress: Progress) => (progress.seen ?? []).includes(chapter.id);

// A chapter with no practice has nothing left to do once it has been opened.
export function isFinished(chapter: ChapterInfo, progress: Progress) {
  return isDone(chapter, progress) || (chapter.practiceIds.length === 0 && isSeen(chapter, progress));
}

// Where to go next: the chapter in progress, else the first one after it that isn't finished, else the first one that isn't.
export function nextChapter(chapters: ChapterInfo[], progress: Progress): ChapterInfo | null {
  const lastIndex = chapters.findIndex((chapter) => chapter.id === progress.last);
  const ordered = lastIndex < 0 ? chapters : [...chapters.slice(lastIndex), ...chapters.slice(0, lastIndex)];
  return ordered.find((chapter) => !isFinished(chapter, progress)) ?? null;
}

export function chapterState(chapter: ChapterInfo, next: ChapterInfo | null, progress: Progress): ChapterState {
  if (isDone(chapter, progress)) return "done";
  if (next?.id === chapter.id) return "here";
  return isSeen(chapter, progress) ? "read" : "ahead";
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
