import Link from "next/link";
import { Blocks } from "@/components/Blocks";
import { ChapterProgress } from "@/components/ChapterProgress";
import { ByteField } from "@/components/landing/ByteField";
import { LandingNav } from "@/components/landing/LandingNav";
import { PointerTrace } from "@/components/landing/PointerTrace";
import { ResumeLink } from "@/components/landing/ResumeLink";
import { Showcase, type ShowcasePanel } from "@/components/landing/Showcase";
import { Mixed } from "@/lib/bidi";
import { loadCourse } from "@/lib/course";
import { highlight } from "@/lib/highlight";
import type { Block } from "@/lib/types";

const PARTS = [
  {
    title: "Memory",
    lang: "C++",
    summary: "Where a program lives, what a pointer holds, and how an object that owns memory is copied and destroyed.",
    ids: ["run-time-environment", "memory-model", "pointers", "classes-and-objects", "rule-of-three", "rule-of-five", "inheritance"],
  },
  {
    title: "Concurrency",
    lang: "Java",
    summary: "Threads, correct results, locks, and how to wait without starving or deadlocking.",
    ids: ["concurrency", "design-by-contract", "synchronization", "waiting-and-liveness"],
  },
  {
    title: "Communication between processes",
    lang: "Java",
    summary: "Sockets and protocols, a general server, the reactor that serves many clients on one thread, and a server that runs commands.",
    ids: ["networking", "reactor", "serialization"],
  },
  {
    title: "Databases",
    lang: "SQL and Python",
    summary: "Tables, keys, and joins, then a Python persistence layer that keeps your objects in a relational database.",
    ids: ["persistence"],
  },
];

const TRACE_LINES = ["int x = 5;", "int* p = &x;", "*p = 7;", "int& r = x;", "r = 9;"];

const SNIPPETS = [
  {
    key: "memory",
    part: "Memory",
    file: "buffer.cpp",
    lang: "cpp",
    mark: 6,
    note: "Freeing the old buffer before the new copy exists.",
    code: `// Copy assignment that survives self assignment
Buffer& Buffer::operator=(const Buffer& other) {
    if (this != &other) {
        int* fresh = new int[other.size];
        std::copy(other.data, other.data + other.size, fresh);
        delete[] data;
        data = fresh;
        size = other.size;
    }
    return *this;
}`,
  },
  {
    key: "threads",
    part: "Threads",
    file: "BlockingQueue.java",
    lang: "java",
    mark: 3,
    note: "An if around wait() instead of a while.",
    code: `// A guarded wait on a shared queue
public synchronized T take() throws InterruptedException {
    while (items.isEmpty()) {
        wait();
    }
    T item = items.removeFirst();
    notifyAll();
    return item;
}`,
  },
  {
    key: "servers",
    part: "Servers",
    file: "Reactor.java",
    lang: "java",
    mark: 8,
    note: "A heavy call on the selector thread.",
    code: `// The selector thread reads, the pool does the work
while (!Thread.currentThread().isInterrupted()) {
    selector.select();
    for (SelectionKey key : selector.selectedKeys()) {
        if (key.isAcceptable()) accept(key);
        else if (key.isReadable()) {
            Runnable task = handler(key).continueRead();
            if (task != null) pool.submit(handler(key), task);
        }
    }
    selector.selectedKeys().clear();
}`,
  },
  {
    key: "databases",
    part: "Databases",
    file: "enrollments.sql",
    lang: "sql",
    mark: 4,
    note: "A join with no condition, which returns every pair.",
    code: `-- Many to many goes through a junction table
SELECT s.name, c.title
FROM students AS s
JOIN enrollments AS e ON e.student_id = s.id
JOIN courses AS c ON c.id = e.course_id
WHERE c.term = 2026
ORDER BY s.name;`,
  },
];

const STEPS = [
  {
    title: "Read one lecture at a time",
    text: "Each chapter follows one lecture, with a diagram and a worked example.",
  },
  {
    title: "Answer real exam questions",
    text: "Practice includes questions from the 2015 to 2024 exams.",
  },
  {
    title: "Pick up where you stopped",
    text: "Your progress stays in this browser.",
  },
];

