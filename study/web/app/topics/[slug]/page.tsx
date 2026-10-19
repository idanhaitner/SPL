import Link from "next/link";
import { notFound } from "next/navigation";
import { Chapter } from "@/components/Chapter";
import { Visit } from "@/components/Visit";
import { Mixed } from "@/lib/bidi";
import { loadCourse } from "@/lib/course";

export function generateStaticParams() {
  return loadCourse().topics.map((topic) => ({ slug: topic.id }));
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = loadCourse();
  const index = course.topics.findIndex((topic) => topic.id === slug);
  if (index < 0) notFound();
  const topic = course.topics[index];
  const previous = course.topics[index - 1];
  const next = course.topics[index + 1];
  return (
    <article className="page chapter">
      <Visit courseId={course.id} slug={topic.id} />
      <header className="masthead">
        <p className="kicker">פרק {String(index + 1).padStart(2, "0")}</p>
        <h1><Mixed text={topic.title} /></h1>
        <span className="masthead-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      </header>
      <Chapter blocks={topic.blocks} courseId={course.id} />
      {(previous || next) && (
        <nav className="pager" aria-label="פרקים">
          {previous && (
            <Link className="pager-link pager-prev" href={`/topics/${previous.id}`}>
              <span className="pager-label">הפרק הקודם</span>
              <span className="pager-line">
                <span className="pager-arrow" aria-hidden="true" />
                <span className="pager-num">{String(index).padStart(2, "0")}</span>
                <span className="pager-title"><Mixed text={previous.title} /></span>
              </span>
            </Link>
          )}
          {next && (
            <Link className="pager-link pager-next" href={`/topics/${next.id}`}>
              <span className="pager-label">הפרק הבא</span>
              <span className="pager-line">
                <span className="pager-num">{String(index + 2).padStart(2, "0")}</span>
                <span className="pager-title"><Mixed text={next.title} /></span>
                <span className="pager-arrow" aria-hidden="true" />
              </span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
