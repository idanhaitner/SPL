"use client";

import { useEffect } from "react";
import { readProgress, writeProgress } from "@/lib/progress";

export function Visit({ courseId, slug }: { courseId: string; slug: string }) {
  useEffect(() => {
    const progress = readProgress(courseId);
    const seen = progress.seen ?? [];
    if (progress.last !== slug || !seen.includes(slug)) {
      writeProgress(courseId, { ...progress, last: slug, seen: seen.includes(slug) ? seen : [...seen, slug] });
    }
  }, [courseId, slug]);
  return null;
}
