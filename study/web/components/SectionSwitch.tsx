"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Inline } from "@/lib/inline";

type Group = { title: string; ids: string[]; body: ReactNode };
type Part = { title: string; ids: string[]; intro: ReactNode; groups: Group[] };
type Step = { kicker: string; title: string };

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

function Pager({
  name,
  previous,
  next,
  onPrevious,
  onNext,
}: {
  name: string;
  previous: Step | null;
  next: Step | null;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (!previous && !next) return null;
  return (
    <nav className="pager" aria-label={name}>
      {previous && (
        <button type="button" className="pager-link pager-prev" onClick={onPrevious}>
          <span className="pager-label">{previous.kicker}</span>
          <span className="pager-line">
            <span className="pager-arrow" aria-hidden="true" />
            <span className="pager-title"><Inline text={previous.title} /></span>
          </span>
        </button>
      )}
      {next && (
        <button type="button" className="pager-link pager-next" onClick={onNext}>
          <span className="pager-label">{next.kicker}</span>
          <span className="pager-line">
            <span className="pager-title"><Inline text={next.title} /></span>
            <span className="pager-arrow" aria-hidden="true" />
          </span>
        </button>
      )}
    </nav>
  );
}

export function SectionSwitch({ intro, parts }: { intro: ReactNode; parts: Part[] }) {
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

  function showGroup(next: number) {
    setGroupIndex(next);
    scrollToId(`chapter-group-${next}`);
  }

  const current = parts[index] ?? parts[0];
  const previous = parts[index - 1];
  const upcoming = parts[index + 1];
  const groups = current.groups;
  const activeGroup = groups.length === 0 ? 0 : Math.min(groupIndex, groups.length - 1);
  const previousGroup = groups[activeGroup - 1];
  const nextGroup = groups[activeGroup + 1];

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
        <Pager
          name="מעבר בין תת-סעיפים"
          previous={previousGroup ? { kicker: "תת-הסעיף הקודם", title: previousGroup.title } : null}
          next={nextGroup ? { kicker: "תת-הסעיף הבא", title: nextGroup.title } : null}
          onPrevious={() => showGroup(activeGroup - 1)}
          onNext={() => showGroup(activeGroup + 1)}
        />
        <Pager
          name="מעבר בין סעיפים"
          previous={previous ? { kicker: "הסעיף הקודם", title: previous.title } : null}
          next={upcoming ? { kicker: "הסעיף הבא", title: upcoming.title } : null}
          onPrevious={() => show(index - 1)}
          onNext={() => show(index + 1)}
        />
      </section>
    </>
  );
}
