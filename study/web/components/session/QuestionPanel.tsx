"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mixed } from "@/lib/bidi";

type Props = {
  title: string;
  content: ReactNode;
  examples: ReactNode[];
  hints: ReactNode[];
  onShowSolution: () => void;
  focusTitle: boolean;
  reread?: ReactNode;
};

export function QuestionPanel({ title, content, examples, hints, onShowSolution, focusTitle, reread }: Props) {
  // How many hints are revealed, and whether they are on screen. Closing keeps the count, so reopening does not start over.
  const [hintsShown, setHintsShown] = useState(0);
  const [hintsOpen, setHintsOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusTitle) titleRef.current?.focus();
  }, [focusTitle]);

  const toggleHints = () => {
    setHintsShown((n) => Math.max(n, 1));
    setHintsOpen((open) => !open);
  };

  return (
    <div className="question-panel">
      <h2 ref={titleRef} tabIndex={-1} className="question-title"><Mixed text={title} /></h2>
      <section className="question-section">
        <h3 className="question-heading">Description</h3>
        {content}
      </section>
      {examples.length > 0 && (
        <section className="question-section">
          <h3 className="question-heading">Examples</h3>
          {examples.map((example, i) => (
            <div key={i} className="question-example">
              <h4 className="code-label">Example {i + 1}</h4>
              {example}
            </div>
          ))}
        </section>
      )}
      <div className="question-help">
        {hints.length > 0 && (
          <>
            <button type="button" className="question-toggle" aria-expanded={hintsOpen} onClick={toggleHints}>Hints ({hintsShown} of {hints.length})</button>
            {hintsOpen && (
              <div className="code-hints">
                {hints.slice(0, hintsShown).map((hint, i) => (
                  <div key={i} className="code-hint">
                    <p className="code-label">Hint {i + 1} of {hints.length}</p>
                    {hint}
                  </div>
                ))}
                {hintsShown < hints.length && (
                  <button type="button" className="gh-pill" onClick={() => setHintsShown((n) => n + 1)}>Next hint</button>
                )}
              </div>
            )}
          </>
        )}
        <button type="button" className="question-toggle question-solution" onClick={onShowSolution}>Show the solution<span className="question-solution-where">&nbsp;beside your code</span></button>
      </div>
      {reread && <p className="session-reread">{reread}</p>}
    </div>
  );
}
