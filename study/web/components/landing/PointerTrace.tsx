"use client";

import { useState } from "react";

type Step = { x: number; p: boolean; r: boolean; written: "x" | "p" | null; note: string };

const STEPS: Step[] = [
  { x: 5, p: false, r: false, written: "x", note: "x is a cell on the stack. It holds 5." },
  { x: 5, p: true, r: false, written: "p", note: "p is a cell of its own. It holds the address of x." },
  { x: 7, p: true, r: false, written: "x", note: "Writing through p follows the address and changes x." },
  { x: 7, p: true, r: true, written: null, note: "r is a second name for x." },
  { x: 9, p: true, r: true, written: "x", note: "Writing r writes x. p still holds the same address." },
];

export function PointerTrace({ lines }: { lines: string[] }) {
  const [index, setIndex] = useState(1);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  return (
    <figure className="trace">
      <div className="trace-panel">
        <p className="trace-file">pointer.cpp</p>
        <div className="trace-body">
          <ol className="trace-code">
            {lines.map((html, line) => (
              <li
                key={line}
                className={line === index ? "is-current" : line > index ? "is-ahead" : undefined}
                aria-current={line === index ? "step" : undefined}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ))}
          </ol>
          <div className="trace-memory">
            <p className="trace-label">Stack</p>
            <div className={`trace-cell${step.written === "x" ? " is-written" : ""}`}>
              <span className="trace-address">0x1010</span>
              <span className="trace-name">{step.r ? "x, r" : "x"}</span>
              <span className="trace-value">{step.x}</span>
            </div>
            <div className={`trace-cell${step.written === "p" ? " is-written" : ""}${step.p ? "" : " is-empty"}`}>
              <span className="trace-address">0x1008</span>
              <span className="trace-name">{step.p ? "p" : ""}</span>
              <span className="trace-value">{step.p ? "0x1010" : ""}</span>
            </div>
            <span className={`trace-link${step.p ? " is-on" : ""}`} aria-hidden="true" />
          </div>
        </div>
        <div className="trace-foot">
          <p className="trace-note" role="status">{step.note}</p>
          <div className="trace-keys">
            <button type="button" className="key key--dark" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              Back
            </button>
            <button type="button" className="key key--dark" onClick={() => setIndex(last ? 0 : index + 1)}>
              {last ? "Start over" : "Next line"}
            </button>
          </div>
        </div>
      </div>
      <figcaption>An idea from chapter 3, one line at a time. The addresses are samples.</figcaption>
    </figure>
  );
}
