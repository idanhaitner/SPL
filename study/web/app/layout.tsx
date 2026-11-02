import type { Metadata, Viewport } from "next";
import { Figtree, Gabarito, Heebo, JetBrains_Mono } from "next/font/google";
import { ChapterBloom } from "@/components/shell/ChapterBloom";
import { loadCourse } from "@/lib/course";
import { courseNav, stemParts } from "@/lib/nav";
import "katex/dist/katex.min.css";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["500", "800"],
  variable: "--font-gabarito",
  display: "swap",
});
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figtree",
  display: "swap",
});
const heebo = Heebo({
  subsets: ["hebrew"],
  weight: ["400", "600"],
  variable: "--font-heebo",
  display: "swap",
});

// Runs before the first paint, so a chosen theme never flashes the other one, and the plant grows only once a session.
const THEME_SCRIPT = `try{var t=localStorage.getItem("study:theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;if(sessionStorage.getItem("study:grown"))document.documentElement.dataset.grown="1"}catch(e){}`;

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
  const nav = courseNav(course);
  return (
    <html lang={course.lang} dir={course.dir} className={`${mono.variable} ${gabarito.variable} ${figtree.variable} ${heebo.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip" href="#content">Skip to content</a>
        <main id="content">{children}</main>
        <ChapterBloom courseId={course.id} chapters={nav.chapters} partStarts={stemParts(nav)} />
      </body>
    </html>
  );
}
