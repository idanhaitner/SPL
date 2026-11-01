import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { CloseHeading, ContinueButton } from "@/components/home/ContinueButton";
import { CourseMap } from "@/components/home/CourseMap";
import { CourseStem } from "@/components/home/CourseStem";
import { TopBar } from "@/components/shell/TopBar";
import { TryQuestion } from "@/components/home/TryQuestion";
import { loadCourse } from "@/lib/course";
import { highlight } from "@/lib/highlight";
import { courseNav } from "@/lib/nav";
import { PARTS } from "@/lib/parts";
import type { Block } from "@/lib/types";

const QUESTION_CODE = `void foo(int n) {
    int x = n * 2;
}
int main() {
    int a = 4;
    foo(a);
}`;

const STEM_LABELS = ["Memory", "Concurrency", "Communication", "Databases"];

function countProblems(blocks: Block[], kind: string): number {
  let count = 0;
  for (const block of blocks) {
    if (block.type === "directive") {
      if (block.name === "problem" && block.attrs.kind === kind) count += 1;
      count += countProblems(block.children, kind);
    }
    if (block.type === "list") {
      for (const item of block.items) count += countProblems(item.children, kind);
    }
  }
  return count;
}

export default async function HomePage() {
  const course = loadCourse();
  const nav = courseNav(course);
  const { chapters, parts, finale } = nav;
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const practiceCount = chapters.reduce((sum, chapter) => sum + chapter.stepIds.length, 0);
  const examCount = course.topics.reduce((sum, topic) => sum + countProblems(topic.blocks, "exam"), 0);
  const questionChapter = byId.get("memory-model");
  const partStarts = parts.map((part, index) => ({ label: STEM_LABELS[index], num: part.chapters[0].num }));
  const questionCode = (await highlight(QUESTION_CODE, "cpp")).replace(' tabindex="0"', "");

  return (
    <div className="landing home">
      <header className="gh-hero">
        <div className="gh-arch gh-arch-1" />
        <div className="gh-arch gh-arch-2" />
        <div className="gh-frame">
          <TopBar courseId={course.id} title={course.title} nav={nav} tone="flat" />
          <div className="gh-hero-copy">
            <h1>Start from a seed. <em>Grow</em> a whole server.</h1>
            <p className="gh-lede">{course.title} from zero, one chapter at a time, with questions from the course&rsquo;s own past exams.</p>
            <p className="gh-facts">{chapters.length} chapters in {PARTS.length} parts, in the course&rsquo;s order</p>
          </div>
          <div className="gh-hero-action">
            <ContinueButton courseId={course.id} chapters={chapters} showNote />
          </div>
          <CourseStem courseId={course.id} chapters={chapters} partStarts={partStarts} />
        </div>
      </header>

      <div>
        <section className="gh-section" id="course" aria-labelledby="course-title">
          <div className="gh-head">
            <h2 id="course-title">The whole course, in order</h2>
            <p>{chapters.length} chapters and {practiceCount} practice questions, {examCount} of them from past exams.</p>
            <div className="gh-head-search"><SearchBox id="course-q" /></div>
          </div>
          <CourseMap courseId={course.id} parts={parts} finale={finale} chapters={chapters} />
        </section>

        <section className="gh-section gh-trysection" aria-labelledby="try-title">
          <div className="gh-try-copy">
            <h2 id="try-title">Learn it by answering</h2>
            <p>Chapters stop to ask questions like this one. Get one wrong and it tells you why, so you can try again right there.</p>
            {questionChapter && <p><Link href={`/topics/${questionChapter.id}`}>This one is from chapter {questionChapter.num}: {questionChapter.title}</Link></p>}
          </div>
          <TryQuestion code={questionCode} />
        </section>

        <section className="gh-section gh-expect" aria-labelledby="expect-title">
          <h2 id="expect-title">What to expect</h2>
          <dl>
            <div><dt>Written for a first read</dt><dd>Nothing is assumed. Each chapter builds only on the ones before it.</dd></div>
            <div><dt>Four languages</dt><dd>C++ for memory and objects, Java for threads and servers, and SQL with a little Python for databases.</dd></div>
            <div><dt>Your progress stays here</dt><dd>No account and no server. Clearing this browser&rsquo;s site data starts you over.</dd></div>
          </dl>
        </section>
      </div>

      <footer className="gh-close">
        <div className="gh-arch gh-arch-1" />
        <div className="gh-frame">
          <CloseHeading courseId={course.id} chapters={chapters} />
          <ContinueButton courseId={course.id} chapters={chapters} />
          <div className="gh-foot">
            <span>A study guide that follows Meni Adler&rsquo;s lecture notes, the exercise sessions, and past exams. The course site stays the source for dates, assignments, and grading.</span>
            <nav aria-label="Footer">
              <a href="#course">Course</a>
              <Link href="/glossary">Glossary ({course.glossary.length} terms)</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
