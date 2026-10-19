import Link from "next/link";
import { Continue } from "@/components/Continue";
import { Mixed } from "@/lib/bidi";
import { loadCourse } from "@/lib/course";

export default function HomePage() {
  const course = loadCourse();
  return (
    <article className="page">
      <p className="kicker">קורס</p>
      <h1><Mixed text={course.title} /></h1>
      <p className="lead"><Mixed text={course.summary} /></p>
      <Continue
        courseId={course.id}
        chapters={course.topics.map((topic) => ({ id: topic.id, title: topic.title }))}
      />
      <ol className="chapter-list">
        {course.topics.map((topic, index) => (
          <li key={topic.id} style={{ animationDelay: `${index * 45}ms` }}>
            <Link href={`/topics/${topic.id}`}>
              <span className="num">{String(index + 1).padStart(2, "0")}</span>
              <span>
                <strong><Mixed text={topic.title} /></strong>
                {topic.blurb && <em><Mixed text={topic.blurb} /></em>}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </article>
  );
}
