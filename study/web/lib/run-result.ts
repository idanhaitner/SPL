export type Diagnostic = { line: number; column: number; severity: "error" | "warning" | "note"; text: string };
// `stdout` is capped for display; `fullStdout` is kept whole for reading test
// results, and `cutOff` says the online compiler itself cut the output short.
type RunOutput = { stdout: string; stderr: string; fullStdout: string; cutOff: boolean };
export type RunOutcome =
  | { kind: "compile-error"; diagnostics: Diagnostic[]; text: string; hint: string | null }
  | ({ kind: "timeout" } & RunOutput)
  // `signal` is null when a sanitizer report, not a signal, stopped the program.
  | ({ kind: "crash"; signal: number | null; name: string; explanation: string } & RunOutput)
  | ({ kind: "ok"; exitCode: number; truncated: boolean; warnings: Diagnostic[] } & RunOutput);

export const OUTPUT_CAP = 10_000;

const MAIN_TWICE_HINT =
  "Your code has its own `main`. In this exercise the tests bring their own `main`, so delete yours.";

const SIGNALS: Record<number, { name: string; explanation: string }> = {
  11: {
    name: "Segmentation fault",
    explanation:
      "Your program used memory it does not own. This is often a bad pointer or an index past the end of an array.",
  },
  8: {
    name: "Arithmetic error",
    explanation: "Your program did math the processor refuses, most often dividing an integer by zero.",
  },
  6: {
    name: "Aborted",
    explanation: "Your program stopped itself on purpose, usually because a check (like assert) failed.",
  },
  7: {
    name: "Bus error",
    explanation: "Your program read memory at an address the processor cannot use, often through a bad pointer.",
  },
};

// Reports the sanitizers print when they find a memory or C-rules error.
const SANITIZER_REPORTS: { pattern: RegExp; name: string; explanation: string }[] = [
  {
    pattern: /AddressSanitizer: (?:stack|heap|global)-buffer-overflow\b/,
    name: "Read or write past the end of an array",
    explanation:
      "Your program used a position outside an array, often because a loop went one step too far (for example `i <= n` instead of `i < n`).",
  },
  {
    pattern: /AddressSanitizer: (?:heap-use-after-free|stack-use-after-return)\b/,
    name: "Used memory after it was given back",
    explanation: "Your program used memory that was already released with `delete`, or a local variable after its function returned.",
  },
  {
    pattern: /AddressSanitizer: attempting double-free\b/,
    name: "Released the same memory twice",
    explanation: "Your program called `delete` on an address that was already released. Often two objects think they own the same memory.",
  },
  {
    pattern: /AddressSanitizer: alloc-dealloc-mismatch\b/,
    name: "The wrong kind of delete",
    explanation: "Memory from `new[]` must be released with `delete[]`, and memory from `new` with `delete`.",
  },
  {
    pattern: /LeakSanitizer: detected memory leaks\b/,
    name: "Memory was never released",
    explanation: "Your program asked for memory with `new` and finished without releasing it. Every `new` needs a matching `delete`.",
  },
];

const UNDEFINED_BEHAVIOR = {
  name: "Undefined behavior",
  explanation:
    "Your program did something the C++ rules do not allow, such as an int growing too large. The line is shown in the error output below.",
};

type Line = { text?: unknown; tag?: { line?: unknown; column?: unknown; text?: unknown; severity?: unknown } };

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
const stripAnsi = (s: string): string => s.replace(ANSI, "");

function asObject(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

function lines(v: unknown): Line[] {
  return Array.isArray(v) ? (v as Line[]) : [];
}

function joinText(v: unknown): string {
  return lines(v)
    .map((l) => stripAnsi(typeof l.text === "string" ? l.text : ""))
    .join("\n");
}

function diagnosticsOf(v: unknown): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const l of lines(v)) {
    const tag = l.tag;
    if (!tag || typeof tag.line !== "number") continue;
    const severity = tag.severity === 3 ? "error" : tag.severity === 2 ? "warning" : "note";
    const text = stripAnsi(typeof tag.text === "string" ? tag.text : "").replace(
      /^(?:fatal error|error|warning|note): /,
      "",
    );
    out.push({ line: tag.line, column: typeof tag.column === "number" ? tag.column : 0, severity, text });
  }
  return out;
}

export function explainBuildError(text: string): string | null {
  return /multiple definition of [`'"]?main|redefinition of [`'"]?main/.test(text) ? MAIN_TWICE_HINT : null;
}

export function classifyRun(response: unknown): RunOutcome {
  const r = asObject(response);
  const build = asObject(r.buildResult);

  if (r.didExecute === false) {
    const text = joinText(build.stderr);
    return {
      kind: "compile-error",
      diagnostics: diagnosticsOf(build.stderr),
      text,
      hint: explainBuildError(text),
    };
  }

  const code = typeof r.code === "number" ? r.code : 0;
  const stdoutFull = joinText(r.stdout);
  const stderrFull = joinText(r.stderr);
  const output = {
    stdout: stdoutFull.slice(0, OUTPUT_CAP),
    stderr: stderrFull.slice(0, OUTPUT_CAP),
    fullStdout: stdoutFull,
    cutOff: r.truncated === true,
  };

  // Timeout first: it exits with 143, which would otherwise read as signal 15.
  if (r.timedOut === true) return { kind: "timeout", ...output };

  // Sanitizer reports only count when they stopped the program with an error.
  if (code !== 0) {
    const report = SANITIZER_REPORTS.find((x) => x.pattern.test(stderrFull));
    if (report) return { kind: "crash", signal: null, name: report.name, explanation: report.explanation, ...output };
  }

  // With the sanitizer on, AddressSanitizer catches the signal itself and the
  // program exits with 1, so read the signal from its report instead.
  const asan = code !== 0 ? /AddressSanitizer: (SEGV|FPE|ABRT|BUS)\b/.exec(stderrFull) : null;
  const asanSignal = asan ? { SEGV: 11, FPE: 8, ABRT: 6, BUS: 7 }[asan[1] as "SEGV" | "FPE" | "ABRT" | "BUS"] : 0;
  const signal = asanSignal || (code > 128 ? code - 128 : code < 0 ? -code : 0);
  if (signal > 0) {
    const info = SIGNALS[signal] ?? {
      name: `Signal ${signal}`,
      explanation: "Your program was stopped by the operating system.",
    };
    return { kind: "crash", signal, name: info.name, explanation: info.explanation, ...output };
  }

  if (code !== 0 && /runtime error:/.test(stderrFull)) {
    return { kind: "crash", signal: null, ...UNDEFINED_BEHAVIOR, ...output };
  }

  return {
    kind: "ok",
    exitCode: code,
    ...output,
    truncated: output.cutOff || stdoutFull.length > OUTPUT_CAP || stderrFull.length > OUTPUT_CAP,
    warnings: diagnosticsOf(build.stderr).filter((d) => d.severity !== "error"),
  };
}

export function splitDiagnostics(
  d: Diagnostic[],
  studentLines: number,
): { inEditor: Diagnostic[]; inTests: Diagnostic[] } {
  return {
    inEditor: d.filter((x) => x.line <= studentLines),
    inTests: d.filter((x) => x.line > studentLines),
  };
}
