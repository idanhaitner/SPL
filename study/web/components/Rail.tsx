"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { readProgress } from "@/lib/progress";
import type { SearchHit } from "@/lib/types";

type Chapter = { id: string; title: string; practiceIds: string[] };

export function Rail({
  courseId,
  title,
  chapters,
  hits,
}: {
  courseId: string;
  title: string;
  chapters: Chapter[];
  hits: SearchHit[];
}) {
  const pathname = usePathname();
  const chaptersRef = useRef<HTMLElement>(null);
  const [mark, setMark] = useState<{ top: number; height: number } | null>(null);
  const [solved, setSolved] = useState<string[]>([]);

  useLayoutEffect(() => {
    const nav = chaptersRef.current;
    if (!nav) return;
    const place = () => {
      const current = nav.querySelector<HTMLElement>("a.is-current");
      if (!current) {
        setMark(null);
        return;
      }
      const inset = 8;
      setMark({
        top: current.offsetTop + inset,
        height: Math.max(16, current.offsetHeight - inset * 2),
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [pathname]);

  useEffect(() => {
    const sync = () => setSolved(readProgress(courseId).solved);
    sync();
    window.addEventListener("study-progress", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("study-progress", sync);
      window.removeEventListener("storage", sync);
    };
  }, [courseId]);

  const total = chapters.reduce((sum, chapter) => sum + chapter.practiceIds.length, 0);
  const done = chapters.reduce(
    (sum, chapter) => sum + chapter.practiceIds.filter((id) => solved.includes(id)).length,
    0,
  );

  return (
    <aside className="rail">
      <p className="course-name"><Link href="/">{title}</Link></p>
      <SearchBox hits={hits} />
      <nav className="rail-nav">
        <Link className={pathname === "/" ? "is-current" : ""} href="/">סקירה</Link>
        <Link className={pathname === "/glossary" ? "is-current" : ""} href="/glossary">מונחים</Link>
      </nav>
      <p className="rail-label">פרקים</p>
      <nav className="chapters-nav" ref={chaptersRef}>
        {mark && <span className="rail-mark" style={{ top: mark.top, height: mark.height }} />}
        {chapters.map((chapter, index) => {
          const href = `/topics/${chapter.id}`;
          const current = pathname === href;
          const finished = chapter.practiceIds.length > 0 && chapter.practiceIds.every((id) => solved.includes(id));
          return (
            <Link key={chapter.id} href={href} className={current ? "is-current" : ""}>
              <span className={`dot${finished ? " is-done" : ""}`}>{String(index + 1).padStart(2, "0")}</span>
              <span>{chapter.title}</span>
            </Link>
          );
        })}
      </nav>
      <p className="progress-count">{total ? `${done} / ${total} תרגילים שנפתרו` : ""}</p>
    </aside>
  );
}
