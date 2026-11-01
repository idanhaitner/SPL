import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Blocks } from "@/components/Blocks";
import { Stepper } from "@/components/session/Stepper";
import { TopBar } from "@/components/shell/TopBar";
import { Visit } from "@/components/Visit";
import { loadCourse } from "@/lib/course";
import { courseNav, partOf } from "@/lib/nav";
import { stepsOf } from "@/lib/steps";

export function generateStaticParams() {
  return loadCourse().topics.filter((topic) => stepsOf(topic).length > 0).map((topic) => ({ slug: topic.id }));
}

export default async function SessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = loadCourse();
  const index = course.topics.findIndex((topic) => topic.id === slug);
  if (index < 0) notFound();
  const topic = course.topics[index];
  const steps = stepsOf(topic);
  if (steps.length === 0) notFound();
  const nav = courseNav(course);
  const part = partOf(nav, topic.id);
  const nextTopic = course.topics[index + 1];
  const rendered: Record<string, ReactNode> = {};
  for (const step of steps) {
    if (step.kind === "question") rendered[step.id] = <Blocks blocks={[step.block]} courseId={course.id} />;
  }
  return (
    <div className="session-page">
      <Visit courseId={course.id} slug={topic.id} />
      <TopBar courseId={course.id} title={course.title} hits={course.search} nav={nav} where={part ? `${part.title} · ${part.lang}` : undefined} />
      <Stepper
        courseId={course.id}
        chapter={nav.chapters[index]}
        steps={steps.map(({ id, kind, title }) => ({ id, kind, title }))}
        rendered={rendered}
        next={nextTopic ? { href: `/topics/${nextTopic.id}/`, title: nextTopic.title } : null}
      />
    </div>
  );
}
