"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { LeafBurst } from "./LeafMark";

type Answer = { text: string; right?: boolean; why?: string };

const ANSWERS: Answer[] = [
  { text: "n, because the parameter was passed in", why: "n belonged to foo's frame, and that frame was removed when foo returned." },
  { text: "x, because it was initialized", why: "x belonged to foo's frame, and that frame was removed when foo returned." },
  { text: "only a", right: true },
];

export function TryQuestion({ code }: { code: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answer = picked === null ? null : ANSWERS[picked];
  return (
    <div className="gh-try">
      <h3>After foo returns, what is still in memory?</h3>
      <div className="gh-code" dangerouslySetInnerHTML={{ __html: code }} />
      <div className="gh-answers">
        {ANSWERS.map((item, index) => {
          const isPicked = picked === index;
          const result = isPicked ? (item.right ? "right" : "wrong") : "";
          return (
            <button key={item.text} type="button" className={`gh-answer ${result}`} aria-pressed={isPicked} onClick={() => setPicked(index)}>
              <span className="gh-answer-mark">{result === "right" && <><Icon name="check" /><LeafBurst /></>}{result === "wrong" && <Icon name="x" />}</span>
              {item.text}
            </button>
          );
        })}
      </div>
      <div className="gh-why" aria-live="polite">
        {!answer && <p>Pick one. A wrong answer explains itself.</p>}
        {answer?.right && <p><b className="is-ok">Right.</b> <code>a</code> lives in <code>main</code>&rsquo;s frame, which is still on the stack, because <code>main</code> has not returned.</p>}
        {answer && !answer.right && <p><b className="is-bad">Not this one.</b> {answer.why} Try another.</p>}
      </div>
    </div>
  );
}
