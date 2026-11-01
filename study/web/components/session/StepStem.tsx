"use client";

import { useState } from "react";
import { Icon } from "@/components/home/Icon";
import { Mixed } from "@/lib/bidi";

export type StepMeta = { id: string; kind: "question" | "exercise"; title: string };
export type StepStatus = "done" | "skipped" | "current" | "upcoming";

const KIND = { question: "Question", exercise: "Coding exercise" };

function Shape({ status }: { status: StepStatus }) {
  return (
    <svg className={`step-shape is-${status}`} viewBox="0 0 30 30" aria-hidden="true">
      {status === "done" || status === "skipped" ? <path d="M4 26C3 13 11 4 26 4c1 14-8 23-22 22Z" /> : <circle cx="15" cy="15" r={status === "current" ? 11 : 6} />}
    </svg>
  );
}

export function StepStem({ steps, statusOf, index, onGo }: { steps: StepMeta[]; statusOf: (id: string, index: number) => StepStatus; index: number; onGo: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  const label = (step: StepMeta, at: number, status: StepStatus) => `Step ${at + 1} of ${steps.length}: ${KIND[step.kind]}, ${step.title} (${status})`;
  const doneCount = steps.filter((step, at) => statusOf(step.id, at) === "done").length;
  return (
    <>
      <ol className="step-stem" aria-label="Session progress">
        {steps.map((step, at) => {
          const status = statusOf(step.id, at);
          return (
            <li key={step.id} className={status === "done" ? "is-grown" : undefined}>
              <button type="button" className="step-leaf" aria-label={label(step, at, status)} title={step.title} aria-current={at === index ? "step" : undefined} onClick={() => onGo(at)}>
                <Shape status={status} />
              </button>
            </li>
          );
        })}
      </ol>
      <div className="step-mini">
        <button type="button" className="step-mini-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span className="step-mini-bar" aria-hidden="true"><i style={{ width: `${(doneCount / steps.length) * 100}%` }} /></span>
          <span>All steps</span>
          <Icon name="down" />
        </button>
        {open && (
          <ol className="step-list">
            {steps.map((step, at) => {
              const status = statusOf(step.id, at);
              return (
                <li key={step.id}>
                  <button type="button" aria-current={at === index ? "step" : undefined} onClick={() => { setOpen(false); onGo(at); }}>
                    <Shape status={status} />
                    <span><Mixed text={step.title} /></span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
