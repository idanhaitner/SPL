import Link from "next/link";
import { Icon } from "@/components/home/Icon";
import { TopBar } from "@/components/shell/TopBar";
import { Mixed } from "@/lib/bidi";
import { loadCourse } from "@/lib/course";
import { courseNav } from "@/lib/nav";
import type { ChapterInfo } from "@/lib/progress";
import type { GlossaryEntry } from "@/lib/types";

function Term({ entry, chapterTitle }: { entry: GlossaryEntry; chapterTitle?: string }) {
  return (
    <div className="glossary-term" id={entry.anchor}>
      <dt>
        {chapterTitle ? (
          <Link href={`/topics/${entry.topic}/`} prefetch={false} aria-label={`${entry.term}, open the chapter ${chapterTitle}`}>
            <Mixed text={entry.term} />
          </Link>
        ) : (
          <Mixed text={entry.term} />
        )}
      </dt>
      <dd><Mixed text={entry.definition} /></dd>
    </div>
  );
}

export default function GlossaryPage() {
  const course = loadCourse();
  const nav = courseNav(course);
  const known = new Set(nav.chapters.map((chapter) => chapter.id));
  const withTerms = (chapters: ChapterInfo[]) =>
    chapters
      .map((chapter) => ({ ...chapter, entries: course.glossary.filter((entry) => entry.topic === chapter.id) }))
      .filter((chapter) => chapter.entries.length > 0);
  const parts = [
    ...nav.parts.map((part) => ({ title: part.title, lang: part.lang, chapters: withTerms(part.chapters) })),
    { title: "Before the exam", lang: "", chapters: withTerms(nav.finale) },
  ].filter((part) => part.chapters.length > 0);
  const loose = course.glossary.filter((entry) => !known.has(entry.topic));
  const count = course.glossary.length;
  // A pinned rail on wide screens; on narrow ones the same links fold away so the terms come first.
  const jumpLinks = parts.map((part) => (
    <div className="glossary-jump-part" key={part.title}>
      <p>{part.title}</p>
      <ul>
        {part.chapters.map((chapter) => (
          <li key={chapter.id}>
            <a href={`#glossary-${chapter.id}`}><Mixed text={chapter.title} /></a>
          </li>
        ))}
      </ul>
    </div>
  ));

  return (
    <div className="glossary-page">
      <TopBar courseId={course.id} title={course.title} hits={course.search} nav={nav} />
      <header className="masthead">
        <div className="gh-arch gh-arch-1" />
        <div className="gh-arch gh-arch-2" />
        <div className="masthead-inner">
          <h1>Glossary</h1>
          <p className="masthead-lede">{count} {count === 1 ? "term" : "terms"}, grouped by the chapter that teaches them. Select a term to open its chapter.</p>
        </div>
      </header>
      <div className="glossary-layout">
        <nav className="glossary-jump glossary-rail" aria-label="Chapters in the glossary">{jumpLinks}</nav>
        <details className="glossary-menu">
          <summary>Jump to a chapter <Icon name="down" /></summary>
          <nav className="glossary-jump" aria-label="Chapters in the glossary">{jumpLinks}</nav>
        </details>
        <div className="glossary-list">
          {parts.map((part) => (
            <section className="glossary-part" key={part.title}>
              <h2>{part.title}</h2>
              {part.lang && <p className="glossary-lang">{part.lang}</p>}
              {part.chapters.map((chapter) => (
                <section className="glossary-chapter" id={`glossary-${chapter.id}`} key={chapter.id}>
                  <h3><span className="glossary-num">{chapter.num}</span> <Mixed text={chapter.title} /></h3>
                  <dl>
                    {chapter.entries.map((entry) => <Term key={entry.anchor} entry={entry} chapterTitle={chapter.title} />)}
                  </dl>
                </section>
              ))}
            </section>
          ))}
          {loose.length > 0 && (
            <section className="glossary-part">
              <h2>Other terms</h2>
              <dl>
                {loose.map((entry) => <Term key={entry.anchor} entry={entry} />)}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
