"use client";

import { useEffect, useState } from "react";
import { Mixed } from "@/lib/bidi";
import { readProgress, writeProgress } from "@/lib/progress";

type Props = {
  id: string;
  courseId: string;
  kind: string;
  summary: string;
  statement: React.ReactNode;
  hints: React.ReactNode[];
  solution: React.ReactNode | null;
  checkIds?: string[];
};

export function PracticeCard({ id, courseId, kind, summary, statement, hints, solution, checkIds = [] }: Props) {
  const worked = kind === "worked";
  const quiz = checkIds.length > 0;
  const quizKey = checkIds.join("|");
  const [open, setOpen] = useState(worked);
  const [openHints, setOpenHints] = useState(0);
  const [showSolution, setShowSolution] = useState(worked);
  const [solved, setSolved] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const wanted = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (wanted === id) setOpen(true);
  }, [id]);

  useEffect(() => {
    const sync = () => setSolved(readProgress(courseId).solved.includes(id));
    sync();
    window.addEventListener("study-progress", sync);
    return () => window.removeEventListener("study-progress", sync);
  }, [courseId, id]);

  useEffect(() => {
    if (!quiz) return;
    const onCheck = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; correct: boolean }>).detail;
      if (!detail || !quizKey.split("|").includes(detail.id)) return;
      setResults((current) => ({ ...current, [detail.id]: detail.correct }));
    };
    window.addEventListener("study-check", onCheck);
    return () => window.removeEventListener("study-check", onCheck);
  }, [quiz, quizKey]);

  useEffect(() => {
    if (!quiz) return;
    const ids = quizKey.split("|").filter(Boolean);
    const anyWrong = ids.some((item) => results[item] === false);
    const allCorrect = ids.every((item) => results[item] === true);
    if (!anyWrong && !allCorrect) return;
    const progress = readProgress(courseId);
    const has = progress.solved.includes(id);
    if (allCorrect === has) return;
    const solvedIds = allCorrect ? [...progress.solved, id] : progress.solved.filter((item) => item !== id);
    writeProgress(courseId, { ...progress, solved: solvedIds });
  }, [results, quiz, quizKey, courseId, id]);

  function toggleSolved() {
    const progress = readProgress(courseId);
    const next = progress.solved.includes(id)
      ? progress.solved.filter((item) => item !== id)
      : [...progress.solved, id];
    writeProgress(courseId, { ...progress, solved: next });
  }

  const hintLabel =
    openHints === 0
      ? `Show hint (1 of ${hints.length})`
      : openHints < hints.length
        ? `Next hint (${openHints + 1} of ${hints.length})`
        : "Hints are open";

  if (!worked && !open) {
    return (
      <article className={`card practice is-folded${solved ? " is-solved" : ""}`} id={id}>
        <button type="button" className="fold-row" aria-expanded={false} onClick={() => setOpen(true)}>
          <span className={`mark${solved ? " is-done" : ""}`} aria-hidden="true" />
          <span className="fold-line"><Mixed text={summary} /></span>
          <span className="fold-open">Open</span>
        </button>
      </article>
    );
  }

  return (
    <article className={`card practice${solved ? " is-solved" : ""}`} id={id}>
      <header className="card-head">
        {!worked && (
          <div className="card-tools">
            <button type="button" onClick={() => setOpen(false)}>Close</button>
            {quiz ? (
              solved ? <span className="solved-flag">Solved</span> : null
            ) : (
              <button type="button" className={solved ? "is-on" : ""} onClick={toggleSolved} aria-pressed={solved}>
                {solved ? "Solved" : "Mark solved"}
              </button>
            )}
          </div>
        )}
      </header>
      <h3 className="practice-title">{worked && <span className="type">Example</span>}<Mixed text={summary} /></h3>
      <div className="statement">{statement}</div>
      {hints.slice(0, openHints).map((hint, index) => (
        <div className="reveal" key={index}>
          <div className="hint">
            <p className="lead-in">Hint {index + 1} of {hints.length}</p>
            {hint}
          </div>
        </div>
      ))}
      {!quiz && (hints.length > 0 || solution) && !worked && (
        <div className="actions">
          {hints.length > 0 && (
            <button type="button" onClick={() => setOpenHints((count) => Math.min(hints.length, count + 1))} disabled={openHints >= hints.length}>
              {hintLabel}
            </button>
          )}
          {solution && (
            <button type="button" onClick={() => setShowSolution((open) => !open)} aria-expanded={showSolution}>
              {showSolution ? "Hide solution" : "Show solution"}
            </button>
          )}
        </div>
      )}
      {!quiz && solution && showSolution && (
        <div className="reveal">
          <div className="solution">
            <p className="lead-in">Solution</p>
            {solution}
          </div>
        </div>
      )}
    </article>
  );
}
