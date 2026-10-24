import type { Metadata, Viewport } from "next";
import { Heebo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Rail } from "@/components/Rail";
import { ReadingProgress } from "@/components/ReadingProgress";
import { loadCourse } from "@/lib/course";
import "katex/dist/katex.min.css";
import "./globals.css";

const sans = Heebo({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
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
    <html lang={course.lang} dir={course.dir} className={`${sans.variable} ${plex.variable} ${mono.variable}`}>
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
