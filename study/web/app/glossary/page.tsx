import Link from "next/link";
import { Mixed } from "@/lib/bidi";
import { loadCourse } from "@/lib/course";

export default function GlossaryPage() {
  const course = loadCourse();
  const known = new Set(course.topics.map((topic) => topic.id));
  const groups = course.topics
    .map((topic, index) => ({
      id: topic.id,
      title: topic.title,
      number: String(index + 1).padStart(2, "0"),
      entries: course.glossary.filter((entry) => entry.topic === topic.id),
    }))
    .filter((group) => group.entries.length > 0);
  const loose = course.glossary.filter((entry) => !known.has(entry.topic));

  return (
    <article className="page glossary" data-part="cover">
      <header className="masthead">
        <h1>Glossary</h1>
        <span className="masthead-count">{course.glossary.length} terms</span>
      </header>
      <p className="lead">The terms the lessons keep, grouped by the chapter that defines them.</p>
      {groups.length > 0 && (
        <nav className="glossary-jump" aria-label="Chapters in the glossary">
          {groups.map((group) => (
            <a key={group.id} href={`#glossary-${group.id}`}><Mixed text={group.title} /></a>
          ))}
        </nav>
      )}
      {groups.map((group) => (
        <section className="glossary-group" id={`glossary-${group.id}`} key={group.id}>
          <h2>
            <span className="num">{group.number}</span>
            <Mixed text={group.title} />
          </h2>
          <div className="glossary-grid">
            {group.entries.map((entry) => (
              <article className="glossary-card" id={entry.anchor} key={entry.anchor}>
                <h3><Mixed text={entry.term} /></h3>
                <p><Mixed text={entry.definition} /></p>
                <Link href={`/topics/${entry.topic}`}>Open the chapter</Link>
              </article>
            ))}
          </div>
        </section>
      ))}
      {loose.length > 0 && (
        <section className="glossary-group">
          <div className="glossary-grid">
            {loose.map((entry) => (
              <article className="glossary-card" id={entry.anchor} key={entry.anchor}>
                <h3><Mixed text={entry.term} /></h3>
                <p><Mixed text={entry.definition} /></p>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
