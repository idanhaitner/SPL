"use client";

import { useEffect, useRef, useState } from "react";

export type ShowcasePanel = { key: string; part: string; file: string; note: string; html: string };

const DWELL = 5200;

export function Showcase({ panels }: { panels: ShowcasePanel[] }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAuto(false);
  }, []);

  useEffect(() => {
    if (!auto || paused) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % panels.length), DWELL);
    return () => window.clearTimeout(timer);
  }, [auto, paused, index, panels.length]);

  const choose = (next: number) => {
    setAuto(false);
    setIndex(next);
  };

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + step + panels.length) % panels.length;
    choose(next);
    root.current?.querySelector<HTMLButtonElement>(`#show-tab-${next}`)?.focus();
  };

  return (
    <div
      className="show"
      ref={root}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{ "--dwell": `${DWELL}ms` } as React.CSSProperties}
    >
      <div className="show-head">
        <span className="show-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="show-file">{panels[index].file}</span>
      </div>
      <div className="show-tabs" role="tablist" aria-label="One example per course part" onKeyDown={onKey}>
        {panels.map((panel, i) => (
          <button
            key={panel.key}
            id={`show-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-controls={`show-panel-${i}`}
            tabIndex={i === index ? 0 : -1}
            className={i === index && auto && !paused ? "is-timing" : undefined}
            onClick={() => choose(i)}
          >
            {panel.part}
          </button>
        ))}
      </div>
      <div className="show-stage">
        {panels.map((panel, i) => (
          <div
            key={panel.key}
            id={`show-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`show-tab-${i}`}
            className={`show-panel${i === index ? " is-active" : ""}`}
            aria-hidden={i !== index}
            dangerouslySetInnerHTML={{ __html: panel.html }}
          />
        ))}
      </div>
      <p className="show-note">
        <span>Exam trap</span>
        {panels[index].note}
      </p>
    </div>
  );
}
