import katex from "katex";
import Link from "next/link";
import type { ReactNode } from "react";
import { Mixed } from "@/lib/bidi";

function mathHtml(tex: string, display: boolean) {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    output: "html",
  });
}

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function hrefOf(url: string): string | null {
  if (url.startsWith("topic:")) return `/topics/${url.slice(6)}`;
  if (url === "study:glossary") return "/glossary";
  if (url === "study:index" || url === "study:drill") return "/";
  if (url.startsWith("repo:")) return null;
  if (url.startsWith("../assets/figures/")) return `${assetBase}/figures/${url.slice("../assets/figures/".length)}`;
  return url;
}

const FIGURE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

export function Paragraph({ text }: { text: string }) {
  const only = text.trim().match(FIGURE);
  if (only) {
    const src = hrefOf(only[2]);
    if (src) {
      return (
        <figure className="figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={only[1]} />
          {only[1] ? <figcaption><Mixed text={only[1]} /></figcaption> : null}
        </figure>
      );
    }
  }
  return (
    <p>
      <Inline text={text} />
    </p>
  );
}

function richText(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(<Mixed key={`${keyBase}-t${index}`} text={text.slice(last, match.index)} />);
    const key = `${keyBase}-${index++}`;
    if (match[1] != null) {
      const src = hrefOf(match[2]);
      if (src) {
        nodes.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img key={key} src={src} alt={match[1]} />,
        );
      }
    } else if (match[3] != null) {
      const href = hrefOf(match[4]);
      if (href) nodes.push(<Link key={key} href={href}><Mixed text={match[3]} /></Link>);
      else nodes.push(<span key={key}><Mixed text={match[3]} /></span>);
    } else if (match[5] != null) {
      nodes.push(<strong key={key}><Mixed text={match[5]} /></strong>);
    } else if (match[6] != null) {
      nodes.push(<em key={key}><Mixed text={match[6]} /></em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(<Mixed key={`${keyBase}-t${index}`} text={text.slice(last)} />);
  return nodes;
}

export function Inline({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const pattern = /(`+)([^`]*)\1|\$\$([^$\n]+)\$\$|\$([^$\n]+)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(...richText(text.slice(last, match.index), `t${index}`));
    const key = `k${index++}`;
    if (match[1]) {
      nodes.push(<code key={key}>{match[2]}</code>);
    } else if (match[3] != null) {
      nodes.push(
        <span key={key} className="math-display" dir="ltr" dangerouslySetInnerHTML={{ __html: mathHtml(match[3], true) }} />,
      );
    } else {
      nodes.push(
        <span key={key} className="math-inline" dir="ltr" dangerouslySetInnerHTML={{ __html: mathHtml(match[4] || "", false) }} />,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(...richText(text.slice(last), `t${index}`));
  return <>{nodes}</>;
}

export function DisplayMath({ tex }: { tex: string }) {
  return (
    <div className="math-display" dir="ltr" dangerouslySetInnerHTML={{ __html: mathHtml(tex, true) }} />
  );
}
