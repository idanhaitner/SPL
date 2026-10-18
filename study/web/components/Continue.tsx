"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readProgress } from "@/lib/progress";

type Chapter = { id: string; title: string };

export function Continue({ courseId, chapters }: { courseId: string; chapters: Chapter[] }) {
  const first = chapters[0];
  const [target, setTarget] = useState(first);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    const progress = readProgress(courseId);
    const found = chapters.find((chapter) => chapter.id === progress.last);
    if (found && progress.last) {
      setTarget(found);
      setResuming(true);
    }
  }, [courseId, chapters]);

  if (!target) return null;
  return (
    <Link className="continue" href={`/topics/${target.id}`}>
      <span className="continue-copy">
        <span>{resuming ? "Continue" : "Start"}</span>
        <strong>{target.title}</strong>
      </span>
      <span className="continue-arrow" aria-hidden="true" />
    </Link>
  );
}
