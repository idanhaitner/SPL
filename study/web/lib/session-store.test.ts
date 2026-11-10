// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { openStep, readSession, resumeStep, writeSession } from "./session-store";
import { stepsOf } from "./steps";
import type { Topic } from "./types";

describe("session store", () => {
  beforeEach(() => localStorage.clear());

  it("resumes past solved and skipped steps", () => {
    expect(resumeStep(["a", "b", "c"], ["a"], ["b"])).toBe(2);
    expect(resumeStep(["a", "b"], ["a"], ["b"])).toBe(2);
    expect(resumeStep(["a", "b"], [], [])).toBe(0);
  });
  it("reopens the step the student was on, even when it is solved", () => {
    expect(openStep(["a", "b"], { current: "a", skipped: [] }, ["a"])).toBe(0);
  });
  it("a link wins, and ids that are gone are ignored", () => {
    expect(openStep(["a", "b"], { current: "a", skipped: [] }, [], "b")).toBe(1);
    expect(openStep(["a", "b"], { current: "gone", skipped: [] }, ["a"], "also-gone")).toBe(1);
  });
  it("drops a reminder that was renamed, and resumes after one that was passed", () => {
    expect(openStep(["b--one", "q1"], { current: "b--gone", skipped: [] }, [], null)).toBe(0);
    expect(openStep(["b--one", "q1"], { current: "b--gone", skipped: [] }, ["b--one"], null)).toBe(1);
  });
  it("survives broken storage", () => {
    localStorage.setItem("study:c:session:x", "not json");
    expect(readSession("c", "x")).toEqual({ skipped: [] });
    localStorage.setItem("study:c:session:x", '{"current":3,"skipped":"y"}');
    expect(readSession("c", "x")).toEqual({ current: undefined, skipped: [] });
    writeSession("c", "x", { current: "a", skipped: ["b"] });
    expect(readSession("c", "x")).toEqual({ current: "a", skipped: ["b"] });
  });
});

describe("steps of a chapter", () => {
  const problem = (id: string, kind: string) => ({ type: "directive" as const, name: "problem", attrs: { id, kind }, children: [] });
  const topic = { id: "t", blocks: [{ type: "paragraph" as const, text: "x" }, problem("w", "worked"), problem("a", "exercise"), problem("b", "exam")] } as unknown as Topic;
  it("takes every problem except worked examples, in file order", () => {
    expect(stepsOf(topic).map((step) => step.id)).toEqual(["a", "b"]);
  });
});
