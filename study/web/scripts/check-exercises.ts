// Compiles every exercise: each solution must pass all its tests with no warnings, and each starter must fail at least one.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildTestSource, parseTestOutput } from "../lib/test-output";

const FLAGS = ["-std=c++17", "-Wall", "-Wextra", "-Wno-unused-parameter", "-O0", "-g"];
const repoRoot = path.resolve(process.cwd(), "../..");

type Exercise = { id: string; lang: "cpp" | "java" | "python"; harness: string; starter: string; solution: string; test: string | null; caseNames: string[]; examples: unknown[] };
type Course = { harness: string; topics: { exercises?: Exercise[] }[] };

const raw = execFileSync("python3", [path.join(process.cwd(), "scripts", "course-export", "export_course.py"), "--root", repoRoot], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const course = JSON.parse(raw) as Course;
const exercises = course.topics.flatMap((topic) => topic.exercises ?? []);
const problems: string[] = [];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-exercises-"));

function attempt(ex: Exercise, code: string, name: string) {
  const dir = path.join(tmp, ex.id, name);
  fs.mkdirSync(dir, { recursive: true });
  const source = buildTestSource(code, ex.harness || course.harness, ex.test ?? "").source;
  let build: ReturnType<typeof spawnSync>;
  let command: [string, string[]];
  if (ex.lang === "java") {
    // Godbolt compiles one file with no public class, so the tests' class Main is run from a plain main.java.
    fs.writeFileSync(path.join(dir, "main.java"), source);
    build = spawnSync("javac", ["-Xlint:all", "-d", dir, path.join(dir, "main.java")], { encoding: "utf8", timeout: 60000 });
    command = ["java", ["-cp", dir, "Main"]];
  } else if (ex.lang === "python") {
    fs.writeFileSync(path.join(dir, "main.py"), source);
    build = spawnSync("python3", ["-I", "-m", "py_compile", path.join(dir, "main.py")], { encoding: "utf8", timeout: 60000 });
    command = ["python3", ["-I", path.join(dir, "main.py")]];
  } else {
    const src = path.join(dir, "main.cpp");
    fs.writeFileSync(src, source);
    build = spawnSync("g++", [...FLAGS, src, "-o", path.join(dir, "prog")], { encoding: "utf8", timeout: 60000 });
    command = [path.join(dir, "prog"), []];
  }
  if (build.status !== 0) return { compiled: false, warnings: "", message: String(build.stderr ?? "").trim().split("\n")[0], failed: [] as string[] };
  const run = spawnSync(command[0], command[1], { encoding: "utf8", timeout: 10000, killSignal: "SIGKILL" });
  const results = parseTestOutput(run.stdout ?? "", ex.caseNames);
  const warnings = ex.lang === "python" ? "" : String(build.stderr ?? "").trim();
  return { compiled: true, warnings, message: "", failed: results.filter((item) => item.status !== "pass").map((item) => `"${item.name}": ${item.message || item.status}`) };
}

try {
  for (const ex of exercises) {
    if (ex.examples.length === 0) problems.push(`${ex.id}: needs at least one :::example block`);
    if (ex.caseNames.length < 3) problems.push(`${ex.id}: needs at least 3 tests, found ${ex.caseNames.length}`);
    const solution = attempt(ex, ex.solution, "solution");
    if (!solution.compiled) problems.push(`${ex.id}: solution does not compile: ${solution.message}`);
    if (solution.warnings) problems.push(`${ex.id}: solution compiles with warnings: ${solution.warnings.split("\n")[0]}`);
    for (const failure of solution.failed) problems.push(`${ex.id}: solution fails ${failure}`);
    const starter = attempt(ex, ex.starter, "starter");
    if (!starter.compiled) problems.push(`${ex.id}: starter does not compile: ${starter.message}`);
    else if (starter.failed.length === 0) problems.push(`${ex.id}: starter already passes every test`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
for (const problem of problems) console.log(problem);
console.log(`${exercises.length} exercises checked: ${problems.length === 0 ? "all good" : `${problems.length} problems`}`);
process.exit(problems.length === 0 ? 0 : 1);
