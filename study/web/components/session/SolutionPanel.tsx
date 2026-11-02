"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = { children: ReactNode; onClose: () => void };

// The solution takes the question's place, so it sits beside the student's code at full height.
export function SolutionPanel({ children, onClose }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section className="solution-panel" aria-labelledby="solution-title" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <div className="solution-bar">
        <h2 ref={titleRef} id="solution-title" tabIndex={-1} className="solution-title">Solution <span>read only</span></h2>
        <button type="button" className="gh-pill" onClick={onClose}>Back to the question</button>
      </div>
      {children}
    </section>
  );
}
