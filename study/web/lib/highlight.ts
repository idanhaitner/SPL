import { codeToHtml, createCssVariablesTheme } from "shiki";

// Syntax colors come from the --code-* tokens in globals.css.
const theme = createCssVariablesTheme({
  name: "study",
  variablePrefix: "--code-",
  variableDefaults: {},
  fontStyle: true,
});

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
