import { notFound } from "next/navigation";
import { Chapter } from "@/components/Chapter";
import { CourseStrip } from "@/components/chapter/CourseStrip";
import { TopBar } from "@/components/shell/TopBar";
import { Visit } from "@/components/Visit";
import { Mixed } from "@/lib/bidi";
import { loadCourse } from "@/lib/course";
import { courseNav, partOf } from "@/lib/nav";

export function generateStaticParams() {
  return loadCourse().topics.map((topic) => ({ slug: topic.id }));
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = loadCourse();
  const index = course.topics.findIndex((topic) => topic.id === slug);
  if (index < 0) notFound();
  const topic = course.topics[index];
  const nextTopic = course.topics[index + 1];
  const nav = courseNav(course);
  const part = partOf(nav, topic.id);
  return (
    <div className="chapter-page">
      <Visit courseId={course.id} slug={topic.id} />
      <TopBar courseId={course.id} title={course.title} hits={course.search} nav={nav} where={part ? `${part.title} · ${part.lang}` : undefined} />
      <header className="masthead">
        <div className="gh-arch gh-arch-1" />
        <div className="gh-arch gh-arch-2" />
        <div className="masthead-inner">
          <svg className="masthead-leaf" viewBox="0 0 112 112" role="img" aria-label={`Chapter ${index + 1} of ${course.topics.length}`}>
            <path d="M8 104C2 50 40 6 106 6c5 62-36 104-98 98Z" />
            <text x="58" y="72" textAnchor="middle" fontSize="40">{index + 1}</text>
          </svg>
          <div>
            <h1><Mixed text={topic.title} /></h1>
            {topic.blurb && <p className="masthead-lede"><Mixed text={topic.blurb} /></p>}
          </div>
        </div>
        <CourseStrip courseId={course.id} chapters={nav.chapters} currentId={topic.id} />
      </header>
      <Chapter
        blocks={topic.blocks}
        courseId={course.id}
        chapterId={topic.id}
        session={topic.practiceIds.length > 0 ? { href: `/sessions/${topic.id}/`, title: `Guided session: ${topic.title}` } : null}
        next={nextTopic ? { href: `/topics/${nextTopic.id}/`, title: nextTopic.title } : null}
      />
    </div>
  );
}
