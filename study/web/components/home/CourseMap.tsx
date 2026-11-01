"use client";

import Link from "next/link";
import { Mixed } from "@/lib/bidi";
import { chapterState, hasStarted, nextChapter, useProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";

type Part = { title: string; lang: string; summary: string; chapters: ChapterInfo[] };

function Mark({ state }: { state: ChapterState }) {
  return (
    <svg className={`gh-row-mark is-${state}`} viewBox="0 0 24 24" aria-hidden="true">
      {state === "done" || state === "read" ? <path d="M3 21C2 10 9 3 21 3c1 12-6 19-18 18Z" /> : <circle cx="12" cy="12" r={state === "here" ? 8 : 5} />}
    </svg>
  );
}

function rowNote(state: ChapterState, started: boolean, solved: number, total: number) {
  const tally = solved > 0 && state !== "done" ? `${solved} of ${total} solved` : "";
  if (state === "done") return "Done";
  if (state === "here") return tally || (started ? "Continue here" : "Start here");
  if (state === "read") return tally ? `Read, ${tally}` : "Read";
  return tally;
}

function Row({ chapter, state, started, solved }: { chapter: ChapterInfo; state: ChapterState; started: boolean; solved: number }) {
  const note = rowNote(state, started, solved, chapter.stepIds.length);
  return (
    <li className={state === "done" || state === "read" ? "is-grown" : undefined}>
      <Link className="gh-row" href={`/topics/${chapter.id}`} aria-current={state === "here" ? "step" : undefined}>
        <Mark state={state} />
        <span className="gh-row-num">{chapter.num}</span>
        <span className="gh-row-title"><Mixed text={chapter.title} /></span>
        {note && <span className="gh-row-note">{note}</span>}
      </Link>
    </li>
  );
}

export function CourseMap({ courseId, parts, finale, chapters }: { courseId: string; parts: Part[]; finale: ChapterInfo[]; chapters: ChapterInfo[] }) {
  const progress = useProgress(courseId);
  const next = nextChapter(chapters, progress);
  const started = hasStarted(progress);
  const row = (chapter: ChapterInfo) => (
    <Row
      key={chapter.id}
      chapter={chapter}
      state={chapterState(chapter, next, progress)}
      started={started}
      solved={chapter.stepIds.filter((id) => progress.solved.includes(id)).length}
    />
  );
  const grownClass = (list: ChapterInfo[]) => {
    const grown = list.every((chapter) => {
      const state = chapterState(chapter, next, progress);
      return state === "done" || state === "read";
    });
    return grown ? "gh-rows is-grown" : "gh-rows";
  };
  return (
    <div className="gh-parts">
      {parts.map((part) => (
        <section className="gh-part" key={part.title} aria-label={part.title}>
          <div className="gh-part-info">
            <h3>{part.title}</h3>
            <p className="gh-part-lang">{part.lang}</p>
            <p>{part.summary}</p>
          </div>
          <ol className={grownClass(part.chapters)}>{part.chapters.map(row)}</ol>
        </section>
      ))}
      {finale.length > 0 && (
        <section className="gh-part" aria-label="Before the exam">
          <div className="gh-part-info">
            <h3>Before the exam</h3>
          </div>
          <ol className={grownClass(finale)}>{finale.map(row)}</ol>
        </section>
      )}
    </div>
  );
}
