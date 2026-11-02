"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { formatCode } from "@/lib/format";
import { COOLDOWN_MS, GodboltError, runProgram } from "@/lib/godbolt";
import { splitDiagnostics, type Diagnostic, type RunOutcome } from "@/lib/run-result";
import { clearCode, readCode, writeCode } from "@/lib/session-store";
import { buildTestSource } from "@/lib/test-output";
import { functionVerdict, programVerdict, type ProgramRun, type TestVerdict } from "@/lib/test-verdict";
import type { Exercise } from "@/lib/types";
import { workspaceShortcut } from "@/lib/workspace";
import { FunctionFinder } from "./FunctionFinder";
import { CaseList, OutcomeView, type CaseView } from "./OutcomeView";
import { QuestionPanel } from "./QuestionPanel";
import type { RenderedStep } from "./rendered";
import { ResultsPanel } from "./ResultsPanel";
import { QUESTION_SPLIT, Split } from "./Split";

const Editor = dynamic(() => import("./Editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="code-editor code-editor-loading">Loading the editor…</div>,
});

type Result =
  | { kind: "outcome"; outcome: RunOutcome; studentLines: number }
  | { kind: "cases"; cases: CaseView[]; outcome: RunOutcome | null; studentLines: number }
  | { kind: "error"; error: GodboltError };
type Action = "run" | "test";
type View = "question" | "code";
type Props = { exercise: Exercise; courseId: string; done: boolean; onComplete: () => void; harness: string; rendered: RenderedStep; moved: boolean; reread: ReactNode };

const NO_LINE_LIMIT = Number.MAX_SAFE_INTEGER;
const VIEWS: { id: View; label: string }[] = [
  { id: "question", label: "Question" },
  { id: "code", label: "Code" },
];

