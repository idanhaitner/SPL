import { loadCourse } from "@/lib/course";

// Written to out/search.json at build time, so the index stays out of every page's HTML.
export const dynamic = "force-static";

export function GET() {
  return Response.json(loadCourse().search);
}
