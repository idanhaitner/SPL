import type { RunOutcome } from "./run-result";
import { outputsMatch, parseTestOutput, type CaseResult } from "./test-output";

// What the Test button shows: a compile error on its own, or the case list
// with any crash or timeout shown above it.
export type TestVerdict =
  | { kind: "outcome"; outcome: RunOutcome }
  | { kind: "cases"; cases: CaseResult[]; outcome: RunOutcome | null; done: boolean };

export type ProgramRun = { name: string; expected: string; outcome: RunOutcome };

const TOO_LONG = "Your program ran too long. Is there a loop that never stops?";

const allPass = (cases: CaseResult[]): boolean => cases.length > 0 && cases.every((c) => c.status === "pass");

export function functionVerdict(outcome: RunOutcome, names: string[]): TestVerdict {
  if (outcome.kind === "compile-error") return { kind: "outcome", outcome };
  const cases = parseTestOutput(outcome.fullStdout, names, outcome.cutOff);
  return { kind: "cases", cases, outcome: outcome.kind === "ok" ? null : outcome, done: allPass(cases) };
}

function programCase({ name, expected, outcome }: ProgramRun): CaseResult {
  if (outcome.kind === "ok") {
    return outputsMatch(outcome.fullStdout, expected)
      ? { name, status: "pass", message: "" }
      : { name, status: "fail", message: `Expected:\n${expected}\nYour program printed:\n${outcome.stdout}` };
  }
  if (outcome.kind === "timeout") return { name, status: "fail", message: TOO_LONG };
  if (outcome.kind === "crash") return { name, status: "fail", message: `${outcome.name}. ${outcome.explanation}` };
  return { name, status: "fail", message: "" };
}

export function programVerdict(runs: ProgramRun[]): TestVerdict {
  const broken = runs.find((r) => r.outcome.kind === "compile-error");
  if (broken) return { kind: "outcome", outcome: broken.outcome };
  const cases = runs.map(programCase);
  const shown = runs.find((r) => r.outcome.kind !== "ok")?.outcome ?? null;
  return { kind: "cases", cases, outcome: shown, done: allPass(cases) };
}
