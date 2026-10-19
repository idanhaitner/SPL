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
    <article className="page glossary">
      <header className="masthead">
        <p className="kicker">מונחים</p>
        <h1>מונחים</h1>
        <span className="masthead-num" aria-hidden="true">{String(course.glossary.length).padStart(2, "0")}</span>
      </header>
      <p className="lead">המילים שהשיעורים שומרים, לפי הפרק שמגדיר אותן.</p>
      {groups.length > 0 && (
        <nav className="glossary-jump" aria-label="פרקים במונחים">
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
                <Link href={`/topics/${entry.topic}`}>לפתיחת הפרק</Link>
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
