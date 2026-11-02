"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/home/Icon";
import { Mixed } from "@/lib/bidi";
import { blockerOf, isUnlocked, useLoadedProgress, type ChapterInfo } from "@/lib/progress";

// A chapter, or its session, stays a bud until the chapter before it is finished. Links, search, and typed addresses all land here.
export function ChapterGate({ courseId, chapters, chapterId, children }: { courseId: string; chapters: ChapterInfo[]; chapterId: string; children: ReactNode }) {
  const progress = useLoadedProgress(courseId);
  if (!progress || isUnlocked(chapters, chapterId, progress)) return children;
  const chapter = chapters.find((item) => item.id === chapterId);
  const blocker = blockerOf(chapters, chapterId, progress);
  if (!chapter || !blocker) return children;
  return (
    <section className="locked-panel" aria-labelledby="locked-title">
      <svg className="locked-bud" viewBox="0 0 64 96" aria-hidden="true">
        <path className="locked-bud-stalk" d="M32 94V62" />
        <path className="locked-bud-shape" d="M32 64C14 52 12 22 32 4c20 18 18 48 0 60Z" />
        <path className="locked-bud-rib" d="M32 58V16" />
      </svg>
      <h2 id="locked-title">Chapter {chapter.num} is still a bud</h2>
      <p>
        It opens when you have read all of chapter {blocker.num}, <Mixed text={blocker.title} />, and solved every one of its practice questions. Each chapter builds only on the ones before it, so the plant grows in order.
      </p>
      <div className="locked-actions">
        <Link className="gh-btn" href={`/topics/${blocker.id}/`}>Go to chapter {blocker.num}<Icon name="arrow" /></Link>
        <Link className="gh-quiet" href="/">Back to the course</Link>
      </div>
    </section>
  );
}