const SAMPLE_QUESTION = "exam-18a-q2";

function findProblems(blocks: Block[]): Extract<Block, { type: "directive" }>[] {
  const found: Extract<Block, { type: "directive" }>[] = [];
  for (const block of blocks) {
    if (block.type === "directive") {
      if (block.name === "problem") found.push(block);
      found.push(...findProblems(block.children));
    }
    if (block.type === "list") {
      for (const item of block.items) found.push(...findProblems(item.children));
    }
  }
  return found;
}

export default async function HomePage() {
  const course = loadCourse();
  const chapters = course.topics.map((topic) => ({ id: topic.id, title: topic.title }));
  const position = new Map(course.topics.map((topic, index) => [topic.id, index]));
  const practiceCount = course.topics.reduce((sum, topic) => sum + topic.practiceIds.length, 0);
  const problems = course.topics.flatMap((topic) => findProblems(topic.blocks));
  const examCount = problems.filter((problem) => problem.attrs.kind === "exam").length;
  const sample = problems.find((problem) => problem.attrs.id === SAMPLE_QUESTION);
  const sampleTopic = course.topics.find((topic) => topic.practiceIds.includes(SAMPLE_QUESTION));
  // The first part of the question: its setup and its first check.
  const samplePart = (sample?.children ?? []).filter(
    (block, index, all) =>
      block.type !== "directive" || index === all.findIndex((item) => item.type === "directive" && item.name === "check"),
  );
  const mapped = new Set(PARTS.flatMap((part) => part.ids));
  const finale = course.topics.filter((topic) => !mapped.has(topic.id));

  const traceLines = (await Promise.all(TRACE_LINES.map((line) => highlight(line, "cpp")))).map((html) =>
    html.replace(' tabindex="0"', ""),
  );

  const panels: ShowcasePanel[] = await Promise.all(
    SNIPPETS.map(async (snippet) => ({
      key: snippet.key,
      part: snippet.part,
      file: snippet.file,
      note: snippet.note,
      html: await highlight(snippet.code, snippet.lang, snippet.mark),
    })),
  );

  const faq = [
    {
      q: "Is this the official course site?",
      a: "No. It is a study guide that follows Meni Adler's lecture notes, the exercise sessions, and past exams. The course site stays the source for dates, assignments, and grading.",
    },
    {
      q: "Where do the practice questions come from?",
      a: `${examCount} of the ${practiceCount} come from exams written between 2015 and 2024. The rest come from the lectures and exercise sessions. The year is hidden, so you judge each question by what it asks and not by when it was set.`,
    },
    {
      q: "Do I have to read the chapters in order?",
      a: "It helps. Each chapter only uses ideas from the chapters before it, and when a later idea comes up it links forward instead of assuming you know it.",
    },
    {
      q: "Is my progress saved?",
      a: "Yes, in this browser only. Nothing is sent to a server and there is no account. Clearing the site data starts you over.",
    },
    {
      q: "Which languages do I need?",
      a: "C++ for memory and objects, Java for threads and servers, and SQL with a little Python for databases. Each chapter shows the syntax it relies on.",
    },
    {
      q: "What if I only need one definition?",
      a: `Open the glossary. It holds ${course.glossary.length} terms, each with a short definition and a link to the chapter that teaches it.`,
    },
  ];

  return (
    <div className="landing">
      <LandingNav courseId={course.id} title={course.title} chapters={chapters} hits={course.search} />

      <section className="l-hero" aria-labelledby="hero-title">
        <ByteField source={TRACE_LINES.join("\n")} weight="hero" />
        <div className="container l-hero-grid">
          <div className="l-hero-copy">
            <h1 id="hero-title">From raw pointer to running server</h1>
            <p className="lead">Every lecture of the course, with ten years of exam questions.</p>
            <div className="l-cta-row">
              <ResumeLink className="key key--primary" courseId={course.id} chapters={chapters} />
              <a className="key" href="#map">See the course map</a>
            </div>
          </div>
          <PointerTrace lines={traceLines} />
        </div>
      </section>

      <section className="l-section l-map" id="map" aria-labelledby="map-title">
        <div className="container">
          <header className="l-head">
            <h2 id="map-title">Four parts, one route</h2>
            <p className="lead">
              {course.topics.length} chapters and {practiceCount} practice questions, from a single process in memory to many processes sharing data.
            </p>
          </header>
          <ol className="l-parts">
            {PARTS.map((part) => (
              <li className="l-part" key={part.title}>
                <div className="l-part-info">
                  <h3>{part.title}</h3>
                  <p className="l-part-lang">{part.lang}</p>
                  <p>{part.summary}</p>
                </div>
                <ol className="l-chapters">
                  {part.ids
                    .map((id) => course.topics.find((topic) => topic.id === id))
                    .filter((topic) => topic !== undefined)
                    .map((topic) => (
                      <li key={topic.id}>
                        <Link className="l-chapter" href={`/topics/${topic.id}`}>
                          <span className="l-chapter-num">{String((position.get(topic.id) ?? 0) + 1).padStart(2, "0")}</span>
                          <strong><Mixed text={topic.title} /></strong>
                          <ChapterProgress courseId={course.id} practiceIds={topic.practiceIds} />
                        </Link>
                      </li>
                    ))}
                </ol>
              </li>
            ))}
          </ol>
          {finale.map((topic) => (
            <Link className="l-finale" href={`/topics/${topic.id}`} key={topic.id}>
              <span className="l-chapter-num">{String((position.get(topic.id) ?? 0) + 1).padStart(2, "0")}</span>
              <strong><Mixed text={topic.title} /></strong>
              <span className="l-finale-tag">Before the exam</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="l-tagline" aria-label="What the course teaches">
        <div className="container">
          <p>Know where every byte lives, who owns it, and which thread touches it next.</p>
        </div>
      </section>

      <section className="l-traps" aria-labelledby="traps-title">
        <div className="container">
          <h2 id="traps-title">Exam traps, and what avoids them</h2>
          <Showcase panels={panels} />
        </div>
      </section>

      <section className="l-section l-how" id="how" aria-labelledby="how-title">
        <div className="container">
          <h2 id="how-title">Read, answer, come back</h2>
          <div className="l-how-grid">
            <ol className="l-steps">
              {STEPS.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          {sample && (
            <figure className="l-sample">
              <div className="card practice">
                <h3 className="practice-title"><Mixed text={sample.attrs.title} /></h3>
                <div className="statement"><Blocks blocks={samplePart} courseId={course.id} /></div>
              </div>
              {sampleTopic && (
                <figcaption>
                  <Link href={`/topics/${sampleTopic.id}#${SAMPLE_QUESTION}`}>Open the full exam question</Link>
                </figcaption>
              )}
            </figure>
          )}
          </div>
        </div>
      </section>

      <section className="l-section l-faq-section" id="faq" aria-labelledby="faq-title">
        <div className="container l-faq-grid">
          <h2 id="faq-title">Questions</h2>
          <div className="l-faq">
            {faq.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <span className="l-faq-icon" aria-hidden="true" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="l-final" aria-labelledby="final-title">
        <ByteField source={SNIPPETS[1].code} weight="band" />
        <div className="container">
          <h2 id="final-title">Open the next chapter</h2>
          <div className="l-cta-row">
            <ResumeLink className="key key--primary" courseId={course.id} chapters={chapters} />
            <p className="l-reassure">Free, no account, progress stays on your device</p>
          </div>
        </div>
      </section>

      <footer className="l-footer">
        <div className="container">
          <span>{course.title} study guide, {new Date().getFullYear()}</span>
          <nav aria-label="Footer">
            <a href="#map">Course map</a>
            <Link href="/glossary">Glossary</Link>
            <a href="#hero-title">Back to top</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
