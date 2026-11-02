import { notFound } from "next/navigation";
import { Chapter } from "@/components/Chapter";
import { ChapterGate } from "@/components/chapter/ChapterGate";
import { CourseStrip } from "@/components/chapter/CourseStrip";
import { LeafBlade } from "@/components/home/LeafShape";
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
      <TopBar courseId={course.id} title={course.title} nav={nav} where={part ? `${part.title} · ${part.lang}` : undefined} />
      <header className="masthead">
        <div className="gh-arch gh-arch-1" />
        <div className="gh-arch gh-arch-2" />
        <div className="masthead-inner">
          <svg className="masthead-leaf" viewBox="0 0 112 112" role="img" aria-label={`Chapter ${index + 1} of ${course.topics.length}`}>
            <g transform="translate(6 106) rotate(-45)">
              <g className="masthead-leaf-open"><LeafBlade size={138} /></g>
            </g>
            <text x="57" y="67" textAnchor="middle" fontSize="36">{index + 1}</text>
          </svg>
          <div>
            <h1><Mixed text={topic.title} /></h1>
            {topic.blurb && <p className="masthead-lede"><Mixed text={topic.blurb} /></p>}
          </div>
        </div>
        <CourseStrip courseId={course.id} chapters={nav.chapters} currentId={topic.id} />
      </header>
      <ChapterGate courseId={course.id} chapters={nav.chapters} chapterId={topic.id}>
        <Chapter
          topic={topic}
          courseId={course.id}
          session={nav.chapters[index].stepIds.length > 0 ? { href: `/sessions/${topic.id}/`, title: `Guided session: ${topic.title}` } : null}
          next={nextTopic ? { href: `/topics/${nextTopic.id}/`, title: nextTopic.title } : null}
        />
      </ChapterGate>
    </div>
  );
}
