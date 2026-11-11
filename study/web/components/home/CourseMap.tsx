"use client";

import Link from "next/link";
import { LeafMark } from "./LeafMark";
import { Mixed } from "@/lib/bidi";
import { courseStates, hasStarted, hrefOf, useProgress, type ChapterInfo, type ChapterState } from "@/lib/progress";

type Part = { title: string; lang: string; summary: string; chapters: ChapterInfo[] };

export function rowNote(state: ChapterState, started: boolean, solved: number, total: number) {
  const tally = solved > 0 && state !== "done" ? `${solved} of ${total} solved` : "";
  if (state === "done") return "Done";
  if (state === "here") return tally || (started ? "Continue here" : "Start here");
  if (state === "read") return tally ? `Read, ${tally}` : "Read";
  if (state === "locked") return "Locked";
  return tally;
}

function Row({ chapter, state, started, solved }: { chapter: ChapterInfo; state: ChapterState; started: boolean; solved: number }) {
  // A review the student is already past is optional: it reads as grown, but only the steps they did are counted.
  const optional = chapter.kind === "bridge" && state === "read";
  const note = optional ? (solved > 0 ? `Optional, ${solved} of ${chapter.stepIds.length} done` : "Optional") : rowNote(state, started, solved, chapter.stepIds.length);
  return (
    <li className={state === "done" || state === "read" ? "is-grown" : undefined}>
      <Link className={chapter.kind === "bridge" ? "gh-row is-review" : "gh-row"} href={hrefOf(chapter)} aria-current={state === "here" ? "step" : undefined}>
        <LeafMark className="gh-row-mark" state={state} />
        <span className="gh-row-num">{chapter.kind === "bridge" ? null : chapter.num}</span>
        <span className="gh-row-title"><Mixed text={chapter.title} /></span>
        {note && <span className="gh-row-note">{note}</span>}
      </Link>
    </li>
  );
}

export function CourseMap({ courseId, parts, finale, chapters }: { courseId: string; parts: Part[]; finale: ChapterInfo[]; chapters: ChapterInfo[] }) {
  const progress = useProgress(courseId);
  const states = courseStates(chapters, progress);
  const stateOf = (chapter: ChapterInfo) => states[chapter.pos];
  const started = hasStarted(progress);
  const row = (chapter: ChapterInfo) => (
    <Row
      key={chapter.id}
      chapter={chapter}
      state={stateOf(chapter)}
      started={started}
      solved={chapter.stepIds.filter((id) => progress.solved.includes(id)).length}
    />
  );
  const grownClass = (list: ChapterInfo[]) => {
    const grown = list.every((chapter) => {
      const state = stateOf(chapter);
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
