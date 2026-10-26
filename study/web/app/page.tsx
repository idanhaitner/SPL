import Link from "next/link";
import { ChapterProgress } from "@/components/ChapterProgress";
import { Continue } from "@/components/Continue";
import { Mixed } from "@/lib/bidi";
import { loadCourse } from "@/lib/course";
import { PARTS } from "@/lib/parts";

export default function HomePage() {
  const course = loadCourse();
  const numberOf = new Map(course.topics.map((topic, index) => [topic.id, index + 1]));
  return (
    <article className="page page-home" data-part="cover">
      <h1><Mixed text={course.title} /></h1>
      <p className="lead"><Mixed text={course.summary} /></p>
      <Continue
        courseId={course.id}
        chapters={course.topics.map((topic) => ({ id: topic.id, title: topic.title }))}
      />
      {PARTS.map((part) => {
        const topics = course.topics.filter((topic) => part.chapters.includes(topic.id));
        if (topics.length === 0) return null;
        return (
          <section className={`part-group part-group-${part.id}`} key={part.id} aria-labelledby={`part-${part.id}`}>
            <h2 id={`part-${part.id}`}>
              <span className="part-numeral">{part.numeral}</span>
              {part.name}
            </h2>
            <ol className="chapter-list">
              {topics.map((topic, index) => (
                <li key={topic.id} style={{ "--i": index } as React.CSSProperties}>
                  <Link href={`/topics/${topic.id}`}>
                    <span className="num">{String(numberOf.get(topic.id)).padStart(2, "0")}</span>
                    <span>
                      <strong><Mixed text={topic.title} /></strong>
                      {topic.blurb && <em><Mixed text={topic.blurb} /></em>}
                      <ChapterProgress courseId={course.id} practiceIds={topic.practiceIds} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </article>
  );
}
