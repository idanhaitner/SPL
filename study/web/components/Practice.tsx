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
};

export function PracticeCard({ id, courseId, kind, summary, statement, hints, solution }: Props) {
  const worked = kind === "worked";
  const [open, setOpen] = useState(worked);
  const [openHints, setOpenHints] = useState(0);
  const [showSolution, setShowSolution] = useState(worked);
  const [solved, setSolved] = useState(false);

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

  function toggleSolved() {
    const progress = readProgress(courseId);
    const next = progress.solved.includes(id)
      ? progress.solved.filter((item) => item !== id)
      : [...progress.solved, id];
    writeProgress(courseId, { ...progress, solved: next });
  }

  const hintLabel =
    openHints === 0
      ? `הצג רמז (1 מתוך ${hints.length})`
      : openHints < hints.length
        ? `הרמז הבא (${openHints + 1} מתוך ${hints.length})`
        : "הרמזים פתוחים";

  if (!worked && !open) {
    return (
      <article className={`card practice is-folded${solved ? " is-solved" : ""}`} id={id}>
        <button type="button" className="fold-row" aria-expanded={false} onClick={() => setOpen(true)}>
          <span className="kicker">תרגול</span>
          <span className="fold-line"><Mixed text={summary} /></span>
          <span className="fold-open">פתיחה</span>
        </button>
      </article>
    );
  }

  return (
    <article className={`card practice${solved ? " is-solved" : ""}`} id={id}>
      <header className="card-head">
        <p className="kicker">{worked ? "דוגמה" : "תרגול"}</p>
        {!worked && (
          <div className="card-tools">
            <button type="button" onClick={() => setOpen(false)}>סגירה</button>
            <button type="button" className={solved ? "is-on" : ""} onClick={toggleSolved} aria-pressed={solved}>
              {solved ? "נפתר" : "סמן כנפתר"}
            </button>
          </div>
        )}
      </header>
      <h3 className="practice-title"><Mixed text={summary} /></h3>
      <div className="statement">{statement}</div>
      {hints.slice(0, openHints).map((hint, index) => (
        <div className="reveal" key={index}>
          <div className="hint">
            <p className="kicker">רמז {index + 1} מתוך {hints.length}</p>
            {hint}
          </div>
        </div>
      ))}
      {(hints.length > 0 || solution) && !worked && (
        <div className="actions">
          {hints.length > 0 && (
            <button type="button" onClick={() => setOpenHints((count) => Math.min(hints.length, count + 1))} disabled={openHints >= hints.length}>
              {hintLabel}
            </button>
          )}
          {solution && (
            <button type="button" onClick={() => setShowSolution((open) => !open)} aria-expanded={showSolution}>
              {showSolution ? "הסתר פתרון" : "הצג פתרון"}
            </button>
          )}
        </div>
      )}
      {solution && showSolution && (
        <div className="reveal">
          <div className="solution">
            <p className="kicker">פתרון</p>
            {solution}
          </div>
        </div>
      )}
    </article>
  );
}
