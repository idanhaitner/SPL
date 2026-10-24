import { codeToHtml } from "shiki";

const SUPPORTED = new Set(["cpp", "c", "java", "sql", "text"]);

export async function CodeBlock({ lang, text }: { lang: string; text: string }) {
  const label = lang || "text";
  const grammar = SUPPORTED.has(label) ? label : "text";
  const html = await codeToHtml(text.replace(/\n$/, ""), {
    lang: grammar,
    theme: "tokyo-night",
  });
  return (
    <div className="code-panel" data-lang={grammar}>
      <span className="lang">{label}</span>
      <div className="code-scroll" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
