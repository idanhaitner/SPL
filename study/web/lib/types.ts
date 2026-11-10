export type CodeToken = { content: string; color?: string };

export type Block =
  | { type: "paragraph"; text: string; line?: number }
  | { type: "heading"; level: number; text: string; line?: number }
  | { type: "quote"; text: string; line?: number }
  | { type: "code"; lang: string; text: string; tokens?: CodeToken[][]; line?: number }
  | { type: "math"; text: string; line?: number }
  | { type: "table"; header: string[]; rows: string[][]; line?: number }
  | {
      type: "list";
      ordered: boolean;
      items: { text: string; children: Block[]; line?: number }[];
      line?: number;
    }
  | {
      type: "directive";
      name: string;
      attrs: Record<string, string>;
      children: Block[];
      line?: number;
    };

export type Topic = {
  id: string;
  title: string;
  blurb: string;
  practiceIds: string[];
  blocks: Block[];
  exercises?: Exercise[];
  // A bridge reviews earlier chapters instead of teaching: it has no reading page, only a session.
  kind?: "bridge";
  reviews?: string[];
};

export type ProgramCase = { name: string; args: string[]; stdin: string; expected: string; hint: string };

export type ExerciseLang = "cpp" | "java" | "python";

export type Exercise = {
  id: string;
  title: string;
  lang: ExerciseLang;
  // The test helpers for this exercise's language, placed between the student's code and the tests.
  harness: string;
  mode: "function" | "program";
  statement: Block[];
  hints: Block[][];
  examples: Block[][];
  caseHints: Record<string, Block[]>;
  starter: string;
  solution: string;
  test: string | null;
  caseNames: string[];
  cases: ProgramCase[];
};

export type SessionStep =
  | { kind: "question"; id: string; title: string; block: Extract<Block, { type: "directive" }> }
  | { kind: "exercise"; id: string; title: string; exercise: Exercise }
  // A reminder card in a bridge: read it and move on.
  | { kind: "recap"; id: string; title: string; blocks: Block[] };

export type GlossaryEntry = {
  term: string;
  topic: string;
  topicTitle: string;
  definition: string;
  anchor: string;
};

export type SearchHit = {
  kind: string;
  title: string;
  text: string;
  href: string;
};

export type Course = {
  id: string;
  title: string;
  lang: string;
  dir: "ltr" | "rtl";
  summary: string;
  topics: Topic[];
  glossary: GlossaryEntry[];
  search: SearchHit[];
  harness: string;
};
