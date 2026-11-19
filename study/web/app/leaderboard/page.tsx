import type { Metadata } from "next";
import { Leaderboard } from "@/components/board/Leaderboard";
import { HeroAir } from "@/components/home/HeroAir";
import { TopBar } from "@/components/shell/TopBar";
import { loadCourse } from "@/lib/course";
import { courseNav, stemParts } from "@/lib/nav";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  const course = loadCourse();
  const nav = courseNav(course);
  const leaves = nav.chapters.filter((chapter) => chapter.kind !== "bridge");
  const labels = Object.fromEntries(nav.chapters.map((chapter) => [chapter.id, chapter.kind === "bridge" ? chapter.title : `Chapter ${chapter.num} · ${chapter.title}`]));
  return (
    <div className="board-page">
      <TopBar courseId={course.id} title={course.title} nav={nav} />
      <Leaderboard
        courseId={course.id}
        total={leaves.length}
        partStarts={stemParts(nav)}
        labels={labels}
        decor={<><div className="gh-arch gh-arch-1" /><div className="gh-arch gh-arch-2" /><HeroAir /></>}
      />
    </div>
  );
}
