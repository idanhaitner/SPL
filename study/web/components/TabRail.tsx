import Link from "next/link";
import type { Part } from "@/lib/parts";

// The fore edge of the manual: one divider tab per part, as tall as the part is long.
export function TabRail({ parts }: { parts: Part[] }) {
  return (
    <nav className="tabs" aria-label="Course parts">
      {parts.map((part) => (
        <Link
          key={part.id}
          href={`/topics/${part.chapters[0]}`}
          className={`tab tab-${part.id}`}
          title={`Part ${part.numeral}: ${part.name}`}
          aria-label={`Part ${part.numeral}: ${part.name}`}
          style={{ flexGrow: part.chapters.length }}
        >
          <span className="tab-numeral">{part.numeral}</span>
          <span className="tab-name">{part.short}</span>
        </Link>
      ))}
    </nav>
  );
}
