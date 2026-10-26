import { Mixed } from "@/lib/bidi";
import { CheckCard } from "@/components/CheckCard";
import { CodeBlock } from "@/components/CodeBlock";
import { PracticeCard } from "@/components/Practice";
import { DisplayMath, Inline, Paragraph } from "@/lib/inline";
import type { Block } from "@/lib/types";

function ListBlock({ block }: { block: Extract<Block, { type: "list" }> }) {
  const Tag = block.ordered ? "ol" : "ul";
  return (
    <Tag>
      {block.items.map((item, index) => (
        <li key={index}>
          <Inline text={item.text} />
          {item.children?.map((child, childIndex) => (
            <Blocks key={childIndex} blocks={[child]} courseId="" />
          ))}
        </li>
      ))}
    </Tag>
  );
}

function preview(blocks: Block[]) {
  for (const block of blocks) {
    if (block.type === "paragraph" || block.type === "quote") return block.text;
    if (block.type === "code") return block.text.trim().split("\n")[0] || "Question";
  }
  return "Question";
}

function fallbackTitle(text: string) {
  const sentence = plain(text).split(/(?<=[.!?])\s/)[0] || "Question";
  if (sentence.length <= 72) return sentence;
  let title = "";
  for (const word of sentence.split(/\s+/)) {
    const next = title ? `${title} ${word}` : word;
    if (next.length > 72) break;
    title = next;
  }
  return title || "Question";
}

function plain(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\$\$?([^$]+)\$\$?/g, "$1")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitProblem(children: Block[]) {
  const statement: Block[] = [];
  const hints: Block[][] = [];
  let solution: Block[] | null = null;
  for (const child of children) {
    if (child.type === "directive" && child.name === "hint") hints.push(child.children);
    else if (child.type === "directive" && child.name === "solution") solution = child.children;
    else statement.push(child);
  }
  return { statement, hints, solution };
}

function blockHasBlank(block: Block): boolean {
  if (block.type === "paragraph" || block.type === "quote" || block.type === "code" || block.type === "heading" || block.type === "math") {
    return block.text.includes("{{=");
  }
  if (block.type === "list") {
    return block.items.some((item) => item.text.includes("{{=") || item.children.some(blockHasBlank));
  }
  if (block.type === "table") {
    return [...block.header, ...block.rows.flat()].some((cell) => cell.includes("{{="));
  }
  if (block.type === "directive") return block.children.some(blockHasBlank);
  return false;
}

function checkIdsIn(blocks: Block[]): string[] {
  const ids: string[] = [];
  for (const block of blocks) {
    if (block.type === "directive" && block.name === "check" && block.attrs.id) ids.push(block.attrs.id);
    if (block.type === "directive") ids.push(...checkIdsIn(block.children));
    if (block.type === "list") {
      for (const item of block.items) ids.push(...checkIdsIn(item.children));
    }
  }
  return ids;
}

function splitCheck(children: Block[]) {
  const listIndex = children.findIndex((child) => child.type === "list");
  let lastBlank = -1;
  children.forEach((child, index) => {
    if (blockHasBlank(child)) lastBlank = index;
  });
  if (lastBlank >= 0 && (listIndex < 0 || lastBlank < listIndex)) {
    return {
      mode: "blank" as const,
      prompt: children.slice(0, lastBlank + 1),
      question: [] as Block[],
      choices: [] as { correct: boolean; text: React.ReactNode }[],
      why: children.slice(lastBlank + 1),
    };
  }
  const list = listIndex >= 0 ? (children[listIndex] as Extract<Block, { type: "list" }>) : null;
  const question = listIndex >= 0 ? children.slice(0, listIndex) : children;
  const why = listIndex >= 0 ? children.slice(listIndex + 1) : [];
  const choices = (list?.items ?? []).map((item) => {
    const text = item.text.trim();
    const correct = text.startsWith("[x]") || text.startsWith("[X]");
    const body = text.replace(/^\[[xX ]\]\s*/, "");
    return { correct, text: <Inline text={body} /> };
  });
  const mode = choices.filter((choice) => choice.correct).length > 1 ? ("multi" as const) : ("single" as const);
  return { mode, prompt: [] as Block[], question, choices, why };
}

