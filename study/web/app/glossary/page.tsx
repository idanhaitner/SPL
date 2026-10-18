import Link from "next/link";
import { loadCourse } from "@/lib/course";

export const dynamic = "force-dynamic";

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
    <article className="page glossary">
      <header className="masthead">
        <p className="kicker">Glossary</p>
        <h1>Terms</h1>
        <span className="masthead-num" aria-hidden="true">{String(course.glossary.length).padStart(2, "0")}</span>
      </header>
      <p className="lead">The words the lectures keep, grouped by the chapter that defines them.</p>
      {groups.length > 0 && (
        <nav className="glossary-jump" aria-label="Chapters in the glossary">
          {groups.map((group) => (
            <a key={group.id} href={`#glossary-${group.id}`}>{group.title}</a>
          ))}
        </nav>
      )}
      {groups.map((group) => (
        <section className="glossary-group" id={`glossary-${group.id}`} key={group.id}>
          <h2>
            <span className="num">{group.number}</span>
            {group.title}
          </h2>
          <div className="glossary-grid">
            {group.entries.map((entry) => (
              <article className="glossary-card" id={entry.anchor} key={entry.anchor}>
                <h3>{entry.term}</h3>
                <p>{entry.definition}</p>
                <Link href={`/topics/${entry.topic}`}>Open chapter</Link>
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
                <h3>{entry.term}</h3>
                <p>{entry.definition}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
