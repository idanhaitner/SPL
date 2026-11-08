import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { format } from "@wasm-fmt/clang-format/node";
import { describe, expect, it } from "vitest";
import { CODE_STYLE } from "./format";

const EXERCISES = fileURLToPath(new URL("../../content/exercises/", import.meta.url));
const tidy = (source: string) => format(source, "main.cpp", CODE_STYLE);

describe("the C++ formatter", () => {
  it("tidies messy code into the site's style", () => {
    const messy = "int* f(int*a,int n){\nfor(int i=0;i<n;i++){if(a[i]==0)return a+i;}\n  return a;}\n";
    expect(tidy(messy)).toBe(
      "int* f(int* a, int n) {\n    for (int i = 0; i < n; i++) {\n        if (a[i] == 0)\n            return a + i;\n    }\n    return a;\n}\n",
    );
  });

  it("does not throw on code that does not compile yet", () => {
    expect(tidy("int f( {\n return\n")).toContain("int f(");
  });
});

// Pressing Format on a starter or a solution should change nothing.
describe("exercise code is already formatted", () => {
  // clang-format only formats C++, so the Java and Python exercises are left out.
  for (const name of readdirSync(EXERCISES).filter((entry) => entry.startsWith("ex-") && existsSync(`${EXERCISES}${entry}/starter.cpp`))) {
    for (const file of ["starter.cpp", "solution.cpp"]) {
      it(`${name}/${file}`, () => {
        const source = readFileSync(`${EXERCISES}${name}/${file}`, "utf8");
        expect(tidy(source)).toBe(source);
      });
    }
  }
});

describe("exercise starters leave the work to the student", () => {
  for (const name of readdirSync(EXERCISES).filter((entry) => entry.startsWith("ex-"))) {
    it(`${name} has no comments`, () => {
      const starter = readdirSync(`${EXERCISES}${name}`).find((file) => file.startsWith("starter."));
      expect(readFileSync(`${EXERCISES}${name}/${starter}`, "utf8")).not.toMatch(/\/\*|\/\/|TODO|^\s*#(?!include)/m);
    });
  }
});
