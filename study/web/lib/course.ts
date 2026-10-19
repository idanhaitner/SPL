import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
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
  return files
    .filter((file) => fs.existsSync(file))
    .map((file) => `${file}:${fs.statSync(file).mtimeMs}`)
    .join("|");
}

let memo: { stamp: string; course: Course } | null = null;

export function loadCourse(): Course {
  const stamp = contentStamp(repoRoot);
  if (memo && memo.stamp === stamp) return memo.course;
  const bundled = path.join(process.cwd(), "scripts", "course-export", "export_course.py");
  const skill =
    process.env.STUDY_SKILL ||
    path.join(os.homedir(), ".cursor", "skills", "course-study-guide");
  const script = fs.existsSync(bundled) ? bundled : path.join(skill, "scripts", "export_course.py");
  const raw = execFileSync("python3", [script, "--root", repoRoot], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const course = withPracticeTitles(JSON.parse(raw) as Course);
  memo = { stamp, course };
  return course;
}

function problemTitles(blocks: Block[], into: Map<string, string>) {
  for (const block of blocks) {
    if (block.type === "directive") {
      if (block.name === "problem" && block.attrs.id && block.attrs.title) {
        into.set(block.attrs.id, block.attrs.title);
      }
      problemTitles(block.children, into);
    }
    if (block.type === "list") {
      for (const item of block.items) problemTitles(item.children, into);
    }
  }
}

function withPracticeTitles(course: Course): Course {
  const titles = new Map<string, string>();
  for (const topic of course.topics) problemTitles(topic.blocks, titles);
  return {
    ...course,
    search: course.search.map((hit) => {
      if (hit.kind !== "Practice") return hit;
      const id = decodeURIComponent(hit.href.split("#")[1] ?? "");
      const title = titles.get(id);
      return title ? { ...hit, title } : hit;
    }),
  };
}

export function repoRootPath() {
  return repoRoot;
}
