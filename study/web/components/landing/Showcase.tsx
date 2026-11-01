"use client";

import { useRef, useState } from "react";

export type ShowcasePanel = { key: string; part: string; file: string; note: string; html: string };

export function Showcase({ panels }: { panels: ShowcasePanel[] }) {
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = (index + step + panels.length) % panels.length;
    setIndex(next);
    root.current?.querySelector<HTMLButtonElement>(`#show-tab-${next}`)?.focus();
  };

  return (
    <div className="show" ref={root}>
      <div className="show-side">
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
              onClick={() => setIndex(i)}
            >
              {panel.part}
            </button>
          ))}
        </div>
        <p className="show-note">{panels[index].note}</p>
        <p className="show-hint">The marked line is how this code avoids it.</p>
      </div>
      <div className="show-stage">
        <p className="show-file">{panels[index].file}</p>
        {panels.map((panel, i) => (
          <div
            key={panel.key}
            id={`show-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`show-tab-${i}`}
            className="show-panel"
            hidden={i !== index}
            dangerouslySetInnerHTML={{ __html: panel.html }}
          />
        ))}
      </div>
    </div>
  );
}
