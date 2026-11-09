"use client";

import { acceptCompletion, autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, type Completion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { setDiagnostics, type Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { EditorState, StateEffect, StateField, type Extension } from "@codemirror/state";
import { Decoration, EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab, isolateHistory } from "@codemirror/commands";
import { HighlightStyle, bracketMatching, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { useEffect, useRef } from "react";
import type { Diagnostic } from "@/lib/run-result";
import type { ExerciseLang } from "@/lib/types";

type Props = {
  value: string;
  onChange(v: string): void;
  diagnostics: Diagnostic[];
  onHoverLine?(line: number | null): void;
  onFormat?(): void;
  highlightLines?: number[];
  readOnly?: boolean;
  lang?: ExerciseLang;
};

// Formatting only moves whitespace, so counting the other characters finds the same spot in the new text.
function sameSpot(before: string, after: string, at: number): number {
  let left = 0;
  for (let i = 0; i < at; i++) if (!/\s/.test(before[i])) left++;
  let i = 0;
  while (left > 0 && i < after.length) if (!/\s/.test(after[i++])) left--;
  return i;
}

const setHighlight = StateEffect.define<number[]>();

const highlightField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setHighlight)) continue;
      const total = tr.state.doc.lines;
      const marks = [...new Set(e.value)]
        .filter((n) => n >= 1 && n <= total)
        .sort((a, b) => a - b)
        .map((n) => Decoration.line({ class: "cm-linked-line" }).range(tr.state.doc.line(n).from));
      deco = Decoration.set(marks);
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const theme = EditorView.theme(
  {
    "&": { color: "var(--code-ink)", backgroundColor: "var(--code)", fontSize: "0.9375rem" },
    ".cm-content": { fontFamily: "var(--gh-mono)", fontVariantLigatures: "none", caretColor: "var(--code-num)", padding: "10px 0" },
    ".cm-scroller": { fontFamily: "var(--gh-mono)", lineHeight: "1.6", minHeight: "12rem", maxHeight: "30rem" },
    "&.cm-focused": { outline: "none" },
    ".cm-gutters": { backgroundColor: "var(--code-bar)", color: "var(--code-gutter)", border: "none" },
    ".cm-activeLine": { backgroundColor: "rgb(255 255 255 / 0.05)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--code-ink)" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "var(--code-selection) !important" },
    ".cm-cursor": { borderLeftColor: "var(--code-num)", borderLeftWidth: "2px" },
    ".cm-matchingBracket": { backgroundColor: "rgb(227 204 143 / 0.22)", outline: "none" },
    ".cm-linked-line": { backgroundColor: "rgb(227 204 143 / 0.16)" },
    ".cm-tooltip": { backgroundColor: "var(--raised)", color: "var(--ink)", border: "1px solid var(--rule)", borderRadius: "10px" },
    ".cm-tooltip-autocomplete ul": { fontFamily: "var(--gh-mono)", fontSize: "0.875rem" },
    ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "var(--code-selection)", color: "var(--ink)" },
    ".cm-diagnostic": { fontFamily: "var(--gh-body)", fontSize: "0.875rem", padding: "6px 10px" },
    ".cm-lintRange-error": { backgroundImage: "none", textDecoration: "wavy underline #F2A36F", textUnderlineOffset: "3px" },
    ".cm-lintRange-warning": { backgroundImage: "none", textDecoration: "wavy underline #E3CC8F", textUnderlineOffset: "3px" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.modifier, t.operatorKeyword], color: "var(--code-key)", fontWeight: "600" },
  { tag: [t.typeName, t.standard(t.typeName)], color: "var(--code-type)" },
  { tag: [t.string, t.character], color: "var(--code-str)" },
  { tag: [t.number, t.bool, t.null], color: "var(--code-num)" },
  { tag: [t.variableName, t.propertyName], color: "var(--code-var)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: "var(--code-fn)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--code-comment)" },
  { tag: [t.meta, t.processingInstruction], color: "var(--code-macro)" },
]);

function toCm(doc: EditorState["doc"], list: Diagnostic[]): CmDiagnostic[] {
  return list.map((d) => {
    const line = doc.line(Math.min(Math.max(d.line, 1), doc.lines));
    const from = Math.min(line.from + Math.max(d.column - 1, 0), line.to);
    // Underline the token that starts at the column, or the whole rest of the line.
    const rest = doc.sliceString(from, line.to);
    const word = /^[A-Za-z0-9_]+/.exec(rest);
    const to = Math.max(word ? from + word[0].length : line.to, Math.min(from + 1, line.to));
    return { from, to: to === from ? line.to : to, severity: d.severity === "note" ? "info" : d.severity, message: d.text };
  });
}

