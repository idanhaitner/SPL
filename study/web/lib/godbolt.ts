import { classifyRun, type RunOutcome } from "./run-result";
import type { ExerciseLang } from "./types";

export const GODBOLT_COMPILER = "g162";

// Godbolt runs Java and Python through the same endpoint. Its Java sandbox cannot start threads,
// so Java exercises must not use Thread, executors, or sockets.
const COMPILERS: Record<ExerciseLang, string> = { cpp: GODBOLT_COMPILER, java: "java2102", python: "python313" };
export const GODBOLT_BASE = "https://godbolt.org/api";

export const REQUEST_TIMEOUT_MS = 30_000; // godbolt itself takes about 21 s to report an infinite loop
export const COOLDOWN_MS = 3_000;

export class GodboltError extends Error {
  kind: "unreachable" | "rate-limited";
  retryAfter: number;

  constructor(kind: "unreachable" | "rate-limited", retryAfter = 0) {
    super(
      kind === "rate-limited"
        ? `Too many runs in a short time — try again in ${retryAfter || 30} seconds.`
        : "The online compiler can't be reached right now.",
    );
    this.name = "GodboltError";
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

export const RUN_FLAGS = "-std=c++17 -Wall -Wextra -Wno-unused-parameter -O0 -g -fsanitize=address,undefined";

async function post(compiler: string, body: unknown, fetchImpl: typeof fetch): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${GODBOLT_BASE}/compiler/${compiler}/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.status === 429) {
      const seconds = Number(response.headers.get("Retry-After"));
      throw new GodboltError("rate-limited", Number.isFinite(seconds) && seconds > 0 ? seconds : 0);
    }
    if (!response.ok) throw new GodboltError("unreachable");
    return await response.json();
  } catch (error) {
    if (error instanceof GodboltError) throw error;
    throw new GodboltError("unreachable");
  } finally {
    clearTimeout(timer);
  }
}

export async function runProgram(
  source: string,
  opts: { args?: string[]; stdin?: string; lang?: ExerciseLang; fetchImpl?: typeof fetch } = {},
): Promise<RunOutcome> {
  const lang = opts.lang ?? "cpp";
  const json = await post(
    COMPILERS[lang],
    {
      source,
      options: {
        userArguments: lang === "cpp" ? RUN_FLAGS : "",
        executeParameters: { args: opts.args ?? [], stdin: opts.stdin ?? "" },
        compilerOptions: { executorRequest: true },
        filters: { execute: true },
        tools: [],
        libraries: [],
      },
    },
    opts.fetchImpl ?? fetch,
  );
  return classifyRun(json);
}
