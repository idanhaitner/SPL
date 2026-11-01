"use client";

import { cpp } from "@codemirror/lang-cpp";
import { setDiagnostics, type Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { EditorState, StateEffect, StateField, type Extension } from "@codemirror/state";
import { Decoration, EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab, isolateHistory } from "@codemirror/commands";
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { useEffect, useRef } from "react";
import type { Diagnostic } from "@/lib/run-result";

type Props = {
  value: string;
  onChange(v: string): void;
  diagnostics: Diagnostic[];
  onHoverLine?(line: number | null): void;
  onFormat?(): void;
  highlightLines?: number[];
  readOnly?: boolean;
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

export function Editor({ value, onChange, diagnostics, onHoverLine, onFormat, highlightLines, readOnly = false }: Props) {
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
      highlightActiveLine(),
      EditorView.lineWrapping,
      keymap.of([{ key: "Shift-Alt-f", run: format }, { key: "Mod-s", run: format }, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      cpp(),
      syntaxHighlighting(highlight),
      theme,
      highlightField,
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      // A read-only editor is not focusable on its own, so a keyboard user could not scroll a long solution.
      EditorView.contentAttributes.of(
        readOnly ? { "aria-label": "Solution code, read only", tabindex: "0", spellcheck: "false" } : { "aria-label": "C code editor", spellcheck: "false" },
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
  }, [readOnly]);

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
