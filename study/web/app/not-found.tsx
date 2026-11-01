import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/home/Icon";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="masthead not-found">
      <div className="gh-arch gh-arch-1" />
      <div className="gh-arch gh-arch-2" />
      <div className="masthead-inner">
        <h1>This page isn&rsquo;t here</h1>
        <p className="masthead-lede">The link may be old or mistyped. Your progress is safe, and the whole course is one step away.</p>
        <Link className="gh-btn" href="/">Back to home <Icon name="arrow" /></Link>
      </div>
    </div>
  );
}
