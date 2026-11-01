"use client";

import { OUTPUT_CAP, type Diagnostic, type RunOutcome } from "@/lib/run-result";
import { splitDiagnostics } from "@/lib/run-result";
import type { CaseResult } from "@/lib/test-output";
import type { ReactNode } from "react";

export type CaseView = CaseResult & { hint: ReactNode | null };

// Explanations mark code with backticks, as in `i <= n`.
function WithCode({ text }: { text: string }) {
  return <>{text.split(/`([^`]*)`/).map((part, i) => (i % 2 === 1 ? <code key={i}>{part}</code> : part))}</>;
}

const where = (d: Diagnostic) => `Line ${d.line}${d.column > 0 ? `, column ${d.column}` : ""}`;

function DiagnosticList({ items }: { items: Diagnostic[] }) {
  return (
    <ul className="code-diags">
      {items.map((d, i) => (
        <li key={i} data-severity={d.severity}>
          <strong>{where(d)}</strong> ({d.severity}): {d.text}
        </li>
      ))}
    </ul>
  );
}

function Output({ stdout, stderr, truncated }: { stdout: string; stderr: string; truncated?: boolean }) {
  return (
    <>
      {stdout === "" && stderr === "" ? <p className="session-note">The program printed nothing.</p> : null}
      {stdout !== "" && <pre className="code-output" aria-label="Program output">{stdout}</pre>}
      {stderr !== "" && (
        <>
          <p className="code-label">Error output</p>
          <pre className="code-output code-output-err">{stderr}</pre>
        </>
      )}
      {truncated && <p className="code-label">Output cut off after {OUTPUT_CAP.toLocaleString("en-US")} characters.</p>}
    </>
  );
}

export function OutcomeView({ outcome, studentLines }: { outcome: RunOutcome; studentLines: number }) {
  if (outcome.kind === "compile-error") {
    const { inEditor, inTests } = splitDiagnostics(outcome.diagnostics, studentLines);
    return (
      <div className="code-result" data-state="bad">
        <p className="code-headline">Your code did not compile. The compiler (the tool that turns C++ into a program) found a problem.</p>
        {outcome.hint && <p><WithCode text={outcome.hint} /></p>}
        {inEditor.length > 0 && <DiagnosticList items={inEditor} />}
        {inTests.length > 0 && (
          <>
            <p className="code-label">In the test code</p>
            <DiagnosticList items={inTests} />
          </>
        )}
        {outcome.diagnostics.length === 0 && outcome.text !== "" && <pre className="code-output code-output-err">{outcome.text}</pre>}
      </div>
    );
  }
  if (outcome.kind === "timeout") {
    return (
      <div className="code-result" data-state="bad">
        <p className="code-headline">Your program ran too long. Is there a loop that never stops?</p>
        {(outcome.stdout !== "" || outcome.stderr !== "") && <Output stdout={outcome.stdout} stderr={outcome.stderr} />}
      </div>
    );
  }
  if (outcome.kind === "crash") {
    return (
      <div className="code-result" data-state="bad">
        <p className="code-headline">{outcome.name}</p>
        <p><WithCode text={outcome.explanation} /></p>
        {(outcome.stdout !== "" || outcome.stderr !== "") && <Output stdout={outcome.stdout} stderr={outcome.stderr} />}
      </div>
    );
  }
  return (
    <div className="code-result" data-state="ok">
      <Output stdout={outcome.stdout} stderr={outcome.stderr} truncated={outcome.truncated} />
      {outcome.exitCode !== 0 && <p className="code-label">The program finished with exit code {outcome.exitCode}.</p>}
      {outcome.warnings.length > 0 && (
        <>
          <p className="code-label">Compiler warnings</p>
          <DiagnosticList items={outcome.warnings} />
        </>
      )}
    </div>
  );
}

const CASE_ICON_PATH: Record<CaseResult["status"], string> = {
  pass: "M3.5 8.5l3 3 6-7",
  fail: "M4 4l8 8M12 4l-8 8",
  "not-run": "M4 8h8",
};

export function CaseList({ cases }: { cases: CaseView[] }) {
  const passed = cases.filter((c) => c.status === "pass").length;
  const allPassed = passed === cases.length;
  return (
    <div className="code-result code-verdict" data-state={allPassed ? "ok" : "bad"}>
      <p className="code-headline">
        {allPassed ? "All tests pass." : `${passed} of ${cases.length} tests pass.`}
        {allPassed && <span className="code-tally">{passed} of {cases.length}</span>}
      </p>
      <ul className="code-cases">
        {cases.map((c) => (
          <li key={c.name} data-status={c.status}>
            <svg className="code-case-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d={CASE_ICON_PATH[c.status]} />
            </svg>
            <span className="sr-only">{c.status === "pass" ? "Passed" : c.status === "fail" ? "Failed" : "Did not run"}: </span>
            <span className="code-case-name">{c.name}</span>
            {c.message && <pre className="code-output">{c.message}</pre>}
            {c.status === "fail" && c.hint && (
              <div className="code-casehint">
                <p className="code-label">Hint for this test</p>
                {c.hint}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
