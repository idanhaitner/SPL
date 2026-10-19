"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Inline } from "@/lib/inline";

type Group = { title: string; ids: string[]; body: ReactNode };
type Part = { title: string; ids: string[]; intro: ReactNode; groups: Group[] };

function hashId() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

function Folds({ groups, revealId }: { groups: Group[]; revealId: string }) {
  const [open, setOpen] = useState<boolean[]>(() => groups.map((_, index) => index === 0));

  useEffect(() => {
    if (!revealId) return;
    const hit = groups.findIndex((group) => group.ids.includes(revealId));
    if (hit < 0) return;
    setOpen((current) => (current[hit] ? current : current.map((value, index) => (index === hit ? true : value))));
  }, [revealId, groups]);

  return (
    <>
      {groups.map((group, index) => (
        <section className={`fold${open[index] ? " is-open" : ""}`} key={`${group.title}-${index}`}>
          <button
            type="button"
            className="fold-toggle"
            aria-expanded={open[index]}
            onClick={() => setOpen((current) => current.map((value, item) => (item === index ? !value : value)))}
          >
            <Inline text={group.title} />
          </button>
          {open[index] && <div className="fold-body">{group.body}</div>}
        </section>
      ))}
    </>
  );
}

export function SectionSwitch({ intro, parts }: { intro: ReactNode; parts: Part[] }) {
  const [index, setIndex] = useState(0);
  const [revealId, setRevealId] = useState("");

  useEffect(() => {
    const apply = () => {
      const id = hashId();
      setRevealId(id);
      if (!id) return;
      const hit = parts.findIndex((part) => part.ids.includes(id) || part.groups.some((group) => group.ids.includes(id)));
      if (hit >= 0) setIndex(hit);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [parts]);

  function show(next: number) {
    setIndex(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      document.getElementById("chapter-part")?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  const current = parts[index] ?? parts[0];
  const upcoming = parts[index + 1];

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
        {current.groups.length > 0 && <Folds groups={current.groups} revealId={revealId} />}
        {parts.length > 1 && upcoming && (
          <button type="button" className="part-next" onClick={() => show(index + 1)}>
            <span>הסעיף הבא</span>
            <strong><Inline text={upcoming.title} /></strong>
          </button>
        )}
      </section>
    </>
  );
}
