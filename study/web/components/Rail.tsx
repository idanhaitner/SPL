"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { Mixed } from "@/lib/bidi";
import { readProgress } from "@/lib/progress";
import type { SearchHit } from "@/lib/types";

type Chapter = { id: string; title: string; practiceIds: string[] };

function samePath(pathname: string, href: string) {
  const trim = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
  return trim(pathname) === trim(href);
}

function narrowScreen() {
  return window.matchMedia("(max-width: 800px)").matches;
}

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
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [mark, setMark] = useState<{ top: number; height: number } | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const nav = chaptersRef.current;
    if (!nav) return;
    const place = () => {
      const current = nav.querySelector<HTMLElement>("a.is-current");
      if (!current || current.offsetParent === null) {
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
  }, [pathname, open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const main = document.getElementById("content");
    const query = window.matchMedia("(max-width: 800px)");
    const apply = () => {
      const lock = open && query.matches;
      if (lock) main?.setAttribute("inert", "");
      else main?.removeAttribute("inert");
      document.body.style.overflow = lock ? "hidden" : "";
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    apply();
    query.addEventListener("change", apply);
    if (open) window.addEventListener("keydown", onKey);
    return () => {
      query.removeEventListener("change", apply);
      window.removeEventListener("keydown", onKey);
      main?.removeAttribute("inert");
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !narrowScreen()) return;
    const panel = document.getElementById("rail-panel");
    const current = panel?.querySelector<HTMLElement>("a.is-current");
    if (!panel || !current) return;
    const panelBox = panel.getBoundingClientRect();
    const linkBox = current.getBoundingClientRect();
    if (linkBox.top < panelBox.top) panel.scrollTop += linkBox.top - panelBox.top - 12;
    else if (linkBox.bottom > panelBox.bottom) panel.scrollTop += linkBox.bottom - panelBox.bottom + 12;
  }, [open, pathname]);

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
    <aside className={`rail${open ? " is-open" : ""}`}>
      <div className="rail-bar">
        <button
          ref={toggleRef}
          type="button"
          className="rail-toggle"
          aria-expanded={open}
          aria-controls="rail-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="rail-toggle-icon" aria-hidden="true" />
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
        <p className="course-name"><Link href="/"><Mixed text={title} /></Link></p>
      </div>
      <div
        className="rail-panel"
        id="rail-panel"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
        }}
      >
        <SearchBox hits={hits} />
        <nav className="rail-nav">
          <Link className={samePath(pathname, "/") ? "is-current" : ""} href="/">Overview</Link>
          <Link className={samePath(pathname, "/glossary") ? "is-current" : ""} href="/glossary">Glossary</Link>
        </nav>
        <p className="rail-label">Chapters</p>
        <nav className="chapters-nav" ref={chaptersRef}>
          {mark && <span className="rail-mark" style={{ top: mark.top, height: mark.height }} />}
          {chapters.map((chapter, index) => {
            const href = `/topics/${chapter.id}`;
            const current = samePath(pathname, href);
            const finished = chapter.practiceIds.length > 0 && chapter.practiceIds.every((id) => solved.includes(id));
            return (
              <Link key={chapter.id} href={href} className={current ? "is-current" : ""}>
                <span className={`dot${finished ? " is-done" : ""}`}>{String(index + 1).padStart(2, "0")}</span>
                <span><Mixed text={chapter.title} /></span>
              </Link>
            );
          })}
        </nav>
        <p className="progress-count">{total ? <>{done} / {total} exercises solved</> : ""}</p>
      </div>
    </aside>
  );
}
