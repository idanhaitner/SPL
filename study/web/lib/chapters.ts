import type { ChapterInfo } from "./progress";

// Kept out of progress.ts so that server-rendered pages can call these too.

// A bridge has no reading page: it opens straight in its session.
export function hrefOf(chapter: ChapterInfo) {
  return chapter.kind === "bridge" ? `/sessions/${chapter.id}/` : `/topics/${chapter.id}/`;
}

export function nameOf(chapter: ChapterInfo) {
  return chapter.kind === "bridge" ? "Review" : `Chapter ${chapter.num}`;
}
