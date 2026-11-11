import { PARTS } from "./parts";
import type { ChapterInfo } from "./progress";
import { stepsOf } from "./steps";
import type { Course } from "./types";

export type NavPart = { title: string; lang: string; summary: string; chapters: ChapterInfo[] };
export type CourseNav = { chapters: ChapterInfo[]; parts: NavPart[]; finale: ChapterInfo[] };

export function courseNav(course: Course): CourseNav {
  let count = 0;
  const chapters: ChapterInfo[] = course.topics.map((topic, index) => ({
    id: topic.id,
    title: topic.title,
    // Bridges sit between chapters without taking a chapter number.
    num: topic.kind === "bridge" ? 0 : (count += 1),
    pos: index,
    stepIds: stepsOf(topic).map((step) => step.id),
    kind: topic.kind,
  }));
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const parts = PARTS.map(({ title, lang, summary, ids }) => ({
    title,
    lang,
    summary,
    chapters: ids.map((id) => byId.get(id)).filter((chapter) => chapter !== undefined),
  }));
  const mapped = new Set(PARTS.flatMap((part) => part.ids));
  return { chapters, parts, finale: chapters.filter((chapter) => !mapped.has(chapter.id)) };
}

export function partOf(nav: CourseNav, chapterId: string) {
  return nav.parts.find((part) => part.chapters.some((chapter) => chapter.id === chapterId));
}

const STEM_LABELS = ["Memory", "Concurrency", "Communication", "Databases"];

// Where each part's name hangs on the course stem: at the leaf of its first chapter.
export function stemParts(nav: CourseNav) {
  return nav.parts.flatMap((part, index) => {
    const first = part.chapters.find((chapter) => chapter.kind !== "bridge");
    return first ? [{ label: STEM_LABELS[index], num: first.num }] : [];
  });
}
