"use client";

import { useState } from "react";

type Choice = { correct: boolean; text: React.ReactNode };

export function CheckCard({
  id,
  question,
  choices,
  why,
}: {
  id: string;
  question: React.ReactNode;
  choices: Choice[];
  why: React.ReactNode;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [graded, setGraded] = useState(false);

  const correct = graded && picked != null && choices[picked]?.correct;
  const wrong = graded && picked != null && !choices[picked]?.correct;

  return (
    <form
      className="card check"
      id={id}
      onSubmit={(event) => {
        event.preventDefault();
        setGraded(true);
      }}
    >
      <div className="statement">{question}</div>
      <div className="choices">
        {choices.map((choice, index) => (
          <label key={index} className={picked === index ? "is-picked" : ""}>
            <input
              type="radio"
              name={id}
              checked={picked === index}
              onChange={() => {
                setPicked(index);
                setGraded(false);
              }}
            />
            <span>{choice.text}</span>
          </label>
        ))}
      </div>
      <div className="actions">
        <button type="submit">Check</button>
      </div>
      {graded && picked == null && <p className="check-result">Choose an answer first.</p>}
      {correct && <p className="check-result is-yes">Yes. That is the answer.</p>}
      {wrong && <p className="check-result is-no">That is not it. The reason is below.</p>}
      {graded && picked != null && <div className="check-why">{why}</div>}
    </form>
  );
}
