import type { Metadata, Viewport } from "next";
import { Archivo, Frank_Ruhl_Libre, Heebo, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { Rail } from "@/components/Rail";
import { ReadingProgress } from "@/components/ReadingProgress";
import { TabRail } from "@/components/TabRail";
import { loadCourse } from "@/lib/course";
import { PARTS, partOf } from "@/lib/parts";
import "katex/dist/katex.min.css";
import "./globals.css";

const heads = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-heads",
  display: "swap",
});
const reading = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-reading",
  display: "swap",
});
const hebrewSerif = Frank_Ruhl_Libre({
  subsets: ["hebrew"],
  weight: ["400", "500", "700"],
  variable: "--font-hebrew-serif",
  display: "swap",
});
const hebrewSans = Heebo({
  subsets: ["hebrew"],
  weight: ["400", "500", "700"],
  variable: "--font-hebrew-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
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
  const fonts = [heads, reading, hebrewSerif, hebrewSans, mono].map((font) => font.variable).join(" ");
  return (
    <html lang={course.lang} dir={course.dir} className={fonts}>
      <body>
        <ReadingProgress />
        <a className="skip" href="#content">Skip to content</a>
        <div className="board">
          <div className="leaf">
            <span className="punch" aria-hidden="true" />
            <Rail
              courseId={course.id}
              title={course.title}
              chapters={course.topics.map((topic) => ({
                id: topic.id,
                title: topic.title,
                part: partOf(topic.id).id,
                practiceIds: topic.practiceIds,
              }))}
              parts={PARTS.map(({ id, numeral, name }) => ({ id, numeral, name }))}
              hits={course.search}
            />
            <main id="content">{children}</main>
          </div>
          <TabRail parts={PARTS} />
        </div>
      </body>
    </html>
  );
}