const KEYWORDS: Record<ExerciseLang, string[]> = {
  cpp: "auto bool break case catch char class const continue default delete do double else enum explicit false float for if include inline int long namespace new nullptr operator private protected public return short signed sizeof static struct switch template this throw true try typedef typename unsigned using virtual void while override final std string vector cout cin endl cerr map set unique_ptr shared_ptr make_unique make_shared size_t".split(" "),
  java: "abstract boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long new null package private protected public return short static super switch this throw throws true false try void while String System out println List ArrayList Map HashMap Override".split(" "),
  python: "and as assert break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print len range self str int list dict set tuple isinstance super".split(" "),
};

// Names the user has written in this file: a word followed by ( is offered as a function, any other word as a variable.
function nameCompletions(lang: ExerciseLang) {
  return (ctx: CompletionContext): CompletionResult | null => {
    const word = ctx.matchBefore(/[A-Za-z_]\w*/);
    if (!word || (word.from === word.to && !ctx.explicit)) return null;
    const text = ctx.state.doc.toString();
    const seen = new Map<string, Completion>();
    for (const m of text.matchAll(/[A-Za-z_]\w*/g)) {
      // Skip the word being typed right now, or it would suggest itself.
      if (m.index === word.from) continue;
      const name = m[0];
      if (seen.has(name) || KEYWORDS[lang].includes(name)) continue;
      const isFn = /^\s*\(/.test(text.slice(m.index + name.length, m.index + name.length + 8));
      seen.set(name, { label: name, type: isFn ? "function" : "variable", boost: 1 });
    }
    const keywords = KEYWORDS[lang].map((k): Completion => ({ label: k, type: "keyword" }));
    return { from: word.from, options: [...seen.values(), ...keywords], validFor: /^\w*$/ };
  };
}

const LANGUAGES = { cpp, java, python };
const LABELS: Record<ExerciseLang, string> = { cpp: "C++", java: "Java", python: "Python" };

export function Editor({ value, onChange, diagnostics, onHoverLine, onFormat, highlightLines, readOnly = false, lang = "cpp" }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef({ onChange, onHoverLine, onFormat });
  cb.current = { onChange, onHoverLine, onFormat };

  useEffect(() => {
    if (!host.current) return;
    const format = () => {
      cb.current.onFormat?.();
      return cb.current.onFormat !== undefined;
    };
    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      // Typing { adds the matching }, and Enter between them opens an indented line with } below it.
      closeBrackets(),
      highlightActiveLine(),
      EditorView.lineWrapping,
      // Suggests variables, functions and keywords as you type; Tab or Enter accepts, Ctrl-Space opens the list.
      ...(readOnly ? [] : [autocompletion({ override: [nameCompletions(lang)], icons: false })]),
      keymap.of([{ key: "Shift-Alt-f", run: format }, ...closeBracketsKeymap, ...completionKeymap, ...defaultKeymap, ...historyKeymap, { key: "Tab", run: acceptCompletion }, indentWithTab]),
      LANGUAGES[lang](),
      // The same width as CODE_STYLE, so a new line lines up with the formatted code around it.
      indentUnit.of("    "),
      syntaxHighlighting(highlight),
      theme,
      highlightField,
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      // A read-only editor is not focusable on its own, so a keyboard user could not scroll a long solution.
      EditorView.contentAttributes.of(
        readOnly ? { "aria-label": "Solution code, read only", tabindex: "0", spellcheck: "false" } : { "aria-label": `${LABELS[lang]} code editor`, spellcheck: "false" },
      ),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) cb.current.onChange(u.state.doc.toString());
      }),
      EditorView.domEventHandlers({
        mousemove(event, v) {
          const pos = v.posAtCoords({ x: event.clientX, y: event.clientY });
          cb.current.onHoverLine?.(pos === null ? null : v.state.doc.lineAt(pos).number);
        },
        mouseleave() {
          cb.current.onHoverLine?.(null);
        },
      }),
    ];
    const v = new EditorView({ parent: host.current, state: EditorState.create({ doc: value, extensions }) });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor is created once; later prop changes are pushed in by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, lang]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const before = v.state.doc.toString();
    if (before === value) return;
    v.dispatch({
      changes: { from: 0, to: before.length, insert: value },
      selection: { anchor: sameSpot(before, value, v.state.selection.main.head) },
      // One undo takes back the format alone, not the typing just before it.
      annotations: isolateHistory.of("full"),
    });
  }, [value]);

  useEffect(() => {
    const v = view.current;
    if (v) v.dispatch(setDiagnostics(v.state, toCm(v.state.doc, diagnostics)));
  }, [diagnostics]);

  useEffect(() => {
    view.current?.dispatch({ effects: setHighlight.of(highlightLines ?? []) });
  }, [highlightLines]);

  return <div ref={host} className="code-editor" />;
}
