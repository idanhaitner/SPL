"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
            <span className="fold-toggle-label">
              <Inline text={group.title} />
            </span>
          </button>
          {open[index] && <div className="fold-body">{group.body}</div>}
        </section>
      ))}
    </>
  );
}

function DirectionMark({ way }: { way: "back" | "forward" }) {
  const ltr = way === "back" ? "←" : "→";
  const rtl = way === "back" ? "→" : "←";
  return (
    <span aria-hidden="true">
      <span className="rtl:hidden">{ltr}</span>
      <span className="hidden rtl:inline">{rtl}</span>
    </span>
  );
}

function SectionPop({
  title,
  side,
  onClick,
}: {
  title: string;
  side: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = side === "prev";
  return (
    <button type="button" className={`section-pop is-${side}`} onClick={onClick}>
      <span className="section-pop-go">
        <DirectionMark way={isPrev ? "back" : "forward"} />
      </span>
      <span className="section-pop-copy">
        <span className="section-pop-kicker">{isPrev ? "Previous section" : "Next section"}</span>
        <span className="section-pop-title">
          <Inline text={title} />
        </span>
      </span>
    </button>
  );
}

function ChapterCard({ chapter, side }: { chapter: ChapterHop; side: "prev" | "next" }) {
  const isPrev = side === "prev";
  const copy = (
    <span className="chapter-hop-copy">
      <span className="chapter-hop-kicker">{isPrev ? "Previous chapter" : "Next chapter"}</span>
      <span className="chapter-hop-title">
        <Inline text={chapter.title} />
      </span>
    </span>
  );
  const go = (
    <span className="chapter-hop-go">
      {isPrev ? (
        <>
          <DirectionMark way="back" />
          Chapter {chapter.num}
        </>
      ) : (
        <>
          Chapter {chapter.num}
          <DirectionMark way="forward" />
        </>
      )}
    </span>
  );
  return (
    <Link className={`chapter-hop is-${side}`} href={chapter.href}>
      {isPrev ? (
        <>
          {go}
          {copy}
        </>
      ) : (
        <>
          {copy}
          {go}
        </>
      )}
    </Link>
  );
}

export function ReadingFooter({
  sectionIndex,
  sectionCount,
  previousSection,
  nextSection,
  onPreviousSection,
  onNextSection,
  previousChapter,
  nextChapter,
}: {
  sectionIndex?: number | null;
  sectionCount?: number;
  previousSection?: string | null;
  nextSection?: string | null;
  onPreviousSection?: () => void;
  onNextSection?: () => void;
  previousChapter?: ChapterHop | null;
  nextChapter: ChapterHop | null;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const hasPrevSection = Boolean(previousSection && onPreviousSection);
  const hasNextSection = Boolean(nextSection && onNextSection);
  const hasSectionNav = hasPrevSection || hasNextSection;
  const showChapters = Boolean((previousChapter || nextChapter) && !hasNextSection);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node || !hasSectionNav) return;
    const observer = new IntersectionObserver(
      ([entry]) => setReady(entry.isIntersecting),
      { rootMargin: "0px 0px -72px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      setReady(false);
    };
  }, [hasSectionNav, previousSection, nextSection, sectionIndex]);

  if (!hasSectionNav && !showChapters) return null;

  const showCount = sectionCount != null && sectionCount > 1 && sectionIndex != null;

  return (
    <nav className="chapter-foot" aria-label="Continue reading">
      {hasSectionNav && <div ref={anchorRef} className="chapter-foot-anchor" />}
      {hasSectionNav && (
        <div className={`section-pops${ready ? " is-ready" : ""}`}>
          {hasPrevSection && (
            <SectionPop title={previousSection!} side="prev" onClick={onPreviousSection!} />
          )}
          {hasNextSection && (
            <SectionPop title={nextSection!} side="next" onClick={onNextSection!} />
          )}
        </div>
      )}
      {showChapters && (
        <>
          {showCount && (
            <div className="foot-meta">
              <span>Section {sectionIndex! + 1} of {sectionCount}</span>
              <span className="foot-done">End of chapter</span>
            </div>
          )}
          <div className="chapter-hops">
            {previousChapter && <ChapterCard chapter={previousChapter} side="prev" />}
            {nextChapter && <ChapterCard chapter={nextChapter} side="next" />}
          </div>
        </>
      )}
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
    scrollToId(parts.length > 1 ? "chapter-sections" : "chapter-part");
  }

  const current = parts[index] ?? parts[0];
  const previous = parts[index - 1];
  const upcoming = parts[index + 1];
  const groups = current.groups;
  const activeGroup = groups.length === 0 ? 0 : Math.min(groupIndex, groups.length - 1);
  const hasPartsNav = parts.length > 1;

  return (
    <>
      {intro && (
        <div className="chapter-lead">
          <p className="chapter-lead-kicker">Chapter overview</p>
          {intro}
        </div>
      )}
      {hasPartsNav && (
        <nav className="parts" id="chapter-sections" aria-label="Sections">
          {parts.map((part, item) => (
            <button
              type="button"
              key={`${part.title}-${item}`}
              aria-current={item === index ? "true" : undefined}
              onClick={(event) => {
                show(item);
                event.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest" });
              }}
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
          sectionIndex={index}
          sectionCount={parts.length}
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
