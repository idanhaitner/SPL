import type { Block, Course } from "./types";

// A practice step shows one problem on its own, without the chapter around it. So every class, table, or
// interface a problem names must be written inside the problem, and its text must not point at code or
// questions that live elsewhere ("the class above", "the previous question").

type Directive = Extract<Block, { type: "directive" }>;

// Standard-library names that some chapter also writes its own version of. A problem may use them freely.
const LIBRARY = new Set(["Runnable", "List", "Exception", "Thread", "Object", "String", "Integer", "Iterator", "Comparable", "Serializable", "ConcurrentModificationException", "InterruptedException"]);

const POINTERS: RegExp[] = [
  /\b(?:shown|written|defined|given|declared) (?:above|earlier|before)\b/i,
  /\b(?:the|this) (?:code|class|function|method|table|tables|queue|lock|semaphore|decoder|tank|deck|struct) above\b/i,
  /`[^`]+` above\b/,
  /\b(?:previous|last|first|earlier|next) question\b/i,
  /\bfrom (?:the|this) (?:chapter|lecture|review|session)\b/i,
  /\b(?:this|the) chapter's\b/i,
  /\b(?:in|from) (?:this|the) chapter\b/i,
  /\btop of (?:this|the) (?:review|chapter|page)\b/i,
  /\b(?:same data|same tables|same class) as (?:before|above)\b/i,
  /\bas before\b/i,
  /\bearlier in this (?:chapter|review)\b/i,
];

const DEFINITIONS: RegExp[] = [
  /\b(?:class|struct|interface|enum|union|record)\s+([A-Za-z_]\w*)/g,
  /\bCREATE\s+TABLE\s+([A-Za-z_]\w*)/gi,
  // A table's columns: a name followed by its type, or by ??? where a question leaves the type open.
  /\b([A-Za-z_]\w*)\s+(?:(?:INTEGER|INT|TEXT|VARCHAR|CHAR|REAL|FLOAT|DATE|DATETIME|BOOLEAN|BLOB)\b|\?\?\?)/g,
];

function stripCode(code: string) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(?:\/\/|--|#).*$/gm, "")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''");
}

export function definedIn(code: string): Set<string> {
  const names = new Set<string>();
  const clean = stripCode(code);
  for (const pattern of DEFINITIONS) for (const match of clean.matchAll(pattern)) names.add(match[1]);
  return names;
}

// One-letter names (`A`, `T`) are placeholders and printed output far more often than classes.
const capitalized = (text: string) => (text.match(/\b[A-Z][A-Za-z0-9_]+\b/g) ?? []);
const spans = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);

type Parts = { code: string[]; text: string[] };

// What a reader sees before asking for a solution: code and text outside :::solution blocks.
function partsOf(blocks: Block[], into: Parts = { code: [], text: [] }): Parts {
  for (const block of blocks) {
    if (block.type === "code") into.code.push(block.text);
    else if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") into.text.push(block.text);
    else if (block.type === "table") into.text.push(...block.header, ...block.rows.flat());
    else if (block.type === "list") for (const item of block.items) { into.text.push(item.text); partsOf(item.children, into); }
    else if (block.type === "directive" && block.name !== "solution") partsOf(block.children, into);
  }
  return into;
}

function problemsIn(blocks: Block[], into: Directive[] = []): Directive[] {
  for (const block of blocks) {
    if (block.type !== "directive") continue;
    if (block.name === "problem") into.push(block);
    else problemsIn(block.children, into);
  }
  return into;
}

function allCode(blocks: Block[], into: string[] = []): string[] {
  for (const block of blocks) {
    if (block.type === "code") into.push(block.text);
    else if (block.type === "directive") allCode(block.children, into);
    else if (block.type === "list") for (const item of block.items) allCode(item.children, into);
  }
  return into;
}

export type Gap = { topic: string; problem: string; why: string };

// The names a problem uses but does not write itself, out of the names the course defines somewhere.
export function missingNames(problem: Directive, courseTypes: Set<string>): string[] {
  const { code, text } = partsOf(problem.children);
  // A definition counts wherever the reader can see it: in a code block, or inline, as in `class MyVector extends Vector`.
  const inline = text.flatMap(spans);
  const own = new Set([...code, ...inline].flatMap((piece) => [...definedIn(piece)]));
  const used = new Set<string>();
  for (const piece of code) for (const name of capitalized(stripCode(piece))) used.add(name);
  for (const span of inline) for (const name of capitalized(span)) used.add(name);
  return [...used].filter((name) => courseTypes.has(name) && !own.has(name) && !LIBRARY.has(name)).sort();
}

export function outsidePointers(problem: Directive): string[] {
  const { text } = partsOf(problem.children);
  const found = new Set<string>();
  for (const piece of text) for (const pattern of POINTERS) {
    const match = piece.match(pattern);
    if (match) found.add(match[0]);
  }
  return [...found];
}

export function contextGaps(course: Course): Gap[] {
  const courseTypes = new Set<string>();
  for (const topic of course.topics) for (const code of allCode(topic.blocks)) for (const name of definedIn(code)) courseTypes.add(name);
  const gaps: Gap[] = [];
  for (const topic of course.topics) {
    for (const problem of problemsIn(topic.blocks)) {
      // A worked example sits inside the chapter's reading and never stands alone.
      if (problem.attrs.kind === "worked") continue;
      const id = problem.attrs.id ?? "?";
      const missing = missingNames(problem, courseTypes);
      if (missing.length) gaps.push({ topic: topic.id, problem: id, why: `uses ${missing.map((name) => `\`${name}\``).join(", ")} without writing it in the problem` });
      for (const phrase of outsidePointers(problem)) gaps.push({ topic: topic.id, problem: id, why: `points outside the problem: "${phrase}"` });
    }
    // A coding exercise is also its own step: its statement, examples and hints must stand alone too.
    for (const exercise of topic.exercises ?? []) {
      const blocks = [...exercise.statement, ...exercise.examples.flat(), ...exercise.hints.flat(), ...Object.values(exercise.caseHints).flat()];
      const whole: Directive = { type: "directive", name: "problem", attrs: { id: exercise.id }, children: blocks };
      for (const phrase of outsidePointers(whole)) gaps.push({ topic: topic.id, problem: exercise.id, why: `points outside the exercise: "${phrase}"` });
    }
  }
  return gaps;
}
