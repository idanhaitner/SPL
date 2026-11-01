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

// A chapter's stretch of vine. It bows toward its leaf and leaves each row dead vertical, so any stretch meets the next one exactly.
function Vine({ num, state, grown, first, last }: { num: number; state: ChapterState; grown: boolean; first: boolean; last: boolean }) {
  const side = num % 2 ? -1 : 1;
  const bow = 52 + side * 6;
  const leaf: Leaf = { x: bow, y: 36, angle: side > 0 ? -28 : -152, along: 0, side };
  const here = state === "here";
  const above = first ? "" : `M52 0C52 24 ${bow} 24 ${bow} 36`;
  const below = last ? "" : `${first ? `M${bow} 36` : ""}C${bow} 48 52 48 52 72`;
  return (
    <svg className="gh-bed-vine" viewBox="0 0 104 72" aria-hidden="true">
      <path className={`gh-bed-stem${grown ? " is-grown" : ""}`} d={`${above}${below}`} pathLength={1} />
      <LeafShape leaf={leaf} size={here ? 52 : 46} state={state} num={num} numSize={here ? 16 : 15} index={num} delay={0} halo={`gh-halo-bed-${num}`} />
    </svg>
  );
}

function Row({ chapter, progress, next, started, run, total }: { chapter: ChapterInfo; progress: Progress; next: ChapterInfo | null; started: boolean; run: number; total: number }) {
  const state = chapterState(chapter, next, progress);
  const questions = chapter.stepIds.length;
  const solved = chapter.stepIds.filter((id) => progress.solved.includes(id)).length;
  const count = questions > 0 ? `${questions} ${questions === 1 ? "question" : "questions"}` : "";
  const note = rowNote(state, started, solved, questions) || count;
  return (
    <Link className={`gh-bed-row is-${state}`} href={`/topics/${chapter.id}`} aria-current={state === "here" ? "step" : undefined}>
      <Vine num={chapter.num} state={state} grown={chapter.num <= run} first={chapter.num === 1} last={chapter.num === total} />
      <span className="gh-bed-text">
        <span className="sr-only">Chapter {chapter.num}: </span>
        <span className="gh-bed-title"><Mixed text={chapter.title} /></span>
        {note && <span className="gh-bed-note">{note}</span>}
      </span>
      {state === "here" && <Icon name="arrow" />}
    </Link>
  );
}

// The course as one plant: a single vine runs down a single bed, and each part's name stays beside its stretch of it.
export function CourseBed({ courseId, parts, finale, chapters }: { courseId: string; parts: Part[]; finale: ChapterInfo[]; chapters: ChapterInfo[] }) {
  const progress = useProgress(courseId);
  const next = nextChapter(chapters, progress);
  const started = hasStarted(progress);
  // As on the hero's stem, the vine is lime only through the unbroken run of chapters opened from the start.
  const broken = chapters.findIndex((chapter) => !["done", "read"].includes(chapterState(chapter, next, progress)));
  const run = broken < 0 ? chapters.length : broken;
  const beds: Part[] = finale.length > 0 ? [...parts, { title: "Before the exam", lang: "", summary: "", chapters: finale }] : parts;
  return (
    <div className="gh-bed">
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
      {beds.map((part, index) => {
        const finished = part.chapters.filter((chapter) => chapterState(chapter, next, progress) === "done").length;
        const meta = [part.lang, finished > 0 ? `${finished} of ${part.chapters.length} done` : ""].filter(Boolean).join(" · ");
        const following = beds[index + 1]?.chapters[0];
        return (
          <section className="gh-bed-part" key={part.title} aria-label={part.title}>
            <div className="gh-bed-head">
              <h3>{part.title}</h3>
              {meta && <p className="gh-bed-lang">{meta}</p>}
              {part.summary && <p className="gh-bed-summary">{part.summary}</p>}
            </div>
            <div className="gh-bed-rows">
              {index > 0 && <span className={`gh-bed-gap${part.chapters[0].num <= run ? " is-grown" : ""}`} />}
              <ol>
                {part.chapters.map((chapter) => (
                  <li key={chapter.id}><Row chapter={chapter} progress={progress} next={next} started={started} run={run} total={chapters.length} /></li>
                ))}
              </ol>
              {following && <span className={`gh-bed-gap is-tail${following.num <= run ? " is-grown" : ""}`} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}
