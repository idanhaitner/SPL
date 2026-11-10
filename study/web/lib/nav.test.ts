import { describe, expect, it } from "vitest";
import { courseNav, stemParts } from "./nav";
import type { Course, Topic } from "./types";

const topic = (id: string, extra: Partial<Topic> = {}): Topic => ({ id, title: id, blurb: "", practiceIds: [], blocks: [], ...extra });
const course = (topics: Topic[]): Course => ({ id: "c", title: "C", lang: "en", dir: "ltr", summary: "", topics, glossary: [], search: [], harness: "" });

describe("courseNav", () => {
  it("numbers chapters past a bridge and keeps every position", () => {
    const nav = courseNav(course([topic("a"), topic("b"), topic("r", { kind: "bridge", reviews: ["a", "b"] }), topic("c")]));
    expect(nav.chapters.map((chapter) => [chapter.id, chapter.num, chapter.pos, chapter.kind])).toEqual([
      ["a", 1, 0, undefined],
      ["b", 2, 1, undefined],
      ["r", 0, 2, "bridge"],
      ["c", 3, 3, undefined],
    ]);
  });

  it("keeps a bridge inside its part, between its neighbours", () => {
    const ids = ["run-time-environment", "memory-model", "pointers", "bridge-memory-basics", "classes-and-objects"];
    const nav = courseNav(course(ids.map((id) => topic(id, id.startsWith("bridge-") ? { kind: "bridge", reviews: ["pointers"] } : {}))));
    expect(nav.parts[0].chapters.map((chapter) => chapter.id)).toEqual(ids);
    expect(nav.finale).toEqual([]);
  });
  it("starts each part's stem label at its first chapter's number", () => {
    const nav = courseNav(course(["pointers", "bridge-memory-basics", "concurrency"].map((id) => topic(id, id.startsWith("bridge-") ? { kind: "bridge", reviews: ["pointers"] } : {}))));
    expect(stemParts(nav).slice(0, 2)).toEqual([{ label: "Memory", num: 1 }, { label: "Concurrency", num: 2 }]);
  });
});
