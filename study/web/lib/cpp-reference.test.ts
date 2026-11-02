import { describe, expect, it } from "vitest";
import { CPP_REFERENCE, findFunctions, SUGGESTIONS } from "./cpp-reference";

const top = (query: string, count = 2) => findFunctions(query).slice(0, count).map((entry) => entry.name);

describe("findFunctions", () => {
  it("finds a function from what it does, in plain words", () => {
    expect(top("copy a string")).toEqual(expect.arrayContaining(["std::strcpy"]));
    expect(top("how long is a string", 3)).toEqual(expect.arrayContaining(["std::strlen", "std::string::size"]));
    expect(top("compare two strings", 3)).toEqual(expect.arrayContaining(["std::strcmp", "std::string::compare (==)"]));
    expect(top("swap two values", 1)).toEqual(["std::swap"]);
    expect(top("allocate an array", 1)).toEqual(["new[]"]);
    expect(top("free memory", 2)).toContain("delete / delete[]");
    expect(top("sum of a vector", 1)).toEqual(["std::accumulate"]);
  });

  it("finds a function by its name", () => {
    expect(top("strlen", 1)).toEqual(["std::strlen"]);
    expect(top("make_unique", 1)).toEqual(["std::make_unique"]);
  });

  it("returns nothing for filler or nonsense", () => {
    expect(findFunctions("how do I")).toEqual([]);
    expect(findFunctions("zebra")).toEqual([]);
  });

  it("answers every suggestion it offers", () => {
    for (const suggestion of SUGGESTIONS) expect(findFunctions(suggestion).length).toBeGreaterThan(0);
  });

  it("gives every entry a header, a signature, and an example", () => {
    for (const entry of CPP_REFERENCE) {
      expect(entry.header && entry.signature && entry.example && entry.does).toBeTruthy();
    }
  });
});
