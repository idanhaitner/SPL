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

function splitCheck(children: Block[]) {
  const listIndex = children.findIndex((child) => child.type === "list");
  const list = listIndex >= 0 ? (children[listIndex] as Extract<Block, { type: "list" }>) : null;
  const question = listIndex >= 0 ? children.slice(0, listIndex) : children;
  const why = listIndex >= 0 ? children.slice(listIndex + 1) : [];
  const choices = (list?.items ?? []).map((item) => {
    const text = item.text.trim();
    const correct = text.startsWith("[x]") || text.startsWith("[X]");
    const body = text.replace(/^\[[xX ]\]\s*/, "");
    return { correct, text: <Inline text={body} /> };
  });
  return { question, choices, why };
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
        summary={plain(preview(parts.statement))}
        statement={<Blocks blocks={parts.statement} courseId={courseId} />}
        hints={parts.hints.map((hint, index) => (
          <Blocks key={index} blocks={hint} courseId={courseId} />
        ))}
        solution={parts.solution ? <Blocks blocks={parts.solution} courseId={courseId} /> : null}
      />
    );
  }
  if (name === "check") {
    const parts = splitCheck(children);
    return (
      <CheckCard
        id={attrs.id || "check"}
        question={<Blocks blocks={parts.question} courseId={courseId} />}
        choices={parts.choices}
        why={<Blocks blocks={parts.why} courseId={courseId} />}
      />
    );
  }
  if (name === "trap") {
    return (
      <aside className="callout callout-trap">
        <p className="kicker">Watch for this</p>
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
        <p className="kicker">{label}</p>
        {attrs.title && <h3><Inline text={attrs.title} /></h3>}
        {name === "algorithm" && attrs.complexity && <p className="meta">Complexity. {attrs.complexity}</p>}
        {name === "algorithm" && attrs.invariant && <p className="meta">Invariant. {attrs.invariant}</p>}
        <Blocks blocks={body} courseId={courseId} />
        {proof.map((item, index) => (
          <div className="proof" key={index}>
            <p className="kicker">Proof</p>
            <Blocks blocks={item.type === "directive" ? item.children : []} courseId={courseId} />
          </div>
        ))}
      </section>
    );
  }
  if (name === "proof") {
    return (
      <div className="proof">
        <p className="kicker">Proof</p>
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
