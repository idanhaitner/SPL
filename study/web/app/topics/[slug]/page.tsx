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
        <p className="kicker">Chapter {String(index + 1).padStart(2, "0")}</p>
        <h1><Mixed text={topic.title} /></h1>
        <span className="masthead-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      </header>
      <Chapter
        blocks={topic.blocks}
        courseId={course.id}
        previousChapter={previous ? { href: `/topics/${previous.id}`, title: previous.title, num: String(index).padStart(2, "0"), blurb: previous.blurb } : null}
        nextChapter={next ? { href: `/topics/${next.id}`, title: next.title, num: String(index + 2).padStart(2, "0"), blurb: next.blurb } : null}
      />
    </article>
  );
}
