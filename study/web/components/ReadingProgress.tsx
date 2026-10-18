"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const place = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      setScale(max > 0 ? root.scrollTop / max : 0);
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, []);

  return <div className="reading-progress" style={{ transform: `scaleX(${scale})` }} />;
}
