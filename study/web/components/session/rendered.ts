import type { ReactNode } from "react";

// Step content the server has already turned into React nodes. Code blocks are
// highlighted by a Server Component, so the client tree only receives the result.
export type RenderedStep = {
  content?: ReactNode;
  hints?: ReactNode[];
  examples?: ReactNode[];
  caseHints?: Record<string, ReactNode>;
  // The lesson this step practices, for a student who needs to reread it.
  lesson?: { id: string; title: string };
};
