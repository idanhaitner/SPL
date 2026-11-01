"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/home/Icon";
import { Mixed } from "@/lib/bidi";
import { markRead } from "@/lib/progress";

export type Hop = { href: string; title: string };

// The end of a chapter: records it as read and hands off to its session, or to the next chapter.
export function FinishReading({ courseId, chapterId, session, next }: { courseId: string; chapterId: string; session: Hop | null; next: Hop | null }) {
  const router = useRouter();
  const target = session ?? next;
  return (
    <div className="handoff-go">
      <p>
        {session ? "Next: use what you just read" : next ? "Next chapter" : "That’s the last chapter"}
        {target && <span><Mixed text={target.title} /></span>}
      </p>
      <button
        type="button"
        className="gh-btn"
        onClick={() => {
          markRead(courseId, chapterId);
          router.push(target?.href ?? "/");
        }}
      >
        Finish reading
        <Icon name="arrow" />
      </button>
    </div>
  );
}
