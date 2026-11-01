"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/home/Icon";
import { LeafBlade } from "@/components/home/LeafShape";
import { Mixed } from "@/lib/bidi";
import type { GlossaryEntry } from "@/lib/types";

export type GlossaryChapter = { id: string; num: number; title: string; entries: GlossaryEntry[] };
export type GlossaryPart = { title: string; lang: string; chapters: GlossaryChapter[] };

function Term({ entry, chapterTitle }: { entry: GlossaryEntry; chapterTitle?: string }) {
  return (
    <div className="glossary-term" id={entry.anchor}>
      <svg className="glossary-term-leaf" viewBox="0 0 150 90" aria-hidden="true">
        <g transform="translate(6 62) rotate(-14)"><LeafBlade size={140} /></g>
      </svg>
      <dt>
        {chapterTitle ? (
          <Link href={`/topics/${entry.topic}/`} prefetch={false} aria-label={`${entry.term}, open the chapter ${chapterTitle}`}>
            <Mixed text={entry.term} />
          </Link>
        ) : (
          <Mixed text={entry.term} />
        )}
      </dt>
      <dd><Mixed text={entry.definition} /></dd>
    </div>
  );
}

const partAnchor = (index: number) => `glossary-part-${index + 1}`;

export function GlossaryBrowser({ parts, loose, count }: { parts: GlossaryPart[]; loose: GlossaryEntry[]; count: number }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = (entry: GlossaryEntry) => !needle || entry.term.toLowerCase().includes(needle) || entry.definition.toLowerCase().includes(needle);

  const shown = useMemo(
    () =>
      parts.map((part) => ({
        ...part,
        chapters: part.chapters.map((chapter) => ({ ...chapter, entries: chapter.entries.filter(matches) })).filter((chapter) => chapter.entries.length > 0),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parts, needle],
  );
  const shownLoose = loose.filter(matches);
  const total = shown.reduce((sum, part) => sum + part.chapters.reduce((inner, chapter) => inner + chapter.entries.length, 0), 0) + shownLoose.length;

  return (
    <>
      <div className="glossary-tools">
        <div className="glossary-tools-row">
          <div className="glossary-filter">
            <label className="sr-only" htmlFor="glossary-q">Find a term</label>
            <input id="glossary-q" type="search" placeholder="Find a term" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} />
            {query && (
              <button type="button" aria-label="Clear" onClick={() => setQuery("")}><Icon name="x" /></button>
            )}
          </div>
          <nav className="glossary-jump" aria-label="Parts of the glossary">
            {shown.map((part, index) => part.chapters.length > 0 && <a key={part.title} href={`#${partAnchor(index)}`}>{part.title}</a>)}
          </nav>
          <p className="glossary-count" aria-live="polite">{needle ? `${total} of ${count}` : `${count} terms`}</p>
        </div>
      </div>

      <div className="glossary-list">
        {total === 0 && (
          <div className="glossary-empty">
            <h2>Nothing matches &ldquo;{query.trim()}&rdquo;</h2>
            <p>Try a shorter word, or the Search at the top, which also looks inside the chapters.</p>
            <button type="button" className="gh-pill" onClick={() => setQuery("")}>Show all terms</button>
          </div>
        )}
        {shown.map((part, index) => part.chapters.length > 0 && (
          <section className="glossary-part" id={partAnchor(index)} key={part.title}>
            <header className="glossary-part-head">
              <div className="gh-arch" />
              <h2>{part.title}</h2>
              {part.lang && <p>{part.lang}</p>}
            </header>
            {part.chapters.map((chapter) => (
              <section className="glossary-chapter" id={`glossary-${chapter.id}`} key={chapter.id}>
                <div className="glossary-chapter-head">
                  <svg viewBox="0 0 64 64" aria-hidden="true">
                    <g className="gh-leaf is-ahead" transform="translate(3 61) rotate(-45)"><g className="glossary-chapter-leaf"><LeafBlade size={80} /></g></g>
                    <text x="34" y="37" textAnchor="middle">{chapter.num}</text>
                  </svg>
                  <h3><Link href={`/topics/${chapter.id}/`} prefetch={false}><Mixed text={chapter.title} /></Link></h3>
                </div>
                <dl>
                  {chapter.entries.map((entry) => <Term key={entry.anchor} entry={entry} chapterTitle={chapter.title} />)}
                </dl>
              </section>
            ))}
          </section>
        ))}
        {shownLoose.length > 0 && (
          <section className="glossary-part">
            <header className="glossary-part-head"><div className="gh-arch" /><h2>Other terms</h2></header>
            <section className="glossary-chapter is-loose">
              <dl>{shownLoose.map((entry) => <Term key={entry.anchor} entry={entry} />)}</dl>
            </section>
          </section>
        )}
      </div>
    </>
  );
}
