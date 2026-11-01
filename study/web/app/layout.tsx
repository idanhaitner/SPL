import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, IBM_Plex_Sans, IBM_Plex_Sans_Hebrew, JetBrains_Mono } from "next/font/google";
import { Rail } from "@/components/Rail";
import { ReadingProgress } from "@/components/ReadingProgress";
import { loadCourse } from "@/lib/course";
import "katex/dist/katex.min.css";
import "./globals.css";

const display = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-familjen",
  display: "swap",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});
const hebrew = IBM_Plex_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-hebrew",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const course = loadCourse();
  return { title: course.title, description: course.summary };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const course = loadCourse();
  return (
    <html lang={course.lang} dir={course.dir} className={`${display.variable} ${body.variable} ${hebrew.variable} ${mono.variable}`}>
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