function Directive({ block, courseId }: { block: Extract<Block, { type: "directive" }>; courseId: string }) {
  const { name, attrs, children } = block;
  if (name === "examnote") return null;
  if (name === "problem") {
    const parts = splitProblem(children);
    return (
      <PracticeCard
        id={attrs.id || ""}
        courseId={courseId}
        kind={attrs.kind || "exercise"}
        summary={attrs.title?.trim() || fallbackTitle(preview(parts.statement))}
        statement={<Blocks blocks={parts.statement} courseId={courseId} />}
        hints={parts.hints.map((hint, index) => (
          <Blocks key={index} blocks={hint} courseId={courseId} />
        ))}
        solution={parts.solution ? <Blocks blocks={parts.solution} courseId={courseId} /> : null}
        checkIds={checkIdsIn(children)}
      />
    );
  }
  if (name === "check") {
    const parts = splitCheck(children);
    return (
      <CheckCard
        id={attrs.id || "check"}
        question={parts.mode === "blank" ? null : <Blocks blocks={parts.question} courseId={courseId} />}
        prompt={parts.mode === "blank" ? parts.prompt : undefined}
        choices={parts.choices}
        why={<Blocks blocks={parts.why} courseId={courseId} />}
      />
    );
  }
  if (name === "trap") {
    return (
      <aside className="callout callout-trap">
        <p className="lead-in">Watch for this</p>
        <Blocks blocks={children} courseId={courseId} />
      </aside>
    );
  }
  if (name === "definition" || name === "theorem" || name === "algorithm") {
    const label = name === "definition" ? "Definition" : name === "theorem" ? "Theorem" : "Algorithm";
    const proof = children.filter((child) => child.type === "directive" && child.name === "proof");
    const body = children.filter((child) => !(child.type === "directive" && child.name === "proof"));
    return (
      <section className="formal" id={attrs.id}>
        {attrs.title ? (
          <h3><span className="type">{label}</span><Inline text={attrs.title} /></h3>
        ) : (
          <p className="lead-in">{label}</p>
        )}
        {name === "algorithm" && attrs.complexity && <p className="meta">Complexity. <Mixed text={attrs.complexity} /></p>}
        {name === "algorithm" && attrs.invariant && <p className="meta">Invariant. <Mixed text={attrs.invariant} /></p>}
        <Blocks blocks={body} courseId={courseId} />
        {proof.map((item, index) => (
          <div className="proof" key={index}>
            <p className="lead-in">Proof</p>
            <Blocks blocks={item.type === "directive" ? item.children : []} courseId={courseId} />
          </div>
        ))}
      </section>
    );
  }
  if (name === "proof") {
    return (
      <div className="proof">
        <p className="lead-in">Proof</p>
        <Blocks blocks={children} courseId={courseId} />
      </div>
    );
  }
  return <Blocks blocks={children} courseId={courseId} />;
}

export function Blocks({ blocks, courseId }: { blocks: Block[]; courseId: string }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === "paragraph") {
          return <Paragraph key={key} text={block.text} />;
        }
        if (block.type === "heading") {
          const Tag = (`h${Math.min(block.level, 4)}` as "h2");
          return <Tag key={key}><Inline text={block.text} /></Tag>;
        }
        if (block.type === "quote") {
          return <blockquote key={key}><Inline text={block.text} /></blockquote>;
        }
        if (block.type === "code") {
          return <CodeBlock key={key} lang={block.lang} text={block.text} />;
        }
        if (block.type === "math") return <DisplayMath key={key} tex={block.text} />;
        if (block.type === "table") {
          return (
            <div className="table-wrap" key={key}>
              <table>
                <thead>
                  <tr>{block.header.map((cell, cellIndex) => <th key={cellIndex}><Inline text={cell} /></th>)}</tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => <td key={cellIndex}><Inline text={cell} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "list") return <ListBlock key={key} block={block} />;
        if (block.type === "directive") return <Directive key={key} block={block} courseId={courseId} />;
        return null;
      })}
    </>
  );
}
