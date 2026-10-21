"use client";

import { useEffect, useState } from "react";
import { Inline } from "@/lib/inline";
import type { Block } from "@/lib/types";

type Choice = { correct: boolean; text: React.ReactNode };
type Blank = { correct: string; options: string[] };

const BLANK = /\{\{=([^{}]+)\}\}/g;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const held = copy[index];
    copy[index] = copy[swap];
    copy[swap] = held;
  }
  return copy;
}

export function reportCheck(id: string, correct: boolean) {
  window.dispatchEvent(new CustomEvent("study-check", { detail: { id, correct } }));
}

function blanksIn(blocks: Block[]): Blank[] {
  const found: Blank[] = [];
  const take = (text: string) => {
    for (const match of text.matchAll(BLANK)) {
      const options = match[1].split("|").map((option) => option.trim()).filter(Boolean);
      if (options.length >= 2) found.push({ correct: options[0], options });
    }
  };
  const walk = (items: Block[]) => {
    for (const block of items) {
      if (block.type === "paragraph" || block.type === "quote" || block.type === "code" || block.type === "heading" || block.type === "math") {
        take(block.text);
      } else if (block.type === "list") {
        for (const item of block.items) {
          take(item.text);
          walk(item.children);
        }
      } else if (block.type === "directive") {
        walk(block.children);
      }
    }
  };
  walk(blocks);
  return found;
}

