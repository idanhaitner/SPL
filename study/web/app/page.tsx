import Link from "next/link";
import { codeToHtml } from "shiki";
import { ChapterProgress } from "@/components/ChapterProgress";
import { LandingNav } from "@/components/landing/LandingNav";
import { ResumeLink } from "@/components/landing/ResumeLink";
import { Reveal } from "@/components/landing/Reveal";
import { Showcase, type ShowcasePanel } from "@/components/landing/Showcase";
import { Tagline } from "@/components/landing/Tagline";
import { Mixed } from "@/lib/bidi";
import { loadCourse } from "@/lib/course";

const PARTS = [
  {
    title: "Memory in C++",
    lang: "C++",
    summary: "Where a program lives while it runs, what a pointer really holds, and how an object that owns memory is copied, moved, and destroyed.",
    ids: ["run-time-environment", "memory-model", "pointers", "classes-and-objects", "rule-of-three", "rule-of-five", "inheritance"],
  },
  {
    title: "Concurrency in Java",
    lang: "Java",
    summary: "Threads and tasks, which results count as correct, locks and visibility, and how to wait without starving or deadlocking.",
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

const SNIPPETS = [
  {
    key: "memory",
    part: "Memory",
    file: "buffer.cpp",
    lang: "cpp",
    note: "freeing the old buffer before the new copy exists.",
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
    note: "an if around wait() instead of a while.",
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
    note: "a heavy call on the selector thread.",
    code: `// The selector thread only dispatches
while (!Thread.currentThread().isInterrupted()) {
    selector.select();
    for (SelectionKey key : selector.selectedKeys()) {
        if (key.isAcceptable()) accept(key);
        else if (key.isReadable()) pool.submit(() -> read(key));
    }
    selector.selectedKeys().clear();
}`,
  },
  {
    key: "databases",
    part: "Databases",
    file: "enrollments.sql",
    lang: "sql",
    note: "a join with no condition, which returns every pair.",
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
    text: "Each chapter follows one of Adler's lectures, with a diagram of the idea and a worked example in real code.",
  },
  {
    title: "Answer real exam questions",
    text: "Practice cards come from the 2015 to 2024 exams. Open a hint first, then compare your answer with the solution.",
  },
  {
    title: "Pick up where you stopped",
    text: "Solved questions and your last chapter are saved in this browser, so the guide reopens on the right page.",
  },
];

export default async function HomePage() {
  const course = loadCourse();
  const chapters = course.topics.map((topic) => ({ id: topic.id, title: topic.title }));
  const position = new Map(course.topics.map((topic, index) => [topic.id, index]));
  const practiceCount = course.topics.reduce((sum, topic) => sum + topic.practiceIds.length, 0);
  const mapped = new Set(PARTS.flatMap((part) => part.ids));
  const finale = course.topics.filter((topic) => !mapped.has(topic.id));

  const panels: ShowcasePanel[] = await Promise.all(
    SNIPPETS.map(async (snippet) => ({
      key: snippet.key,
      part: snippet.part,
      file: snippet.file,
      note: snippet.note,
      html: await codeToHtml(snippet.code, { lang: snippet.lang, theme: "github-dark" }),
    })),
  );

  const faq = [
    {
      q: "Is this the official course site?",
      a: "No. It is a study guide that follows Meni Adler's lecture notes, the exercise sessions, and past exams. The course site stays the source for dates, assignments, and grading.",
    },
    {
      q: "Where do the practice questions come from?",
      a: `All ${practiceCount} come from exams written between 2015 and 2024. The year is hidden, so you judge each question by what it asks and not by when it was set.`,
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
      <Reveal />
      <LandingNav courseId={course.id} title={course.title} chapters={chapters} />

      <section className="l-hero" aria-labelledby="hero-title">
        <div className="l-wrap l-hero-grid">
          <div className="l-hero-copy">
            <p className="l-eyebrow">Systems Programming study guide · {course.topics.length} chapters</p>
            <h1 id="hero-title" className="l-title">
              From a raw pointer<br />
              to a running server
            </h1>
            <p className="l-sub">
              Every lecture of the course in one place, from C++ memory to Java threads, sockets, and SQL.
              Each chapter ends with questions taken from ten years of past exams.
            </p>
            <div className="l-cta-row">
              <ResumeLink className="lbtn" courseId={course.id} chapters={chapters} />
              <span className="l-reassure">Free, no account, progress stays on your device</span>
            </div>
            <dl className="l-stats">
              <div><dt>Chapters</dt><dd>{course.topics.length}</dd></div>
              <div><dt>Exam questions</dt><dd>{practiceCount}</dd></div>
              <div><dt>Glossary terms</dt><dd>{course.glossary.length}</dd></div>
              <div><dt>Exam years</dt><dd>2015 to 2024</dd></div>
            </dl>
          </div>
          <div className="l-hero-visual">
            <Showcase panels={panels} />
          </div>
        </div>
      </section>

      <section className="l-tagline" aria-label="What the course teaches">
        <div className="l-wrap">
          <Tagline lines={["Know where every byte lives,", "who owns it, and which thread", "touches it next."]} />
        </div>
      </section>

      <section className="l-section" id="map" aria-labelledby="map-title">
        <div className="l-wrap">
          <header className="l-head" data-reveal>
            <p className="l-eyebrow">Course map</p>
            <h2 id="map-title">Four parts, one route</h2>
            <p>The course climbs from a single process in memory to many processes sharing data. Follow it top to bottom.</p>
          </header>
          <ol className="l-parts">
            {PARTS.map((part, partIndex) => (
              <li className="l-part" key={part.title} data-reveal>
                <div className="l-part-info">
                  <span className="l-part-num" aria-hidden="true">{String(partIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="l-part-meta">Part {partIndex + 1} · {part.lang}</p>
                    <h3>{part.title}</h3>
                    <p>{part.summary}</p>
                  </div>
                </div>
                <ol className="l-chapters">
                  {part.ids
                    .map((id) => course.topics.find((topic) => topic.id === id))
                    .filter((topic) => topic !== undefined)
                    .map((topic) => (
                      <li key={topic.id}>
                        <Link className="l-chapter" href={`/topics/${topic.id}`}>
                          <span className="l-chapter-num">{String((position.get(topic.id) ?? 0) + 1).padStart(2, "0")}</span>
                          <span className="l-chapter-body">
                            <strong><Mixed text={topic.title} /></strong>
                            {topic.blurb && <span><Mixed text={topic.blurb} /></span>}
                            <ChapterProgress courseId={course.id} practiceIds={topic.practiceIds} />
                          </span>
                        </Link>
                      </li>
                    ))}
                </ol>
              </li>
            ))}
          </ol>
          {finale.map((topic) => (
            <Link className="l-finale" href={`/topics/${topic.id}`} key={topic.id} data-reveal>
              <span className="l-chapter-num">{String((position.get(topic.id) ?? 0) + 1).padStart(2, "0")}</span>
              <span className="l-chapter-body">
                <strong><Mixed text={topic.title} /></strong>
                {topic.blurb && <span><Mixed text={topic.blurb} /></span>}
              </span>
              <span className="l-finale-tag">Before the exam</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="l-section" id="how" aria-labelledby="how-title">
        <div className="l-wrap">
          <header className="l-head" data-reveal>
            <p className="l-eyebrow">How it works</p>
            <h2 id="how-title">Read, answer, come back</h2>
          </header>
          <ol className="l-steps">
            {STEPS.map((step, index) => (
              <li key={step.title} data-reveal style={{ transitionDelay: `${index * 80}ms` }}>
                <span className="l-step-num">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="l-section" id="faq" aria-labelledby="faq-title">
        <div className="l-wrap l-faq-grid">
          <header className="l-head" data-reveal>
            <p className="l-eyebrow">Questions</p>
            <h2 id="faq-title">Before you start</h2>
          </header>
          <div className="l-faq" data-reveal>
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
        <div className="l-wrap" data-reveal>
          <h2 id="final-title" className="l-title">
            The exam is closer<br />
            than it looks
          </h2>
          <p className="l-sub">Start with chapter 1. The guide remembers where you stop, so your next session opens on the right page.</p>
          <div className="l-cta-row">
            <ResumeLink className="lbtn" courseId={course.id} chapters={chapters} />
            <span className="l-reassure">Free, no account, progress stays on your device</span>
          </div>
        </div>
      </section>

      <footer className="l-footer">
        <div className="l-wrap">
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
