import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Block, Course } from "./types";

const repoRoot = path.resolve(process.cwd(), "../..");

function contentStamp(root: string) {
  const content = path.join(root, "study", "content");
  const files = [path.join(content, "course.yml")];
  const topics = path.join(content, "topics");
  if (fs.existsSync(topics)) {
    for (const name of fs.readdirSync(topics)) {
      if (name.endsWith(".md")) files.push(path.join(topics, name));
    }
  }
  const exercises = path.join(content, "exercises");
  if (fs.existsSync(exercises)) {
    for (const name of fs.readdirSync(exercises)) files.push(path.join(exercises, name, "README.md"), path.join(exercises, name, "test.cpp"), path.join(exercises, name, "starter.cpp"), path.join(exercises, name, "solution.cpp"));
  }
  return files
    .filter((file) => fs.existsSync(file))
    .map((file) => `${file}:${fs.statSync(file).mtimeMs}`)
    .join("|");
}

let memo: { stamp: string; course: Course } | null = null;

export function loadCourse(): Course {
  const stamp = contentStamp(repoRoot);
  if (memo && memo.stamp === stamp) return memo.course;
  const script = path.join(process.cwd(), "scripts", "course-export", "export_course.py");
  const raw = execFileSync("python3", [script, "--root", repoRoot], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const course = withPracticeTitles(JSON.parse(raw) as Course);
  memo = { stamp, course };
  return course;
}

function problemsById(blocks: Block[], into: Map<string, { title?: string; kind?: string }>) {
  for (const block of blocks) {
    if (block.type === "directive") {
      if (block.name === "problem" && block.attrs.id) {
        into.set(block.attrs.id, { title: block.attrs.title, kind: block.attrs.kind });
      }
      problemsById(block.children, into);
    }
    if (block.type === "list") {
      for (const item of block.items) problemsById(item.children, into);
    }
  }
}

export function withPracticeTitles(course: Course): Course {
  const problems = new Map<string, { title?: string; kind?: string }>();
  for (const topic of course.topics) problemsById(topic.blocks, problems);
  return {
    ...course,
    search: course.search.map((hit) => {
      if (hit.kind !== "Practice") return hit;
      const id = decodeURIComponent(hit.href.split("#")[1] ?? "");
      if (!id) return hit;
      const problem = problems.get(id);
      const title = problem?.title || hit.title;
      const chapter = hit.href.split("#")[0].replace(/^\/topics\//, "").replace(/\/$/, "");
      const anchor = encodeURIComponent(id);
      // A worked example stays in the chapter; all other practice lives in the chapter's session.
      if (problem?.kind === "worked") return { ...hit, kind: "Worked", title, href: `/topics/${chapter}/#${anchor}` };
      return { ...hit, title, href: `/sessions/${chapter}/?step=${anchor}` };
    }),
  };
}

export function repoRootPath() {
  return repoRoot;
}
