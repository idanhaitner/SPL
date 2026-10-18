"use client";

import { useEffect } from "react";
import { readProgress, writeProgress } from "@/lib/progress";

export function Visit({ courseId, slug }: { courseId: string; slug: string }) {
  useEffect(() => {
    const progress = readProgress(courseId);
    if (progress.last !== slug) writeProgress(courseId, { ...progress, last: slug });
  }, [courseId, slug]);
  return null;
}
