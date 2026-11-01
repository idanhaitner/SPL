import { CodePanel } from "@/components/chapter/CodePanel";

export function CodeBlock({ lang, text }: { lang: string; text: string }) {
  return <CodePanel lang={lang} text={text} />;
}
