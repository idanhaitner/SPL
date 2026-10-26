"use client";

import { useEffect, useState } from "react";
import { readProgress } from "@/lib/progress";

export function ChapterProgress({ courseId, practiceIds }: { courseId: string; practiceIds: string[] }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const sync = () => {
      const solved = readProgress(courseId).solved;
      setDone(practiceIds.filter((id) => solved.includes(id)).length);
    };
    sync();
    window.addEventListener("study-progress", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("study-progress", sync);
      window.removeEventListener("storage", sync);
    };
  }, [courseId, practiceIds]);

  const total = practiceIds.length;
  if (!total) return null;
  return (
    <span className="chapter-progress">
      <span className="chapter-bar" aria-hidden="true">
        <span style={{ width: `${Math.round((done / total) * 100)}%` }} />
      </span>
      <span className="chapter-count">{done} / {total} solved</span>
    </span>
  );
}
