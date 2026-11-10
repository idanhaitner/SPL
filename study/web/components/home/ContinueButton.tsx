"use client";

import Link from "next/link";
import { Mixed } from "@/lib/bidi";
import { hasStarted, hrefOf, isDone, nextChapter, resumeHref, useProgress, type ChapterInfo } from "@/lib/progress";
import { Icon } from "./Icon";

export function ContinueButton({ courseId, chapters, showNote = false }: { courseId: string; chapters: ChapterInfo[]; showNote?: boolean }) {
  const progress = useProgress(courseId);
  const next = nextChapter(chapters, progress);
  const target = next ?? chapters[chapters.length - 1];
  const started = hasStarted(progress);
  const label = !next ? "Review for the exam" : target.kind === "bridge" ? (target.stepIds.some((id) => progress.solved.includes(id)) ? "Continue the review" : "Start the review") : started ? `Continue chapter ${target.num}` : `Start chapter ${target.num}`;
  const finished = chapters.filter((chapter) => isDone(chapter, progress)).length;
  return (
    <>
      <Link className="gh-btn" href={next ? resumeHref(target, progress) : hrefOf(target)}>
        {label}
        <Icon name="arrow" />
      </Link>
      {showNote && (
        <p className="gh-action-note">
          <Mixed text={target.title} />
          {started && <span> · {finished} of {chapters.length} done</span>}
        </p>
      )}
    </>
  );
}

export function CloseHeading({ courseId, chapters }: { courseId: string; chapters: ChapterInfo[] }) {
  const progress = useProgress(courseId);
  const next = nextChapter(chapters, progress);
  const text = !next ? "You grew the whole plant." : hasStarted(progress) ? "Your next leaf is ready." : "Your first leaf is ready.";
  return <h2>{text}</h2>;
}
