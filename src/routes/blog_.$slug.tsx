import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBlogPost } from "@/lib/blog.functions";
import { Markdown, plainExcerpt, readingMinutes } from "@/lib/markdown";

const SITE = "https://www.webwarheads.com";

const postQuery = (slug: string) =>
  queryOptions({ queryKey: ["blog", "post", slug], queryFn: () => getBlogPost({ data: { slug } }) });

export const Route = createFileRoute("/blog_/$slug")({
  loader: async ({ context, params }) => {
    const result = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!result.post) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return {};
    const title = post.meta_title ?? `${post.title} — WebWarheads`;
    const description = post.meta_description ?? post.excerpt ?? plainExcerpt(post.body, 155);
    const url = post.canonical_url ?? `${SITE}/blog/${post.slug}`;
    const image = post.og_image_url ?? post.cover_image_url;
    const absoluteImage = image
      ? image.startsWith("http")
        ? image
        : `${SITE}${image}`
      : `${SITE}/og-cover.jpg`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(post.indexable ? [] : [{ name: "robots", content: "noindex" }]),
        { property: "og:title", content: post.meta_title ?? post.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: absoluteImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.meta_title ?? post.title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: absoluteImage },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description,
            image: absoluteImage,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: { "@type": "Organization", name: post.author_name ?? "WebWarheads" },
            publisher: {
              "@type": "Organization",
              name: "WebWarheads",
              logo: { "@type": "ImageObject", url: `${SITE}/icon-192.png` },
            },
            mainEntityOfPage: url,
          }).replace(/</g, "\\u003c"),
        },
      ],
    };
  },
  errorComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-muted-foreground">This article couldn't be loaded right now.</p>
      </div>
    </PublicLayout>
  ),
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Article not found</h1>
        <Button asChild className="mt-6">
          <Link to="/blog">Back to the blog</Link>
        </Button>
      </div>
    </PublicLayout>
  ),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(slug));
  const post = data.post!;
  const shareUrl = `${SITE}/blog/${post.slug}`;

  return (
    <PublicLayout>
      <article>
        <header className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> All articles
            </Link>
            {post.category ? (
              <Badge variant="secondary" className="mt-6">
                {post.category}
              </Badge>
            ) : null}
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
            {post.excerpt ? <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {post.author_name ? <span>By {post.author_name}</span> : null}
              {post.published_at ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {readingMinutes(post.body)} min read
              </span>
            </div>
          </div>
        </header>

        {post.cover_image_url ? (
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <img
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              className="-mt-8 aspect-[16/8] w-full rounded-3xl border border-border object-cover shadow-lg sm:-mt-12"
            />
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <Markdown source={post.body} />

          {post.tags?.length ? (
            <div className="mt-12 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-8 text-sm">
            <span className="text-muted-foreground">Share this article</span>
            <a
              className="rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              className="rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted"
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>
            <a
              className="rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>

          <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight">Your own website, live today</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Pick a design, add your details, publish. From $37 a month.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/onboarding">
                Preview my website <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {data.related.length ? (
          <section className="border-t border-border bg-muted/30">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-tight">Keep reading</h2>
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {data.related.map((item) => (
                  <Link
                    key={item.id}
                    to="/blog/$slug"
                    params={{ slug: item.slug }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      {item.cover_image_url ? (
                        <img
                          src={item.cover_image_url}
                          alt={item.cover_image_alt ?? item.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-6">
                      <h3 className="font-bold leading-snug tracking-tight">{item.title}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {item.excerpt ?? plainExcerpt(item.reading_body)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </article>
    </PublicLayout>
  );
}
