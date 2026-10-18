import type { Metadata } from "next";
import { Newsreader, Source_Code_Pro, Source_Sans_3 } from "next/font/google";
import { Rail } from "@/components/Rail";
import { ReadingProgress } from "@/components/ReadingProgress";
import { loadCourse } from "@/lib/course";
import "katex/dist/katex.min.css";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const mono = Source_Code_Pro({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const course = loadCourse();
  return { title: course.title, description: course.summary };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const course = loadCourse();
  return (
    <html lang={course.lang} dir={course.dir} className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <ReadingProgress />
        <a className="skip" href="#content">Skip to content</a>
        <div className="shell">
          <Rail
            courseId={course.id}
            title={course.title}
            chapters={course.topics.map((topic) => ({
              id: topic.id,
              title: topic.title,
              practiceIds: topic.practiceIds,
            }))}
            hits={course.search}
          />
          <main id="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
