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

// A session is the chapter's own practice in file order, then its coding exercises.
export function stepsOf(topic: Topic): SessionStep[] {
  const questions: SessionStep[] = problemsIn(topic.blocks).map((block) => ({ kind: "question", id: block.attrs.id, title: block.attrs.title ?? "Question", block }));
  const exercises: SessionStep[] = (topic.exercises ?? []).map((exercise) => ({ kind: "exercise", id: exercise.id, title: exercise.title, exercise }));
  return [...questions, ...exercises];
}
