import { codeToHtml, codeToTokens, createCssVariablesTheme } from "shiki";
import type { CodeToken } from "@/lib/types";

// Syntax colors come from the --code-* tokens in globals.css.
const theme = createCssVariablesTheme({
  name: "study",
  variablePrefix: "--code-",
  variableDefaults: {},
  fontStyle: true,
});

const SUPPORTED = new Set(["cpp", "c", "java", "sql", "python", "bash", "text"]);

export function grammarOf(lang: string) {
  return SUPPORTED.has(lang) ? lang : "text";
}

export async function highlightTokens(code: string, lang: string): Promise<CodeToken[][]> {
  const { tokens } = await codeToTokens(code, { lang: grammarOf(lang) as "text", theme });
  return tokens.map((line) => line.map((token) => ({ content: token.content, color: token.color })));
}

export function highlight(code: string, lang: string, markedLine?: number) {
  return codeToHtml(code, {
    lang,
    theme,
    transformers: markedLine
      ? [
          {
            line(node, line) {
              if (line === markedLine) this.addClassToHast(node, "is-marked");
            },
          },
        ]
      : [],
  });
}
