import { describe, expect, it } from "vitest";
import { loadCourse } from "./course";
import { contextGaps, definedIn, missingNames, outsidePointers } from "./self-contained";
import type { Block } from "./types";

type Directive = Extract<Block, { type: "directive" }>;
const problem = (...children: Block[]): Directive => ({ type: "directive", name: "problem", attrs: { id: "p", kind: "exercise" }, children });
const cpp = (text: string): Block => ({ type: "code", lang: "cpp", text });
const para = (text: string): Block => ({ type: "paragraph", text });
const check = (...children: Block[]): Block => ({ type: "directive", name: "check", attrs: { id: "p-q1" }, children });
const solution = (...children: Block[]): Block => ({ type: "directive", name: "solution", attrs: {}, children });

describe("definedIn", () => {
  it("finds classes, structs, interfaces, forward declarations and tables", () => {
    const names = definedIn("class Deck {};\nstruct Node;\ninterface Command<T> {}\ntemplate <typename T> class Terrain {};\nCREATE TABLE Students (Id INTEGER);");
    expect([...names].sort()).toEqual(["Command", "Deck", "Id", "Node", "Students", "Terrain"]);
  });

  it("counts a table's columns, including ones whose type a question leaves open", () => {
    expect([...definedIn("CREATE TABLE T (Grade INTEGER, TA_ID ???);")].sort()).toEqual(["Grade", "T", "TA_ID"]);
  });

  it("ignores names that only appear in comments and strings", () => {
    expect([...definedIn('// class Ghost\nauto s = "class Phantom";')]).toEqual([]);
  });
});

describe("missingNames", () => {
  const types = new Set(["Deck", "Tank", "Bag"]);

  it("flags a class the problem uses but never shows", () => {
    expect(missingNames(problem(para("`main` makes a `Deck`."), cpp("Deck a(3);")), types)).toEqual(["Deck"]);
  });

  it("flags a class that is only named in a question", () => {
    expect(missingNames(problem(check(para("What does `Tank` promise?"))), types)).toEqual(["Tank"]);
  });

  it("accepts a class written inside the problem, even as a forward declaration", () => {
    expect(missingNames(problem(cpp("class Deck { int* _cards; };\nDeck a(3);")), types)).toEqual([]);
    expect(missingNames(problem(cpp("class Bag;\nBag* b;")), types)).toEqual([]);
  });

  it("does not count a class that appears only in the hidden solution", () => {
    expect(missingNames(problem(cpp("Deck a(3);"), solution(cpp("class Deck {};"))), types)).toEqual(["Deck"]);
  });

  it("leaves names the course never defines to the problem's own words", () => {
    expect(missingNames(problem(cpp("std::vector<int> v; Thread t;")), types)).toEqual([]);
  });
});

describe("outsidePointers", () => {
  it.each([
    "`Deck` is as written at the top of this review.",
    "`Deck` now has the deep copy constructor shown above.",
    "It holds the `Counter` from the last question.",
    "Two threads run the `FillTask` from the first question.",
    "This is the bounded queue from the chapter.",
    "Same data as before: Dina has 70.",
  ])("flags %j", (text) => {
    expect(outsidePointers(problem(para(text)))).not.toEqual([]);
  });

  it("does not flag ordinary uses of above and before", () => {
    expect(outsidePointers(problem(para("The level goes above the capacity, as it did before the call.")))).toEqual([]);
  });
});

describe("every practice problem in the course", () => {
  it("carries all the context it needs, because a session shows it on its own", () => {
    const gaps = contextGaps(loadCourse()).map((gap) => `${gap.topic} › ${gap.problem}: ${gap.why}`);
    expect(gaps).toEqual([]);
  });
});
