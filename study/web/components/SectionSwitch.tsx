"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Inline } from "@/lib/inline";

type Group = { title: string; ids: string[]; body: ReactNode };
type Part = { title: string; ids: string[]; intro: ReactNode; groups: Group[] };
export type ChapterHop = { href: string; title: string; num: string };

function hashId() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToId(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  });
}

function Folds({
  groups,
  active,
  onOpen,
}: {
  groups: Group[];
  active: number;
  onOpen: (index: number) => void;
}) {
  const [open, setOpen] = useState<boolean[]>(() => groups.map((_, index) => index === 0 || index === active));

  useEffect(() => {
    setOpen((current) => (current[active] ? current : current.map((value, index) => (index === active ? true : value))));
  }, [active]);

  return (
    <>
      {groups.map((group, index) => (
        <section
          className={`fold${open[index] ? " is-open" : ""}`}
          id={`chapter-group-${index}`}
          key={`${group.title}-${index}`}
        >
          <button
            type="button"
            className="fold-toggle"
            aria-expanded={open[index]}
            onClick={() => {
              onOpen(index);
              setOpen((current) => current.map((value, item) => (item === index ? !value : value)));
            }}
          >
            <Inline text={group.title} />
          </button>
          {open[index] && <div className="fold-body">{group.body}</div>}
        </section>
      ))}
    </>
  );
}

type Hop = { kicker: string; title: string; num?: string; href?: string; onClick?: () => void };

function FootControl({ hop, side }: { hop: Hop; side: "prev" | "next" }) {
  const className = `foot-link foot-${side}`;
  const body = (
    <>
      <span className="foot-kicker">{hop.kicker}</span>
      <span className="foot-line">
        {side === "prev" && <span className="foot-arrow" aria-hidden="true" />}
        {hop.num && <span className="foot-num">{hop.num}</span>}
        <span className="foot-title"><Inline text={hop.title} /></span>
        {side === "next" && <span className="foot-arrow" aria-hidden="true" />}
      </span>
    </>
  );
  if (hop.href) return <Link className={className} href={hop.href}>{body}</Link>;
  return (
    <button type="button" className={className} onClick={hop.onClick}>
      {body}
    </button>
  );
}

function Band({
  tone,
  previous,
  next,
}: {
  tone: "sections" | "chapters";
  previous: Hop | null;
  next: Hop | null;
}) {
  if (!previous && !next) return null;
  return (
    <div className={`foot-band foot-${tone}`}>
      {previous && <FootControl hop={previous} side="prev" />}
      {next && <FootControl hop={next} side="next" />}
    </div>
  );
}

export function ReadingFooter({
  previousSection,
  nextSection,
  onPreviousSection,
  onNextSection,
  previousChapter,
  nextChapter,
}: {
  previousSection?: string | null;
  nextSection?: string | null;
  onPreviousSection?: () => void;
  onNextSection?: () => void;
  previousChapter: ChapterHop | null;
  nextChapter: ChapterHop | null;
}) {
  const sectionPrev = previousSection
    ? { kicker: "הסעיף הקודם", title: previousSection, onClick: onPreviousSection }
    : null;
  const sectionNext = nextSection
    ? { kicker: "הסעיף הבא", title: nextSection, onClick: onNextSection }
    : null;
  const chapterPrev = previousChapter
    ? { kicker: "הפרק הקודם", title: previousChapter.title, num: previousChapter.num, href: previousChapter.href }
    : null;
  const chapterNext = nextChapter
    ? { kicker: "הפרק הבא", title: nextChapter.title, num: nextChapter.num, href: nextChapter.href }
    : null;
  if (!sectionPrev && !sectionNext && !chapterPrev && !chapterNext) return null;
  return (
    <nav className="chapter-foot" aria-label="המשך הקריאה">
      <Band tone="sections" previous={sectionPrev} next={sectionNext} />
      <Band tone="chapters" previous={chapterPrev} next={chapterNext} />
    </nav>
  );
}

export function SectionSwitch({
  intro,
  parts,
  previousChapter,
  nextChapter,
}: {
  intro: ReactNode;
  parts: Part[];
  previousChapter: ChapterHop | null;
  nextChapter: ChapterHop | null;
}) {
  const [index, setIndex] = useState(0);
  const [groupIndex, setGroupIndex] = useState(0);

  useEffect(() => {
    const apply = () => {
      const id = hashId();
      if (!id) return;
      const hit = parts.findIndex((part) => part.ids.includes(id) || part.groups.some((group) => group.ids.includes(id)));
      if (hit < 0) return;
      setIndex(hit);
      const groupHit = parts[hit].groups.findIndex((group) => group.ids.includes(id));
      if (groupHit >= 0) setGroupIndex(groupHit);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [parts]);

  function show(next: number) {
    setIndex(next);
    setGroupIndex(0);
    scrollToId("chapter-part");
  }

  const current = parts[index] ?? parts[0];
  const previous = parts[index - 1];
  const upcoming = parts[index + 1];
  const groups = current.groups;
  const activeGroup = groups.length === 0 ? 0 : Math.min(groupIndex, groups.length - 1);

  return (
    <>
      {intro}
      {parts.length > 1 && (
        <nav className="parts" aria-label="סעיפים">
          {parts.map((part, item) => (
            <button
              type="button"
              key={`${part.title}-${item}`}
              aria-current={item === index ? "true" : undefined}
              onClick={() => show(item)}
            >
              <Inline text={part.title} />
            </button>
          ))}
        </nav>
      )}
      <section className="part-panel" id="chapter-part">
        <h2><Inline text={current.title} /></h2>
        {current.intro}
        {groups.length > 0 && (
          <Folds key={index} groups={groups} active={activeGroup} onOpen={setGroupIndex} />
        )}
        <ReadingFooter
          previousSection={previous?.title}
          nextSection={upcoming?.title}
          onPreviousSection={() => show(index - 1)}
          onNextSection={() => show(index + 1)}
          previousChapter={previousChapter}
          nextChapter={nextChapter}
        />
      </section>
    </>
  );
}
