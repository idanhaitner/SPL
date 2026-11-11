"use client";

import { usePathname, useRouter } from "next/navigation";
import { TOUR_EVENT } from "@/lib/tour";

// Replays the tour: on the home page it asks the launcher, and anywhere else it goes there first.
export function TourLink() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <button
      type="button"
      className="gh-linkbtn"
      onClick={() => {
        if (pathname === "/") window.dispatchEvent(new Event(TOUR_EVENT));
        else router.push("/#tour");
      }}
    >
      Tour
    </button>
  );
}
