import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyRun, splitDiagnostics, OUTPUT_CAP } from "./run-result";

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./fixtures/godbolt/${name}.json`, import.meta.url), "utf8"));

describe("classifyRun", () => {
  it("reads a successful run", () => {
    const r = classifyRun(fixture("run-ok"));
    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("3");
    expect(r.stdout).toContain("hello");
  });

  it("reads a compile error with its line and no escape codes", () => {
    const r = classifyRun(fixture("run-compile-error"));
    expect(r.kind).toBe("compile-error");
    if (r.kind !== "compile-error") return;
    expect(r.diagnostics.some((d) => d.severity === "error" && d.line === 1)).toBe(true);
    expect(r.text).not.toContain("\u001b");
    expect(r.hint).toBeNull();
  });

  it("explains a segfault", () => {
    const r = classifyRun(fixture("run-segfault"));
    expect(r.kind).toBe("crash");
    if (r.kind !== "crash") return;
    expect(r.signal).toBe(11);
    expect(r.name).toBe("Segmentation fault");
    expect(r.explanation).toBe(
      "Your program used memory it does not own. This is often a bad pointer or an index past the end of an array.",
    );
  });

  it("reads a segfault caught by AddressSanitizer, which exits with 1", () => {
    const r = classifyRun(fixture("run-asan-segv"));
    expect(r.kind).toBe("crash");
    if (r.kind !== "crash") return;
    expect(r.signal).toBe(11);
    expect(r.name).toBe("Segmentation fault");
  });

  it("ignores a sanitizer SEGV line when the program still exits with 0", () => {
    const r = classifyRun({
      didExecute: true,
      code: 0,
      stdout: [{ text: "ok" }],
      stderr: [{ text: "==2==ERROR: AddressSanitizer: SEGV on unknown address 0x000000000000" }],
      buildResult: { stderr: [] },
    });
    expect(r.kind).toBe("ok");
  });

  it("explains an array read past the end, caught by AddressSanitizer", () => {
    const r = classifyRun(fixture("run-asan-stack-overflow"));
    expect(r.kind).toBe("crash");
    if (r.kind !== "crash") return;
    expect(r.signal).toBeNull();
    expect(r.name).toBe("Read or write past the end of an array");
    expect(r.explanation).toBe(
      "Your program used a position outside an array, often because a loop went one step too far (for example `i <= n` instead of `i < n`).",
    );
    expect(r.stderr).toContain("stack-buffer-overflow");
    expect(r.stderr).not.toContain("\u001b");
  });

  it.each(["heap-buffer-overflow", "global-buffer-overflow"])("treats %s as past the end of an array", (what) => {
    const r = classifyRun({
      didExecute: true,
      code: 1,
      stdout: [],
      stderr: [{ text: `==2==ERROR: AddressSanitizer: ${what} on address 0x602000000014` }],
    });
    expect(r).toMatchObject({ kind: "crash", name: "Read or write past the end of an array" });
  });

  it.each(["heap-use-after-free", "stack-use-after-return"])("treats %s as memory used after it was given back", (what) => {
    const r = classifyRun({
      didExecute: true,
      code: 1,
      stdout: [{ text: "partial" }],
      stderr: [{ text: `==2==ERROR: AddressSanitizer: ${what} on address 0x602000000014` }],
    });
    expect(r).toMatchObject({
      kind: "crash",
      signal: null,
      name: "Used memory after it was given back",
      explanation: "Your program used memory that was already released with `delete`, or a local variable after its function returned.",
      stdout: "partial",
    });
  });

  it("explains undefined behavior when the program exits with an error", () => {
    const r = classifyRun(fixture("run-ubsan-exit-1"));
    expect(r).toMatchObject({
      kind: "crash",
      signal: null,
      name: "Undefined behavior",
      explanation:
        "Your program did something the C++ rules do not allow, such as an int growing too large. The line is shown in the error output below.",
    });
    if (r.kind !== "crash") return;
    expect(r.stderr).toContain("runtime error:");
  });

  it("leaves an undefined-behavior report alone when the program exits with 0", () => {
    const r = classifyRun(fixture("run-ubsan-overflow"));
    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;
    expect(r.stderr).toContain("runtime error:");
  });

  it("decides timeout before reading the exit code as a signal", () => {
    const r = classifyRun(fixture("run-timeout"));
    expect(r.kind).toBe("timeout");
    if (r.kind !== "timeout") return;
    expect(typeof r.stdout).toBe("string");
    expect(typeof r.stderr).toBe("string");
  });

  it("hints when the student defines main twice", () => {
    const r = classifyRun(fixture("run-main-twice"));
    expect(r.kind).toBe("compile-error");
    if (r.kind !== "compile-error") return;
    expect(r.hint).toBe(
      "Your code has its own `main`. In this exercise the tests bring their own `main`, so delete yours.",
    );
  });

  it("caps long output and flags it truncated", () => {
    const r = classifyRun({
      didExecute: true,
      code: 0,
      timedOut: false,
      stdout: [{ text: "x".repeat(12_000) }],
      stderr: [],
    });
    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;
    expect(r.stdout.length).toBe(OUTPUT_CAP);
    expect(r.truncated).toBe(true);
  });

  it("keeps the full output for reading test results", () => {
    const long = "x".repeat(12_000);
    const r = classifyRun({
      didExecute: true,
      code: 0,
      timedOut: false,
      stdout: [{ text: long }, { text: "PASS last" }],
      stderr: [],
    });
    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;
    expect(r.fullStdout).toBe(`${long}\nPASS last`);
    expect(r.cutOff).toBe(false);
  });

  it("notes when the online compiler itself cut the output off", () => {
    const r = classifyRun({ didExecute: true, code: 0, truncated: true, stdout: [{ text: "x" }], stderr: [] });
    expect(r).toMatchObject({ kind: "ok", truncated: true, cutOff: true });
  });

  it("names other signals generically", () => {
    const r = classifyRun({ didExecute: true, code: 128 + 15, timedOut: false, stdout: [], stderr: [] });
    expect(r).toMatchObject({ kind: "crash", signal: 15, name: "Signal 15" });
  });
});

describe("splitDiagnostics", () => {
  it("separates editor lines from test lines", () => {
    const mk = (line: number) => ({ line, column: 1, severity: "error" as const, text: "x" });
    const r = splitDiagnostics([mk(2), mk(9)], 5);
    expect(r.inEditor.map((d) => d.line)).toEqual([2]);
    expect(r.inTests.map((d) => d.line)).toEqual([9]);
  });
});

describe("C++ memory reports", () => {
  const report = (text: string, code = 1) => classifyRun({ didExecute: true, code, stdout: [], stderr: [{ text }], buildResult: { stderr: [] } });
  it.each([
    ["\u001b[1m\u001b[31m==2==ERROR: AddressSanitizer: heap-buffer-overflow on address", "Read or write past the end of an array"],
    ["==2==ERROR: AddressSanitizer: attempting double-free on 0x1", "Released the same memory twice"],
    ["==2==ERROR: AddressSanitizer: alloc-dealloc-mismatch (operator new [] vs operator delete)", "The wrong kind of delete"],
    ["==2==ERROR: LeakSanitizer: detected memory leaks", "Memory was never released"],
  ])("explains %s", (text, name) => {
    const outcome = report(text);
    expect(outcome.kind).toBe("crash");
    if (outcome.kind === "crash") expect(outcome.name).toBe(name);
  });
  it("strips color codes and explains a segmentation fault", () => {
    const outcome = report("Program terminated with signal SIGSEGV (11)", 139);
    expect(outcome.kind === "crash" && outcome.name).toBe("Segmentation fault");
    expect(report("\u001b[1mplain\u001b[0m", 0).kind === "ok" && (report("\u001b[1mplain\u001b[0m", 0) as { stderr: string }).stderr).toBe("plain");
  });
  it("names a program that ran too long", () => {
    expect(classifyRun({ didExecute: true, code: 143, timedOut: true, stdout: [], stderr: [] }).kind).toBe("timeout");
  });
});
