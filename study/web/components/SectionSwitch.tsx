"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FinishReading, type Hop } from "@/components/chapter/FinishReading";
import { Icon } from "@/components/home/Icon";
import { LeafMark } from "@/components/home/LeafMark";
import { Inline } from "@/lib/inline";
import { markSection, useProgress } from "@/lib/progress";

export type SectionPart = { title: string; slug: string; ids: string[]; body: ReactNode };

function hashId() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

export function SectionSwitch({ courseId, chapterId, stepIds, intro, parts, session, next }: { courseId: string; chapterId: string; stepIds: string[]; intro: ReactNode; parts: SectionPart[]; session: Hop | null; next: Hop | null }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const menu = useRef<HTMLDetailsElement>(null);
  const progress = useProgress(courseId);
  const done = progress.sections?.[chapterId] ?? [];

  useEffect(() => {
    const apply = () => {
      const id = hashId();
      if (!id) return;
      // Older links point at a question inside the chapter; it lives in the session now.
      if (stepIds.includes(id)) {
        router.replace(`/sessions/${chapterId}/?step=${encodeURIComponent(id)}`);
        return;
      }
      const hit = parts.findIndex((part) => part.slug === id || part.ids.includes(id));
      if (hit < 0) return;
      setIndex(hit);
      requestAnimationFrame(() => {
        if (id !== parts[hit].slug) document.getElementById(id)?.scrollIntoView({ block: "start" });
      });
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [parts, stepIds, chapterId, router]);

  function show(target: number) {
    setIndex(target);
    if (menu.current) menu.current.open = false;
    history.replaceState(history.state, "", `#${parts[target].slug}`);
    requestAnimationFrame(() => document.getElementById("chapter-part")?.scrollIntoView({ block: "start" }));
  }

  const current = parts[index] ?? parts[0];
  const previous = parts[index - 1];
  const upcoming = parts[index + 1];
  const nodeState = (item: number) => (item === index ? "here" : done.includes(parts[item].title) ? "done" : "ahead");
  const list = (
    <ol>
      {parts.map((part, item) => (
        <li key={part.slug} className={done.includes(part.title) ? "is-grown" : undefined}>
          <button type="button" aria-current={item === index ? "location" : undefined} onClick={() => show(item)}>
            <LeafMark className="stem-node" state={nodeState(item)} />
            <span><Inline text={part.title} /></span>
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="reader">
      {parts.length > 1 ? (
        <nav className="section-stem parts" aria-label="Sections of this chapter">{list}</nav>
      ) : <span />}
      {parts.length > 1 && (
        <details className="section-menu" ref={menu}>
          <summary>
            <b><Inline text={current.title} /></b>
            <span>Section {index + 1} of {parts.length}</span>
            <Icon name="down" />
          </summary>
          <div className="section-menu-list">{list}</div>
        </details>
      )}
      <article className="reader-body">
        {index === 0 && intro && <div className="chapter-lead">{intro}</div>}
        <section className="part-panel" id="chapter-part">
          <h2 id={current.slug}><Inline text={current.title} /></h2>
          {current.body}
        </section>
        <nav className="handoff" aria-label="Continue reading">
          {previous ? (
            <button type="button" className="gh-quiet" onClick={() => show(index - 1)}>
              <Icon name="back" />
              <Inline text={previous.title} />
            </button>
          ) : <span />}
          {upcoming ? (
            <div className="handoff-go">
              <p>Next section<span><Inline text={upcoming.title} /></span></p>
              <button
                type="button"
                className="gh-btn"
                onClick={() => {
                  markSection(courseId, chapterId, current.title);
                  show(index + 1);
                }}
              >
                Continue
                <Icon name="arrow" />
              </button>
            </div>
          ) : (
            <FinishReading courseId={courseId} chapterId={chapterId} session={session} next={next} />
          )}
        </nav>
      </article>
    </div>
  );
}
