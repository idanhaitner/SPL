"use client";

import { useEffect, useState } from "react";
import { Mixed } from "@/lib/bidi";
import { readProgress, useProgress, writeProgress } from "@/lib/progress";

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
  const [openHints, setOpenHints] = useState(0);
  const [showSolution, setShowSolution] = useState(worked);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const solved = useProgress(courseId).solved.includes(id);

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

  // Once every check has been answered correctly the problem stays solved, even if an answer is changed later.
  useEffect(() => {
    if (!quiz || worked) return;
    const ids = quizKey.split("|").filter(Boolean);
    if (!ids.every((item) => results[item] === true)) return;
    const progress = readProgress(courseId);
    if (!progress.solved.includes(id)) writeProgress(courseId, { ...progress, solved: [...progress.solved, id] });
  }, [results, quiz, worked, quizKey, courseId, id]);

  function toggleSolved() {
    const progress = readProgress(courseId);
    const next = progress.solved.includes(id) ? progress.solved.filter((item) => item !== id) : [...progress.solved, id];
    writeProgress(courseId, { ...progress, solved: next });
  }

  return (
    <article className={`card practice${worked ? " is-worked" : ""}`} id={id}>
      <h3 className="practice-title">{worked && "Worked example: "}<Mixed text={summary} /></h3>
      <div className="statement">{statement}</div>
      {hints.slice(0, openHints).map((hint, index) => (
        <div className="hint" key={index}>
          <h4>Hint {index + 1} of {hints.length}</h4>
          {hint}
        </div>
      ))}
      {!worked && (hints.length > 0 || solution || !quiz) && (
        <div className="actions">
          {hints.length > 0 && (
            <button type="button" className="gh-pill" onClick={() => setOpenHints((count) => Math.min(hints.length, count + 1))} disabled={openHints >= hints.length}>
              {openHints === 0 ? "Show a hint" : openHints < hints.length ? "Next hint" : "All hints are open"}
            </button>
          )}
          {solution && !quiz && (
            <button type="button" className="gh-pill" onClick={() => setShowSolution((open) => !open)} aria-expanded={showSolution}>
              {showSolution ? "Hide the solution" : "Show the solution"}
            </button>
          )}
          {!quiz && (
            <button type="button" className="gh-pill" onClick={toggleSolved} aria-pressed={solved}>
              {solved ? "Marked as done" : "Mark as done"}
            </button>
          )}
        </div>
      )}
      {solution && showSolution && (
        <div className="solution">
          {!worked && <h4>Solution</h4>}
          {solution}
        </div>
      )}
    </article>
  );
}
