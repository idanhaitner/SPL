// The course's four parts (and the closing review), as the summary in course.yml names them.
// Each part is a divider board: its id picks the board colour in globals.css.
export type PartId = "i" | "ii" | "iii" | "iv" | "v";

export type Part = { id: PartId; numeral: string; name: string; short: string; chapters: string[] };

export const PARTS: Part[] = [
  {
    id: "i",
    numeral: "I",
    name: "Memory in C++",
    short: "Memory",
    chapters: [
      "run-time-environment",
      "memory-model",
      "pointers",
      "classes-and-objects",
      "rule-of-three",
      "rule-of-five",
      "inheritance",
    ],
  },
  {
    id: "ii",
    numeral: "II",
    name: "Concurrency in Java",
    short: "Concurrency",
    chapters: ["concurrency", "design-by-contract", "synchronization", "waiting-and-liveness"],
  },
  {
    id: "iii",
    numeral: "III",
    name: "Communication",
    short: "Communication",
    chapters: ["networking", "reactor", "serialization"],
  },
  { id: "iv", numeral: "IV", name: "Databases", short: "Databases", chapters: ["persistence"] },
  { id: "v", numeral: "V", name: "Review", short: "Review", chapters: ["course-review"] },
];

export function partOf(chapterId: string): Part {
  return PARTS.find((part) => part.chapters.includes(chapterId)) ?? PARTS[PARTS.length - 1];
}
