import { PARTS } from "./parts";
import type { ChapterInfo } from "./progress";
import { stepsOf } from "./steps";
import type { Course } from "./types";

export type NavPart = { title: string; lang: string; summary: string; chapters: ChapterInfo[] };
export type CourseNav = { chapters: ChapterInfo[]; parts: NavPart[]; finale: ChapterInfo[] };

export function courseNav(course: Course): CourseNav {
  const chapters = course.topics.map((topic, index) => ({
    id: topic.id,
    title: topic.title,
    num: index + 1,
    stepIds: stepsOf(topic).map((step) => step.id),
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
