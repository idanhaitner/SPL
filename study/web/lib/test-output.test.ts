import { describe, expect, it } from "vitest";
import { buildTestSource, outputsMatch, parseTestOutput } from "./test-output";

describe("buildTestSource", () => {
  it("puts student code first so its line numbers are unchanged", () => {
    const r = buildTestSource("int f(void){return 1;}\n", "H", "T");
    expect(r.source).toBe("int f(void){return 1;}\n\nH\n\nT\n");
    expect(r.studentLines).toBe(1);
  });
});

describe("parseTestOutput", () => {
  it("reads PASS/FAIL lines and marks missing cases as not run", () => {
    expect(parseTestOutput("PASS a\nFAIL b: expected 2, got 3\n", ["a", "b", "c"])).toEqual([
      { name: "a", status: "pass", message: "" },
      { name: "b", status: "fail", message: "expected 2, got 3" },
      { name: "c", status: "not-run", message: "Did not run: the program stopped before reaching this test." },
    ]);
  });

  it("says the output was cut off when a case is missing from cut-off output", () => {
    expect(parseTestOutput("PASS a\n", ["a", "b"], true)).toEqual([
      { name: "a", status: "pass", message: "" },
      {
        name: "b",
        status: "not-run",
        message:
          "Not checked: your program printed so much that the output was cut off. Remove extra printf calls and test again.",
      },
    ]);
  });

  it("handles case names that contain a colon", () => {
    const r = parseTestOutput("PASS a:b\nFAIL c:d: expected 1, got 2\n", ["a:b", "c:d"]);
    expect(r).toEqual([
      { name: "a:b", status: "pass", message: "" },
      { name: "c:d", status: "fail", message: "expected 1, got 2" },
    ]);
  });

  it("ignores unknown names and follows the order of names", () => {
    const r = parseTestOutput("PASS z\nPASS b\nPASS a\n", ["a", "b"]);
    expect(r.map((c) => c.name)).toEqual(["a", "b"]);
    expect(r.every((c) => c.status === "pass")).toBe(true);
  });
});

describe("outputsMatch", () => {
  it("ignores final newline, trailing spaces and CRLF", () => {
    expect(outputsMatch("7", "7\n")).toBe(true);
    expect(outputsMatch("7  \n", "7\n")).toBe(true);
    expect(outputsMatch("a\r\nb\n", "a\nb\n")).toBe(true);
  });
  it("fails on missing or extra lines", () => {
    expect(outputsMatch("7\n8\n", "7\n")).toBe(false);
    expect(outputsMatch("", "7\n")).toBe(false);
    expect(outputsMatch("7\n\n", "7\n")).toBe(false);
  });
});
