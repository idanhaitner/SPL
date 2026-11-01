"use client";

import Link from "next/link";
import { rowNote } from "./CourseMap";
import { Icon } from "./Icon";
import { LeafBlade, LeafShape } from "./LeafShape";
import { Mixed } from "@/lib/bidi";
import { chapterState, hasStarted, nextChapter, useProgress, type ChapterInfo, type ChapterState, type Progress } from "@/lib/progress";
import type { Leaf } from "@/lib/stem";

type Part = { title: string; lang: string; summary: string; chapters: ChapterInfo[] };

const LEGEND: { state: ChapterState; label: string }[] = [
  { state: "ahead", label: "Not started" },
  { state: "read", label: "Read" },
  { state: "done", label: "Done" },
  { state: "here", label: "Next" },
];

// A chapter's stretch of vine. Rows are one height, so each stretch's S-curve meets the next one exactly.
function Vine({ num, state, grown }: { num: number; state: ChapterState; grown: boolean }) {
  const side = num % 2 ? -1 : 1;
  const leaf: Leaf = { x: 42, y: 42, angle: side > 0 ? -28 : -152, along: 0, side };
  const here = state === "here";
  return (
    <svg className="gh-bay-vine" viewBox="0 0 84 80" aria-hidden="true">
      <path className={`gh-bay-stem${grown ? " is-grown" : ""}`} d="M42 0C34 26 50 54 42 80" pathLength={1} />
      <LeafShape leaf={leaf} size={here ? 52 : 46} state={state} num={num} numSize={here ? 16 : 15} index={num} delay={0} halo={`gh-halo-bay-${num}`} />
    </svg>
  );
}

function Row({ chapter, progress, next, started, run }: { chapter: ChapterInfo; progress: Progress; next: ChapterInfo | null; started: boolean; run: number }) {
  const state = chapterState(chapter, next, progress);
  const solved = chapter.stepIds.filter((id) => progress.solved.includes(id)).length;
  const note = rowNote(state, started, solved, chapter.stepIds.length);
  return (
    <Link className={`gh-bay-row is-${state}`} href={`/topics/${chapter.id}`} aria-current={state === "here" ? "step" : undefined}>
      <Vine num={chapter.num} state={state} grown={chapter.num <= run} />
      <span className="gh-bay-text">
        <span className="sr-only">Chapter {chapter.num}: </span>
        <span className="gh-bay-title"><Mixed text={chapter.title} /></span>
        {note && <span className="gh-bay-note">{note}</span>}
      </span>
      {state === "here" && <Icon name="arrow" />}
    </Link>
  );
}

// The course as a glasshouse: one arched window per part, standing on one sill, each as tall as its part is long.
export function CourseBays({ courseId, parts, finale, chapters }: { courseId: string; parts: Part[]; finale: ChapterInfo[]; chapters: ChapterInfo[] }) {
  const progress = useProgress(courseId);
  const next = nextChapter(chapters, progress);
  const started = hasStarted(progress);
  // As on the hero's stem, the vine is lime only through the unbroken run of chapters opened from the start.
  const broken = chapters.findIndex((chapter) => !["done", "read"].includes(chapterState(chapter, next, progress)));
  const run = broken < 0 ? chapters.length : broken;
  return (
    <>
      <ul className="gh-legend" aria-label="What the leaf colors mean">
        {LEGEND.map(({ state, label }) => (
          <li key={state}>
            <svg viewBox="0 0 36 24" aria-hidden="true">
              <g className={`gh-leaf is-${state}`} transform="translate(0 13) rotate(-8)"><LeafBlade size={34} /></g>
            </svg>
            {label}
          </li>
        ))}
      </ul>
      {parts.map((part) => {
        const finished = part.chapters.filter((chapter) => chapterState(chapter, next, progress) === "done").length;
        return (
          <section className="gh-bay" key={part.title} aria-label={part.title}>
            <div className="gh-bay-head">
              <h3>{part.title}</h3>
              <p className="gh-bay-lang">{part.lang}{finished > 0 && ` · ${finished} of ${part.chapters.length} done`}</p>
              <p className="gh-bay-summary">{part.summary}</p>
            </div>
            <ol>
              {part.chapters.map((chapter) => (
                <li key={chapter.id}><Row chapter={chapter} progress={progress} next={next} started={started} run={run} /></li>
              ))}
            </ol>
          </section>
        );
      })}
      {finale.length > 0 && (
        <section className="gh-sill" aria-label="Before the exam">
          <h3>Before the exam</h3>
          <ol>
            {finale.map((chapter) => (
              <li key={chapter.id}><Row chapter={chapter} progress={progress} next={next} started={started} run={run} /></li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