function BlankSelect({
  index,
  options,
  value,
  onChange,
}: {
  index: number;
  options: string[];
  value: string;
  onChange: (index: number, value: string) => void;
}) {
  return (
    <select
      className="blank-select"
      aria-label={`Blank ${index + 1}`}
      value={value}
      onChange={(event) => onChange(index, event.target.value)}
    >
      <option value="">Choose</option>
      {options.map((option, optionIndex) => (
        <option key={`${optionIndex}-${option}`} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function fill(
  text: string,
  start: number,
  prose: boolean,
  menus: string[][],
  values: string[],
  onChange: (index: number, value: string) => void,
) {
  const nodes: React.ReactNode[] = [];
  const pattern = /\{\{=([^{}]+)\}\}/g;
  let last = 0;
  let cursor = start;
  let part = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      const slice = text.slice(last, match.index);
      nodes.push(prose ? <Inline key={`t-${start}-${part}`} text={slice} /> : <span key={`t-${start}-${part}`}>{slice}</span>);
      part += 1;
    }
    nodes.push(
      <BlankSelect
        key={`b-${cursor}`}
        index={cursor}
        options={menus[cursor] ?? []}
        value={values[cursor] ?? ""}
        onChange={onChange}
      />,
    );
    cursor += 1;
    last = match.index + match[0].length;
    part += 1;
  }
  if (last < text.length) {
    const slice = text.slice(last);
    nodes.push(prose ? <Inline key={`t-${start}-end`} text={slice} /> : <span key={`t-${start}-end`}>{slice}</span>);
  }
  return { nodes, next: cursor };
}

function PromptBlocks({
  blocks,
  menus,
  values,
  onChange,
}: {
  blocks: Block[];
  menus: string[][];
  values: string[];
  onChange: (index: number, value: string) => void;
}) {
  const cursor = { n: 0 };
  return <>{renderPrompt(blocks, cursor, menus, values, onChange)}</>;
}

function renderPrompt(
  blocks: Block[],
  cursor: { n: number },
  menus: string[][],
  values: string[],
  onChange: (index: number, value: string) => void,
): React.ReactNode[] {
  return blocks.map((block, index) => {
    const key = `${block.type}-${index}`;
    if (block.type === "paragraph" || block.type === "quote" || block.type === "heading" || block.type === "math") {
      const text = block.type === "math" ? `$${block.text}$` : block.text;
      const filled = fill(text, cursor.n, true, menus, values, onChange);
      cursor.n = filled.next;
      if (block.type === "quote") return <blockquote key={key}>{filled.nodes}</blockquote>;
      if (block.type === "heading") return <p key={key}><strong>{filled.nodes}</strong></p>;
      return <p key={key}>{filled.nodes}</p>;
    }
    if (block.type === "code") {
      const filled = fill(block.text, cursor.n, false, menus, values, onChange);
      cursor.n = filled.next;
      return (
        <div className="code-panel" data-lang={block.lang || "text"} key={key}>
          <span className="lang">{block.lang || "text"}</span>
          <div className="code-scroll">
            <pre className="blank-pre">
              <code>{filled.nodes}</code>
            </pre>
          </div>
        </div>
      );
    }
    if (block.type === "list") {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag key={key}>
          {block.items.map((item, itemIndex) => {
            const filled = fill(item.text, cursor.n, true, menus, values, onChange);
            cursor.n = filled.next;
            return (
              <li key={itemIndex}>
                {filled.nodes}
                {item.children.length > 0 && renderPrompt(item.children, cursor, menus, values, onChange)}
              </li>
            );
          })}
        </Tag>
      );
    }
    return null;
  });
}

export function CheckCard({
  id,
  question,
  choices,
  why,
  prompt,
}: {
  id: string;
  question: React.ReactNode;
  choices: Choice[];
  why: React.ReactNode;
  prompt?: Block[];
}) {
  const blanks = prompt ? blanksIn(prompt) : [];
  const blankMode = blanks.length > 0;
  const multi = !blankMode && choices.filter((choice) => choice.correct).length > 1;
  const [picked, setPicked] = useState<number | null>(null);
  const [pickedMany, setPickedMany] = useState<number[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [menus] = useState(() => blanks.map((blank) => shuffle(blank.options)));
  const [graded, setGraded] = useState(false);

  const manyCorrect =
    multi &&
    choices.length > 0 &&
    choices.every((choice, index) => choice.correct === pickedMany.includes(index));
  const oneCorrect = !multi && !blankMode && picked != null && Boolean(choices[picked]?.correct);
  const blanksReady = blankMode && values.length === blanks.length && values.every((value) => value !== "");
  const blanksCorrect = blanksReady && blanks.every((blank, index) => values[index] === blank.correct);
  const hasAnswer = blankMode ? blanksReady : multi ? pickedMany.length > 0 : picked != null;
  const correct = blankMode ? blanksCorrect : multi ? manyCorrect : oneCorrect;

  useEffect(() => {
    if (!graded) return;
    reportCheck(id, hasAnswer && correct);
  }, [graded, hasAnswer, correct, id]);

  function changeBlank(index: number, value: string) {
    setValues((current) => {
      const next = blanks.map((_, blankIndex) => current[blankIndex] ?? "");
      next[index] = value;
      return next;
    });
    setGraded(false);
    reportCheck(id, false);
  }

  return (
    <form
      className="card check"
      id={id}
      onSubmit={(event) => {
        event.preventDefault();
        setGraded(true);
      }}
    >
      <div className="statement">
        {blankMode && prompt ? (
          <PromptBlocks blocks={prompt} menus={menus} values={values} onChange={changeBlank} />
        ) : (
          question
        )}
      </div>
      {multi && <p className="check-note">Select every answer that applies.</p>}
      {!blankMode && (
        <div className="choices">
          {choices.map((choice, index) => {
            const on = multi ? pickedMany.includes(index) : picked === index;
            return (
              <label key={index} className={on ? "is-picked" : ""}>
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={id}
                  checked={on}
                  onChange={() => {
                    if (multi) {
                      setPickedMany((current) =>
                        current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
                      );
                    } else {
                      setPicked(index);
                    }
                    setGraded(false);
                    reportCheck(id, false);
                  }}
                />
                <span>{choice.text}</span>
              </label>
            );
          })}
        </div>
      )}
      <div className="actions">
        <button type="submit">Check</button>
      </div>
      {graded && !hasAnswer && <p className="check-result">Choose an answer first.</p>}
      {graded && hasAnswer && correct && <p className="check-result is-yes">Yes. That is the answer.</p>}
      {graded && hasAnswer && !correct && <p className="check-result is-no">That is not it. The reason is below.</p>}
      {graded && hasAnswer && <div className="check-why">{why}</div>}
    </form>
  );
}
