import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Blocks } from "@/components/Blocks";
import { ChapterGate } from "@/components/chapter/ChapterGate";
import type { RenderedStep } from "@/components/session/rendered";
import { Stepper } from "@/components/session/Stepper";
import { TopBar } from "@/components/shell/TopBar";
import { Visit } from "@/components/Visit";
import { loadCourse } from "@/lib/course";
import { courseNav, partOf } from "@/lib/nav";
import { stepsOf } from "@/lib/steps";
import type { Block, Exercise } from "@/lib/types";

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
  const render = (blocks: Block[], key?: string | number) => <Blocks key={key} blocks={blocks} courseId={course.id} />;
  const rendered: Record<string, ReactNode> = {};
  const exercises: Record<string, Exercise> = {};
  const pieces: Record<string, RenderedStep> = {};
  for (const step of steps) {
    if (step.kind === "question") {
      rendered[step.id] = render([step.block]);
    } else if (step.kind === "recap") {
      rendered[step.id] = render(step.blocks);
    } else {
      const { exercise } = step;
      exercises[step.id] = exercise;
      pieces[step.id] = {
        content: render(exercise.statement),
        hints: exercise.hints.map((blocks, item) => render(blocks, item)),
        examples: exercise.examples.map((blocks, item) => render(blocks, item)),
        caseHints: Object.fromEntries(Object.entries(exercise.caseHints).map(([name, blocks]) => [name, render(blocks)])),
      };
    }
  }
  return (
    <div className="session-page">
      <Visit courseId={course.id} slug={topic.id} />
      <TopBar courseId={course.id} title={course.title} nav={nav} where={part ? `${part.title} · ${part.lang}` : undefined} />
      <ChapterGate courseId={course.id} chapters={nav.chapters} chapterId={topic.id}>
        <Stepper
          courseId={course.id}
          chapter={nav.chapters[index]}
          steps={steps.map(({ id, kind, title }) => ({ id, kind, title }))}
          rendered={rendered}
          exercises={exercises}
          pieces={pieces}
          harness={course.harness}
          next={nextTopic ? { href: `/topics/${nextTopic.id}/`, title: nextTopic.title } : null}
        />
      </ChapterGate>
    </div>
  );
}
