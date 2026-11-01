import { GlossaryBrowser } from "@/components/GlossaryBrowser";
import { CloseSprig } from "@/components/home/CloseSprig";
import { TopBar } from "@/components/shell/TopBar";
import { loadCourse } from "@/lib/course";
import { courseNav } from "@/lib/nav";
import type { ChapterInfo } from "@/lib/progress";

export default function GlossaryPage() {
  const course = loadCourse();
  const nav = courseNav(course);
  const known = new Set(nav.chapters.map((chapter) => chapter.id));
  const withTerms = (chapters: ChapterInfo[]) =>
    chapters
      .map((chapter) => ({ id: chapter.id, num: chapter.num, title: chapter.title, entries: course.glossary.filter((entry) => entry.topic === chapter.id) }))
      .filter((chapter) => chapter.entries.length > 0);
  const parts = [
    ...nav.parts.map((part) => ({ title: part.title, lang: part.lang, chapters: withTerms(part.chapters) })),
    { title: "Before the exam", lang: "", chapters: withTerms(nav.finale) },
  ].filter((part) => part.chapters.length > 0);
  const loose = course.glossary.filter((entry) => !known.has(entry.topic));
  const count = course.glossary.length;

  return (
    <div className="glossary-page">
      <TopBar courseId={course.id} title={course.title} nav={nav} />
      <header className="masthead">
        <div className="gh-arch gh-arch-1" />
        <div className="gh-arch gh-arch-2" />
        <CloseSprig />
        <div className="masthead-inner">
          <h1>Glossary</h1>
          <p className="masthead-lede">{count} {count === 1 ? "term" : "terms"}, grouped by the chapter that teaches them. Select a term to open its chapter.</p>
        </div>
      </header>
      <GlossaryBrowser parts={parts} loose={loose} count={count} />
    </div>
  );
}
