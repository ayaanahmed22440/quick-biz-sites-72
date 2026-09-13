import type { ReactNode } from "react";

/**
 * Tiny Markdown renderer that outputs React elements (never raw HTML), so an
 * article can never inject script into the page. Supports the subset the blog
 * editor can produce: headings, paragraphs, bold/italic, links, inline code,
 * images, lists, blockquotes and horizontal rules.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${i++}`;

    if (match[2] !== undefined) {
      const src = match[2];
      if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) {
        nodes.push(
          <img
            key={key}
            src={src}
            alt={match[1] ?? ""}
            loading="lazy"
            className="my-6 w-full rounded-xl border border-border object-cover"
          />,
        );
      }
    } else if (match[4] !== undefined) {
      const href = match[4];
      const safe = /^(https?:\/\/|\/|mailto:|tel:)/i.test(href) ? href : "#";
      const external = safe.startsWith("http");
      nodes.push(
        <a
          key={key}
          href={safe}
          className="font-medium text-primary underline underline-offset-4"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {match[3]}
        </a>,
      );
    } else if (match[5] !== undefined) {
      nodes.push(<strong key={key}>{match[5]}</strong>);
    } else if (match[6] !== undefined) {
      nodes.push(<em key={key}>{match[6]}</em>);
    } else if (match[7] !== undefined) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">
          {match[7]}
        </code>,
      );
    }
    last = pattern.lastIndex;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={`p-${key++}`} className="text-[1.05rem] leading-8 text-foreground/85">
        {renderInline(paragraph.join(" "), `p${key}`)}
      </p>,
    );
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, idx) => (
      <li key={idx} className="leading-8 text-foreground/85">
        {renderInline(item, `li${key}-${idx}`)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`ol-${key++}`} className="list-decimal space-y-2 pl-6">
          {items}
        </ol>
      ) : (
        <ul key={`ul-${key++}`} className="list-disc space-y-2 pl-6">
          {items}
        </ul>
      ),
    );
    list = null;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(
      <blockquote
        key={`q-${key++}`}
        className="border-l-4 border-primary/60 bg-muted/40 px-5 py-4 text-lg italic text-foreground/80"
      >
        {renderInline(quote.join(" "), `q${key}`)}
      </blockquote>,
    );
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1]!.length;
      const content = renderInline(heading[2]!, `h${key}`);
      const cls =
        level === 1
          ? "mt-10 text-3xl font-extrabold tracking-tight sm:text-4xl"
          : level === 2
            ? "mt-10 text-2xl font-bold tracking-tight sm:text-3xl"
            : level === 3
              ? "mt-8 text-xl font-bold tracking-tight"
              : "mt-6 text-lg font-semibold";
      const Tag = (`h${Math.min(level + 1, 6)}` as unknown) as "h2";
      blocks.push(
        <Tag key={`h-${key++}`} className={cls}>
          {content}
        </Tag>,
      );
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll();
      blocks.push(<hr key={`hr-${key++}`} className="my-10 border-border" />);
      continue;
    }

    const quoted = /^>\s?(.*)$/.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]!);
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || ordered) {
      flushParagraph();
      flushQuote();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push((bullet?.[1] ?? ordered?.[1])!);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }
  flushAll();

  return <div className="space-y-5">{blocks}</div>;
}

/** Rough reading time in minutes, for the article header. */
export function readingMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Plain-text preview used when an author leaves the excerpt empty. */
export function plainExcerpt(body: string, length = 160) {
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*`_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}
