"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/home/Icon";
import { Mixed } from "@/lib/bidi";
import { isRead, useProgress, type ChapterInfo } from "@/lib/progress";
import { openStep, readSession, writeSession } from "@/lib/session-store";
import { StepStem, type StepMeta, type StepStatus } from "./StepStem";

type Hop = { href: string; title: string };

export function Stepper({ courseId, chapter, steps, rendered, next }: { courseId: string; chapter: ChapterInfo; steps: StepMeta[]; rendered: Record<string, ReactNode>; next: Hop | null }) {
  const ids = useMemo(() => steps.map((step) => step.id), [steps]);
  const progress = useProgress(courseId);
  const solved = progress.solved;
  // null until the browser's saved place has been read; -1 is the intro.
  const [index, setIndex] = useState<number | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    const stored = readSession(courseId, chapter.id);
    const requested = new URLSearchParams(window.location.search).get("step");
    setSkipped(stored.skipped);
    const fresh = !requested && !stored.current && stored.skipped.length === 0 && !ids.some((id) => solvedNow(courseId, id));
    setIndex(fresh ? -1 : openStep(ids, stored, readSolved(courseId), requested));
  }, [courseId, chapter.id, ids]);

  useEffect(() => {
    if (index === null || index < 0) return;
    writeSession(courseId, chapter.id, { current: ids[index], skipped });
  }, [index, skipped, courseId, chapter.id, ids]);

  useEffect(() => {
    if (moved.current) heading.current?.focus({ preventScroll: true });
  }, [index]);

  function go(target: number) {
    moved.current = true;
    setIndex(Math.max(0, Math.min(target, ids.length)));
    window.scrollTo({ top: 0 });
  }

  if (index === null) return <div className="session-loading" />;

  const finished = index >= ids.length;
  const current = index >= 0 && !finished ? steps[index] : null;
  const isSolved = current ? solved.includes(current.id) : false;
  const statusOf = (id: string, at: number): StepStatus => (solved.includes(id) ? "done" : at === index ? "current" : skipped.includes(id) ? "skipped" : "upcoming");
  const doneCount = ids.filter((id) => solved.includes(id)).length;
  const open = steps.filter((step) => !solved.includes(step.id));

  return (
    <div className="session">
      <div className="session-bar">
        <div className="session-bar-row">
          <Link className="session-back" href={`/topics/${chapter.id}/`}>Chapter {chapter.num}</Link>
          <span className="session-count">{current ? `Step ${index + 1} of ${ids.length}` : finished ? "Session finished" : `${ids.length} steps`}</span>
          <span className="gh-nav-spacer" />
          {current && (
            <>
              <button type="button" className="session-quiet" onClick={() => go(index - 1)} disabled={index === 0}>Back</button>
              {!isSolved && (
                <button
                  type="button"
                  className="session-quiet"
                  onClick={() => {
                    if (!skipped.includes(current.id)) setSkipped([...skipped, current.id]);
                    go(index + 1);
                  }}
                >
                  Skip for now
                </button>
              )}
              {isSolved ? (
                <button type="button" className="gh-btn is-compact" onClick={() => go(index + 1)}>
                  {index === ids.length - 1 ? "Finish" : "Next"}
                  <Icon name="arrow" />
                </button>
              ) : (
                <button type="button" className="gh-pill" disabled title="Answer this step to go on">Next</button>
              )}
            </>
          )}
        </div>
        <StepStem steps={steps} statusOf={statusOf} index={index} onGo={go} />
      </div>

      {index === -1 && (
        <div className="session-reading session-intro">
          <h1 ref={heading} tabIndex={-1}>Guided session: <Mixed text={chapter.title} /></h1>
          <p>This session teaches nothing new. It has you use what the chapter taught, one step at a time. If a step feels unfamiliar, it links back to the chapter.</p>
          <p>{ids.length} steps. Skip any of them and come back later. Your place is saved in this browser.</p>
          <button type="button" className="gh-btn" onClick={() => go(0)}>Start step 1<Icon name="arrow" /></button>
        </div>
      )}

      {current && (
        <div key={current.id} className={current.kind === "exercise" ? "session-code" : "session-reading"}>
          <h2 className="sr-only" ref={heading} tabIndex={-1}>Step {index + 1} of {ids.length}</h2>
          {rendered[current.id]}
          {current.kind === "question" && (
            <p className="session-reread"><Link href={`/topics/${chapter.id}/`}>Reread: <Mixed text={chapter.title} /></Link></p>
          )}
        </div>
      )}

      {finished && (
        <div className="session-reading session-finish">
          <h1 ref={heading} tabIndex={-1}>{open.length === 0 ? "Session finished." : "You reached the end."}</h1>
          <p>{doneCount} of {ids.length} steps solved.</p>
          {open.length > 0 && (
            <>
              <p>These are still open:</p>
              <ul className="session-open">
                {open.map((step) => (
                  <li key={step.id}><button type="button" className="gh-quiet" onClick={() => go(ids.indexOf(step.id))}><Mixed text={step.title} /></button></li>
                ))}
              </ul>
            </>
          )}
          {!isRead(chapter, progress) && <p>You haven&rsquo;t finished reading this chapter yet. <Link href={`/topics/${chapter.id}/`}>Open the chapter</Link></p>}
          {next ? (
            <Link className="gh-btn" href={next.href}>Next chapter: <Mixed text={next.title} /><Icon name="arrow" /></Link>
          ) : (
            <Link className="gh-btn" href="/">Back to the course<Icon name="arrow" /></Link>
          )}
        </div>
      )}
    </div>
  );
}

function readSolved(courseId: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(`study:${courseId}`) ?? "null");
    return Array.isArray(parsed?.solved) ? parsed.solved.filter((id: unknown) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

const solvedNow = (courseId: string, id: string) => readSolved(courseId).includes(id);
