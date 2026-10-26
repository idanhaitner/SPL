"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { Mixed } from "@/lib/bidi";
import { readProgress } from "@/lib/progress";
import type { PartId } from "@/lib/parts";
import type { SearchHit } from "@/lib/types";

type Chapter = { id: string; title: string; part: PartId; practiceIds: string[] };
type PartLabel = { id: PartId; numeral: string; name: string };

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
  parts,
  hits,
}: {
  courseId: string;
  title: string;
  chapters: Chapter[];
  parts: PartLabel[];
  hits: SearchHit[];
}) {
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

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
        {(() => {
          const open = chapters.find((chapter) => samePath(pathname, `/topics/${chapter.id}`));
          if (!open) {
            return (
              <nav className="parts-nav" aria-label="Course parts">
                {parts.map((part) => {
                  const first = chapters.find((chapter) => chapter.part === part.id);
                  if (!first) return null;
                  return (
                    <Link key={part.id} href={`/topics/${first.id}`} className={`rail-part-${part.id}`}>
                      <span className="rail-numeral">{part.numeral}</span>
                      {part.name}
                    </Link>
                  );
                })}
              </nav>
            );
          }
          const part = parts.find((item) => item.id === open.part) ?? parts[0];
          return (
            <section className={`rail-part rail-part-${part.id}`}>
              <p className="rail-label"><span className="rail-numeral">{part.numeral}</span>{part.name}</p>
              <nav className="chapters-nav" aria-label={part.name}>
                {chapters.map((chapter, index) => {
                  if (chapter.part !== part.id) return null;
                  const href = `/topics/${chapter.id}`;
                  const current = samePath(pathname, href);
                  const finished = chapter.practiceIds.length > 0 && chapter.practiceIds.every((id) => solved.includes(id));
                  return (
                    <Link key={chapter.id} href={href} className={current ? "is-current" : ""} aria-current={current ? "page" : undefined}>
                      <span className={`dot${finished ? " is-done" : ""}`}>{String(index + 1).padStart(2, "0")}</span>
                      <span><Mixed text={chapter.title} /></span>
                    </Link>
                  );
                })}
              </nav>
            </section>
          );
        })()}
        <p className="progress-count">{total ? <>{done} / {total} exercises solved</> : ""}</p>
      </div>
    </aside>
  );
}