export function ExerciseStep({ exercise: ex, courseId, done, onComplete, harness, rendered, moved, reread }: Props) {
  const [code, setCode] = useState(() => (typeof window === "undefined" ? ex.starter : readCode(courseId, ex.id) ?? ex.starter));
  const [result, setResult] = useState<Result | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [busy, setBusy] = useState(false);
  const [cooling, setCooling] = useState(false);
  const [wait, setWait] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [lastAction, setLastAction] = useState<Action>("test");
  // Which side shows in the tab layout. It only changes an attribute, so the editor is never unmounted and keeps its cursor.
  const [view, setView] = useState<View>("question");

  const codeRef = useRef(code);
  const viewTabs = useRef<Record<View, HTMLButtonElement | null>>({ question: null, code: null });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coolTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const refocusReset = useRef(false);

  const flush = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      writeCode(courseId, ex.id, codeRef.current);
    }
  }, [courseId, ex.id]);

  useEffect(() => () => {
    flush();
    if (coolTimer.current) clearTimeout(coolTimer.current);
  }, [flush]);

  const edit = useCallback((value: string) => {
    codeRef.current = value;
    setCode(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      writeCode(courseId, ex.id, codeRef.current);
    }, 500);
  }, [courseId, ex.id]);

  const tidy = useCallback(async () => {
    const before = codeRef.current;
    const formatted = await formatCode(before);
    // The first format downloads the formatter, so the student may have typed something newer by now.
    if (formatted !== before && codeRef.current === before) edit(formatted);
  }, [edit]);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const showOutcome = (outcome: RunOutcome, studentLines: number) => {
    const found = outcome.kind === "compile-error" ? outcome.diagnostics : outcome.kind === "ok" ? outcome.warnings : [];
    setDiagnostics(splitDiagnostics(found, studentLines).inEditor);
  };

  // The prompt replaces the buttons that had focus, so focus moves with it and comes back when it closes.
  useEffect(() => {
    if (confirmReset) keepRef.current?.focus();
    else if (refocusReset.current) resetRef.current?.focus();
    refocusReset.current = false;
  }, [confirmReset]);

  const closeConfirm = () => {
    refocusReset.current = true;
    setConfirmReset(false);
  };

  // These run after tidy, so they read the ref: the `code` in this render is from before the format.
  const doRun = async () => {
    const current = codeRef.current;
    const source = ex.mode === "function" ? buildTestSource(current, harness, ex.test ?? "") : { source: current, studentLines: NO_LINE_LIMIT };
    const first = ex.cases[0];
    const outcome = await runProgram(source.source, ex.mode === "program" && first ? { args: first.args, stdin: first.stdin } : {});
    showOutcome(outcome, source.studentLines);
    setResult({ kind: "outcome", outcome, studentLines: source.studentLines });
  };

  const doTest = async () => {
    const current = codeRef.current;
    let verdict: TestVerdict;
    let studentLines = NO_LINE_LIMIT;
    if (ex.mode === "function") {
      const built = buildTestSource(current, harness, ex.test ?? "");
      studentLines = built.studentLines;
      const outcome = await runProgram(built.source);
      showOutcome(outcome, studentLines);
      verdict = functionVerdict(outcome, ex.caseNames);
    } else {
      const runs: ProgramRun[] = [];
      for (const item of ex.cases) {
        const outcome = await runProgram(current, { args: item.args, stdin: item.stdin });
        runs.push({ name: item.name, expected: item.expected, outcome });
        if (outcome.kind === "compile-error") break;
      }
      verdict = programVerdict(runs);
      if (verdict.kind === "outcome") showOutcome(verdict.outcome, NO_LINE_LIMIT);
      else setDiagnostics([]);
    }
    if (verdict.kind === "outcome") {
      setResult({ kind: "outcome", outcome: verdict.outcome, studentLines });
      return;
    }
    const hints = new Map<string, ReactNode>(
      ex.mode === "function" ? Object.entries(rendered.caseHints ?? {}) : ex.cases.filter((item) => item.hint).map((item) => [item.name, <p key={item.name}>{item.hint}</p>]),
    );
    setResult({ kind: "cases", cases: verdict.cases.map((item) => ({ ...item, hint: hints.get(item.name) ?? null })), outcome: verdict.outcome, studentLines });
    if (verdict.done) onComplete();
  };

  const locked = busy || cooling || wait > 0;

  const act = async (action: Action) => {
    if (locked) return;
    setLastAction(action);
    setBusy(true);
    setConfirmReset(false);
    setView("code");
    try {
      await tidy();
      await (action === "run" ? doRun() : doTest());
    } catch (error) {
      const failure = error instanceof GodboltError ? error : new GodboltError("unreachable");
      setResult({ kind: "error", error: failure });
      if (failure.kind === "rate-limited") setWait(failure.retryAfter || 30);
    } finally {
      setBusy(false);
      setCooling(true);
      coolTimer.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
    }
  };

  // Capture phase, so this runs before CodeMirror's own Mod-Enter, which would add a blank line.
  // The key is swallowed even while the reset prompt is open, or Cmd+S would open the browser's save dialog.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const shortcut = workspaceShortcut(event);
      if (!shortcut) return;
      event.preventDefault();
      event.stopPropagation();
      if (!confirmReset) act(shortcut === "run" ? "run" : "test");
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  });

  const reset = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    clearCode(courseId, ex.id);
    codeRef.current = ex.starter;
    setCode(ex.starter);
    setResult(null);
    setDiagnostics([]);
    closeConfirm();
  };

  const moveView = (event: KeyboardEvent, from: View) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = from === "question" ? "code" : "question";
    setView(next);
    viewTabs.current[next]?.focus();
  };

  const error = result?.kind === "error" ? result.error : null;

  return (
    <div className="code-step" data-view={view}>
      <div className="workspace-views" role="tablist" aria-label="Exercise">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            ref={(element) => { viewTabs.current[item.id] = element; }}
            type="button"
            role="tab"
            className="results-tab"
            aria-selected={view === item.id}
            aria-controls={`workspace-${item.id}`}
            tabIndex={view === item.id ? 0 : -1}
            onClick={() => setView(item.id)}
            onKeyDown={(event) => moveView(event, item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Split
        {...QUESTION_SPLIT}
        courseId={courseId}
        label="Resize the question and code panels"
        first={
          <div id="workspace-question" className="workspace-fill">
            <QuestionPanel
              title={ex.title}
              content={rendered.content}
              examples={rendered.examples ?? []}
              hints={rendered.hints ?? []}
              renderSolution={() => <Editor value={ex.solution} onChange={() => {}} diagnostics={[]} readOnly />}
              focusTitle={moved}
              reread={reread}
            />
          </div>
        }
        second={
          <div id="workspace-code" className="workspace-code">
            <Split
              courseId={courseId}
              name="results"
              orientation="horizontal"
              start={0.62}
              minFirst={160}
              minSecond={120}
              label="Resize the editor and results panels"
              first={<Editor value={code} onChange={edit} diagnostics={diagnostics} onFormat={tidy} />}
              second={
                <ResultsPanel>
                  {result === null && <p className="results-empty">Run shows what your code prints. Submit checks it against the tests.</p>}
                  {busy && <p className="results-empty" role="status">Compiling and running…</p>}
                  {error && (
                    <div className="code-result" data-state="bad">
                      <p className="code-headline">{error.message}</p>
                      <p>Your code is safe. It stays here.</p>
                      <div className="code-actions">
                        <button type="button" className="gh-pill" onClick={() => act(lastAction)} disabled={locked}>{wait > 0 ? `Retry in ${wait}s` : "Retry"}</button>
                      </div>
                    </div>
                  )}
                  {result?.kind === "outcome" && <OutcomeView outcome={result.outcome} studentLines={result.studentLines} />}
                  {result?.kind === "cases" && (
                    <>
                      {result.outcome && <OutcomeView outcome={result.outcome} studentLines={result.studentLines} />}
                      <CaseList cases={result.cases} />
                    </>
                  )}
                </ResultsPanel>
              }
            />
            <div className="workspace-actions">
              {confirmReset ? (
                <div className="code-confirm" role="alert" onKeyDown={(event) => { if (event.key === "Escape") closeConfirm(); }}>
                  <p>Replace your code with the starter code?</p>
                  <button type="button" className="gh-pill" ref={keepRef} onClick={closeConfirm}>Keep my code</button>
                  <button type="button" className="gh-pill is-danger" onClick={reset}>Yes, reset</button>
                </div>
              ) : (
                <>
                  <button type="button" className="session-quiet code-reset" ref={resetRef} onClick={() => setConfirmReset(true)}>Reset</button>
                  <p className="workspace-note">Your code is sent to godbolt.org to compile and run.</p>
                  <button type="button" className="gh-pill" onClick={() => act("run")} disabled={locked} title="Run (Ctrl+S or Cmd+S, Ctrl+Enter or Cmd+Enter)">Run</button>
                  {/* Once the step is solved, Next in the bar is the one primary action. */}
                  <button type="button" className={done ? "gh-pill" : "gh-btn is-compact"} onClick={() => act("test")} disabled={locked} title="Submit (Ctrl+Shift+Enter or Cmd+Shift+Enter)">Submit</button>
                </>
              )}
            </div>
            <FunctionFinder />
          </div>
        }
      />
    </div>
  );
}
