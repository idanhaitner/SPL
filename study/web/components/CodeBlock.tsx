import { grammarOf, highlight } from "@/lib/highlight";

export async function CodeBlock({ lang, text }: { lang: string; text: string }) {
  const label = lang || "text";
  const grammar = grammarOf(label);
  const html = await highlight(text.replace(/\n$/, ""), grammar);
  return (
    <div className="code-panel" data-lang={grammar}>
      <span className="lang">{label}</span>
      <div className="code-scroll" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
