"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FinishReading, type Hop } from "@/components/chapter/FinishReading";
import { Icon } from "@/components/home/Icon";
import { LeafMark } from "@/components/home/LeafMark";
import { Inline } from "@/lib/inline";
import { markSection, useProgress } from "@/lib/progress";

// A part with a group is one page of a long section that was split at its subsections.
export type SectionPart = { title: string; slug: string; group?: { title: string; slug: string }; label?: string; ids: string[]; body: ReactNode };

function hashId() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

// What a margin card can rise beside: the paragraph that introduces its idea, and the lists, code, tables and worked examples that follow it.
const ALONGSIDE = /^(UL|OL|PRE|BLOCKQUOTE)$|code-panel|table-wrap|practice/;

// A margin card floats from where it sits in the text, below the idea it explains. Lift it level with that idea, never over the card above it.
function liftMarginCards(body: HTMLElement) {
  const cards = [...body.querySelectorAll<HTMLElement>(":is(.part-panel, .chapter-lead) > :is(.formal, .card.check)")];
  for (const card of cards) card.style.marginTop = "";
  let floor = -Infinity;
  for (const card of cards) {
    if (getComputedStyle(card).float !== "right") continue;
    let anchor: Element | null = null;
    for (let sibling = card.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
      if (sibling.tagName === "P" && !sibling.classList.contains("part-group")) { anchor = sibling; break; }
      if (!ALONGSIDE.test(sibling.tagName) && !ALONGSIDE.test(sibling.className)) break;
      anchor = sibling;
    }
    const top = card.getBoundingClientRect().top;
    const lift = anchor ? Math.max(0, Math.min(top - anchor.getBoundingClientRect().top, top - floor)) : 0;
    if (lift > 0) card.style.marginTop = `${-lift}px`;
    floor = card.getBoundingClientRect().bottom + 20;
  }
}

export function SectionSwitch({ courseId, chapterId, stepIds, intro, parts, session, next }: { courseId: string; chapterId: string; stepIds: string[]; intro: ReactNode; parts: SectionPart[]; session: Hop | null; next: Hop | null }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const menu = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLElement>(null);
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
      const hit = parts.findIndex((part) => part.slug === id || part.group?.slug === id || part.ids.includes(id));
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

  // Text reflows when the page resizes, fonts load or a check opens its answer, so the cards are placed again each time.
  // Moving a card never resizes the blocks watched here, so placing them cannot set the observer off again.
  useEffect(() => {
    const article = body.current;
    if (!article) return;
    const observer = new ResizeObserver(() => liftMarginCards(article));
    for (const child of article.querySelectorAll(":is(.part-panel, .chapter-lead) > *")) observer.observe(child);
    return () => observer.disconnect();
  }, [index]);

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
  const siblings = current.group ? parts.filter((part) => part.group?.slug === current.group?.slug) : [];
  // Practice lives in the session, so it is one step from any page of the reading.
  const jump = session && (
    <Link className="section-session" href={session.href}>
      <Icon name="arrow" />
      <span>Go to the guided session</span>
    </Link>
  );
  const list = (
    <ol>
      {parts.map((part, item) => {
        const opensGroup = part.group && part.group.slug !== parts[item - 1]?.group?.slug;
        return (
          <li key={part.slug} className={[done.includes(part.title) ? "is-grown" : "", part.group ? "is-sub" : ""].join(" ").trim() || undefined}>
            {opensGroup && <p className="section-group"><Inline text={part.group!.title} /></p>}
            <button type="button" aria-current={item === index ? "location" : undefined} onClick={() => show(item)}>
              <LeafMark className="stem-node" state={nodeState(item)} />
              <span>{part.label ? <Inline text={part.label} /> : part.group?.title === part.title ? "Overview" : <Inline text={part.title} />}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
  const listWithJump = (
    <>
      {jump}
      {list}
    </>
  );

  return (
    <div className="reader">
      {parts.length > 1 ? (
        <nav className="section-stem parts" aria-label="Sections of this chapter">{listWithJump}</nav>
      ) : <span className="section-solo">{jump}</span>}
      {parts.length > 1 && (
        <details className="section-menu" ref={menu}>
          <summary>
            <b><Inline text={current.title} /></b>
            <span>Section {index + 1} of {parts.length}</span>
            <Icon name="down" />
          </summary>
          <div className="section-menu-list">{listWithJump}</div>
        </details>
      )}
      <article className="reader-body" ref={body}>
        {index === 0 && intro && <div className="chapter-lead">{intro}</div>}
        <section className="part-panel" id="chapter-part">
          {current.group && current.group.title !== current.title && (
            <p className="part-group">
              <Inline text={current.group.title} />
              <span>Part {siblings.indexOf(current) + 1} of {siblings.length}</span>
            </p>
          )}
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
