// A small mark for lists of chapters and sections: a closed bud until opened, then a leaf.
export function LeafMark({ state, className }: { state: "done" | "read" | "here" | "ahead"; className: string }) {
  return (
    <svg className={`${className} is-${state}`} viewBox="0 0 24 24" aria-hidden="true">
      {state === "done" || state === "read" ? (
        <>
          <path d="M3 21C2 10 9 3 21 3c1 12-6 19-18 18Z" />
          <path className="leaf-mark-rib" d="M3.5 20.5 15 9" />
        </>
      ) : state === "here" ? (
        <path d="M12 2C19 7 19 17 12 22 5 17 5 7 12 2Z" />
      ) : (
        <path d="M12 5C17 9 17 15 12 19 7 15 7 9 12 5Z" />
      )}
    </svg>
  );
}

const BURST = [-160, -112, -64, -18, 30, 78, 126, 172];

// A handful of small leaves thrown up from a correct answer.
export function LeafBurst() {
  return (
    <span className="gh-burst" aria-hidden="true">
      {BURST.map((angle, index) => (
        <svg key={angle} viewBox="0 0 24 24" style={{ "--a": `${angle}deg`, "--far": `${30 + (index % 3) * 11}px` } as React.CSSProperties}>
          <path d="M3 21C2 10 9 3 21 3c1 12-6 19-18 18Z" />
        </svg>
      ))}
    </span>
  );
}
