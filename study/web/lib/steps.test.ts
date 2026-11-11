import { describe, expect, it } from "vitest";
import { introOf, stepsOf } from "./steps";
import type { Block, Exercise, Topic } from "./types";

const h2 = (text: string): Block => ({ type: "heading", level: 2, text });
const para = (text: string): Block => ({ type: "paragraph", text });
const problem = (id: string, kind = "exercise"): Block => ({ type: "directive", name: "problem", attrs: { id, title: `Title ${id}`, kind }, children: [para(`body ${id}`)] });
const exercise = (id: string) => ({ id, title: `Exercise ${id}` }) as Exercise;

const topic = (blocks: Block[], extra: Partial<Topic> = {}): Topic => ({ id: "bridge-x", title: "X", blurb: "", practiceIds: [], blocks, ...extra });

const bridge = (blocks: Block[], extra: Partial<Topic> = {}) => topic(blocks, { kind: "bridge", reviews: ["a", "b"], ...extra });

const shape = (t: Topic) => stepsOf(t).map((step) => `${step.kind}:${step.id}`);

describe("stepsOf", () => {
  it("leaves a normal chapter as questions then exercises", () => {
    const chapter = topic([para("intro"), h2("One"), problem("q1"), h2("Two"), problem("w1", "worked"), problem("q2")], { exercises: [exercise("ex1")] });
    expect(shape(chapter)).toEqual(["question:q1", "question:q2", "exercise:ex1"]);
  });

  it("gives a bridge one recap per section, then that section's questions, then exercises", () => {
    const t = bridge([para("intro"), h2("Stack and heap"), para("a"), problem("q1"), h2("Pointers"), para("b"), problem("q2"), problem("q3")], { exercises: [exercise("ex1")] });
    expect(shape(t)).toEqual(["recap:bridge-x--stack-and-heap", "question:q1", "recap:bridge-x--pointers", "question:q2", "question:q3", "exercise:ex1"]);
  });

  it("strips problem directives from recap blocks and keeps the rest", () => {
    const [recap] = stepsOf(bridge([h2("One"), para("keep me"), problem("q1"), para("and me")]));
    expect(recap.kind).toBe("recap");
    if (recap.kind !== "recap") return;
    expect(recap.blocks).toEqual([para("keep me"), para("and me")]);
  });

  it("uses the heading text as the recap title", () => {
    expect(stepsOf(bridge([h2("Frames, and the heap!"), para("a")]))[0]).toMatchObject({ title: "Frames, and the heap!", id: "bridge-x--frames-and-the-heap" });
  });

  it("keeps a section that has no problems", () => {
    expect(shape(bridge([h2("Only words"), para("a")]))).toEqual(["recap:bridge-x--only-words"]);
  });

  it("skips worked problems in a bridge and leaves them on the card", () => {
    const worked = problem("w1", "worked");
    const steps = stepsOf(bridge([h2("One"), worked, problem("q1")]));
    expect(steps.map((step) => step.id)).toEqual(["bridge-x--one", "q1"]);
    expect(steps[0].kind === "recap" && steps[0].blocks).toEqual([worked]);
  });

  it("throws when two sections share a heading", () => {
    expect(() => stepsOf(bridge([h2("Same"), para("a"), h2("Same"), para("b")]))).toThrow(/bridge-x.*Same/);
  });
});

describe("introOf", () => {
  it("returns the blocks before the first section", () => {
    expect(introOf(bridge([para("hello"), para("there"), h2("One"), para("a")]))).toEqual([para("hello"), para("there")]);
  });
  it("is empty when the file opens on a heading", () => {
    expect(introOf(bridge([h2("One"), para("a")]))).toEqual([]);
  });
});
