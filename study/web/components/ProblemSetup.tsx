"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/home/Icon";

// A problem's setup (its story and code) stays in reach while its questions scroll. A wide card pins it beside them; a narrow one offers it back once it has scrolled away.
export function ProblemSetup({ setup, questions }: { setup: ReactNode; questions: ReactNode }) {
  const setupRef = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = setupRef.current;
    if (!node) return;
    const watcher = new IntersectionObserver(([entry]) => {
      const gone = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      setAway(gone);
      if (!gone) setOpen(false);
    });
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  return (
    <div className="practice-split">
      <div className="practice-setup" ref={setupRef}>{setup}</div>
      <div className="practice-questions">
        <div className={`practice-peek${away ? " is-away" : ""}`}>
          <div className="practice-peek-inner">
            <button type="button" className="practice-peek-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              {open ? "Hide the setup" : "Show the setup"}
              <Icon name="down" />
            </button>
            {open && <div className="practice-peek-body">{setup}</div>}
          </div>
        </div>
        {questions}
      </div>
    </div>
  );
}
