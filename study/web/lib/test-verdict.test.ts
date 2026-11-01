import { describe, expect, it } from "vitest";
import type { RunOutcome } from "./run-result";
import { functionVerdict, programVerdict } from "./test-verdict";

const ok = (stdout: string, cutOff = false): Extract<RunOutcome, { kind: "ok" }> => ({
  kind: "ok",
  exitCode: 0,
  stdout,
  stderr: "",
  truncated: cutOff,
  warnings: [],
  fullStdout: stdout,
  cutOff,
});
const crash = (stdout: string): RunOutcome => ({
  kind: "crash",
  signal: null,
  name: "Read or write past the end of an array",
  explanation: "x",
  stdout,
  stderr: "==2==ERROR: AddressSanitizer: stack-buffer-overflow",
  fullStdout: stdout,
  cutOff: false,
});
const timeout = (stdout: string): RunOutcome => ({ kind: "timeout", stdout, stderr: "", fullStdout: stdout, cutOff: false });
const compileError: RunOutcome = { kind: "compile-error", diagnostics: [], text: "boom", hint: null };

describe("functionVerdict", () => {
  it("is done when every case passes", () => {
    const v = functionVerdict(ok("PASS a\nPASS b\n"), ["a", "b"]);
    expect(v).toMatchObject({ kind: "cases", outcome: null, done: true });
  });

  it("shows a crash above the cases and keeps the cases that did not run", () => {
    const o = crash("PASS a\n");
    const v = functionVerdict(o, ["a", "b"]);
    expect(v.kind).toBe("cases");
    if (v.kind !== "cases") return;
    expect(v.outcome).toBe(o);
    expect(v.done).toBe(false);
    expect(v.cases.map((c) => c.status)).toEqual(["pass", "not-run"]);
  });

  it("shows a timeout above the cases", () => {
    const o = timeout("");
    const v = functionVerdict(o, ["a"]);
    expect(v).toMatchObject({ kind: "cases", outcome: o, done: false });
  });

  it("shows a compile error on its own", () => {
    expect(functionVerdict(compileError, ["a"])).toEqual({ kind: "outcome", outcome: compileError });
  });

  it("does not show a normal finish above failing cases", () => {
    const v = functionVerdict(ok("PASS a\nFAIL b: expected 1, got 2\n"), ["a", "b"]);
    expect(v).toMatchObject({ kind: "cases", outcome: null, done: false });
  });

  it("reads cases from the full output and says when the output was cut off", () => {
    const o: RunOutcome = { ...ok("x".repeat(10)), fullStdout: "x\nPASS a\n" };
    const v = functionVerdict(o, ["a"]);
    expect(v).toMatchObject({ kind: "cases", done: true });
    const cut = functionVerdict(ok("PASS a\n", true), ["a", "b"]);
    if (cut.kind !== "cases") throw new Error("expected cases");
    expect(cut.cases[1].message).toBe(
      "Not checked: your program printed so much that the output was cut off. Remove extra printf calls and test again.",
    );
  });
});

describe("programVerdict", () => {
  it("is done when every case prints what was expected", () => {
    const v = programVerdict([
      { name: "one", expected: "1\n", outcome: ok("1\n") },
      { name: "two", expected: "2\n", outcome: ok("2") },
    ]);
    expect(v).toMatchObject({ kind: "cases", outcome: null, done: true });
  });

  it("shows the first crash or timeout above the cases and keeps every case", () => {
    const first = crash("");
    const v = programVerdict([
      { name: "one", expected: "1\n", outcome: ok("1\n") },
      { name: "two", expected: "2\n", outcome: first },
      { name: "three", expected: "3\n", outcome: timeout("") },
    ]);
    expect(v.kind).toBe("cases");
    if (v.kind !== "cases") return;
    expect(v.outcome).toBe(first);
    expect(v.done).toBe(false);
    expect(v.cases.map((c) => c.status)).toEqual(["pass", "fail", "fail"]);
    expect(v.cases[2].message).toBe("Your program ran too long. Is there a loop that never stops?");
  });

  it("explains wrong output", () => {
    const v = programVerdict([{ name: "one", expected: "1\n", outcome: ok("2\n") }]);
    if (v.kind !== "cases") throw new Error("expected cases");
    expect(v.cases[0]).toEqual({ name: "one", status: "fail", message: "Expected:\n1\n\nYour program printed:\n2\n" });
    expect(v.outcome).toBeNull();
  });

  it("shows a compile error on its own", () => {
    const v = programVerdict([{ name: "one", expected: "1\n", outcome: compileError }]);
    expect(v).toEqual({ kind: "outcome", outcome: compileError });
  });

  it("is not done with no cases", () => {
    expect(programVerdict([])).toMatchObject({ kind: "cases", done: false });
  });
});
