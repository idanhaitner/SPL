"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mixed } from "@/lib/bidi";
import { readProgress } from "@/lib/progress";

type Chapter = { id: string; title: string };

export function ResumeLink({
  courseId,
  chapters,
  className,
  compact = false,
}: {
  courseId: string;
  chapters: Chapter[];
  className: string;
  compact?: boolean;
}) {
  const [target, setTarget] = useState<Chapter | null>(null);

  useEffect(() => {
    const progress = readProgress(courseId);
    const found = chapters.find((chapter) => chapter.id === progress.last);
    if (found) setTarget(found);
  }, [courseId, chapters]);

  const first = chapters[0];
  if (!first) return null;
  return (
    <Link className={className} href={`/topics/${(target ?? first).id}`}>
      <span>{target ? (compact ? "Continue" : <>Continue with <Mixed text={target.title} /></>) : "Start reading"}</span>
      <svg aria-hidden="true" viewBox="0 0 256 256" width="16" height="16">
        <path d="M221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32Z" fill="currentColor" />
      </svg>
    </Link>
  );
}
