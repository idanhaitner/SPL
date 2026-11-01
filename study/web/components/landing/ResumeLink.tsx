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
    </Link>
  );
}
