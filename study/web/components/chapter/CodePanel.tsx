import { grammarOf, highlight } from "@/lib/highlight";
import { CopyButton } from "./CopyButton";

const LANGUAGE: Record<string, string> = { cpp: "C++", c: "C", java: "Java", sql: "SQL", python: "Python", text: "Text", bash: "Shell", sh: "Shell" };

export async function CodePanel({ lang, text, file, output, markedLine }: { lang: string; text: string; file?: string; output?: string; markedLine?: number }) {
  const label = lang || "text";
  const grammar = grammarOf(label);
  const html = (await highlight(text.replace(/\n$/, ""), grammar, markedLine)).replace(/ tabindex="0"/, "");
  return (
    <div className="code-panel" data-lang={grammar}>
      <div className="code-bar">
        <span className="lang">{LANGUAGE[label] ?? label}</span>
        {file && <span className="code-file">{file}</span>}
        <CopyButton />
      </div>
      <div className="code-scroll" tabIndex={0} role="region" aria-label={`${LANGUAGE[label] ?? label} code`} dangerouslySetInnerHTML={{ __html: html }} />
      {output && (
        <div className="code-output">
          <b>Output</b>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  );
}
