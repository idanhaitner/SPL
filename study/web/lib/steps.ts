import type { Block, SessionStep, Topic } from "./types";

function problemsIn(blocks: Block[]): Extract<Block, { type: "directive" }>[] {
  const found: Extract<Block, { type: "directive" }>[] = [];
  for (const block of blocks) {
    if (block.type !== "directive") continue;
    if (block.name === "problem") {
      if (block.attrs.kind !== "worked" && block.attrs.id) found.push(block);
    } else {
      found.push(...problemsIn(block.children));
    }
  }
  return found;
}

const isSection = (block: Block) => block.type === "heading" && block.level === 2;
const isQuestion = (block: Block) => block.type === "directive" && block.name === "problem" && block.attrs.kind !== "worked";
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// What a bridge says before its first section.
export function introOf(topic: Topic): Block[] {
  const first = topic.blocks.findIndex(isSection);
  return first < 0 ? topic.blocks : topic.blocks.slice(0, first);
}

// A bridge's sections each become a reminder card followed by the questions written under it.
function bridgeSteps(topic: Topic): SessionStep[] {
  const steps: SessionStep[] = [];
  const seen = new Set<string>();
  const starts = topic.blocks.flatMap((block, index) => (isSection(block) ? [index] : []));
  starts.forEach((start, at) => {
    const heading = topic.blocks[start] as Extract<Block, { type: "heading" }>;
    const body = topic.blocks.slice(start + 1, starts[at + 1] ?? topic.blocks.length);
    const id = `${topic.id}--${slug(heading.text)}`;
    if (seen.has(id)) throw new Error(`${topic.id}: two sections are both called "${heading.text}"`);
    seen.add(id);
    steps.push({ kind: "recap", id, title: heading.text, blocks: body.filter((block) => !isQuestion(block)) });
    steps.push(...questionSteps(body));
  });
  return steps;
}

const questionSteps = (blocks: Block[]): SessionStep[] => problemsIn(blocks).map((block) => ({ kind: "question", id: block.attrs.id, title: block.attrs.title ?? "Question", block }));

// A session is the chapter's own practice in file order, then its coding exercises.
export function stepsOf(topic: Topic): SessionStep[] {
  if (topic.kind === "bridge") {
    const exercises: SessionStep[] = (topic.exercises ?? []).map((exercise) => ({ kind: "exercise", id: exercise.id, title: exercise.title, exercise }));
    return [...bridgeSteps(topic), ...exercises];
  }
  const questions: SessionStep[] = problemsIn(topic.blocks).map((block) => ({ kind: "question", id: block.attrs.id, title: block.attrs.title ?? "Question", block }));
  const exercises: SessionStep[] = (topic.exercises ?? []).map((exercise) => ({ kind: "exercise", id: exercise.id, title: exercise.title, exercise }));
  return [...questions, ...exercises];
}
