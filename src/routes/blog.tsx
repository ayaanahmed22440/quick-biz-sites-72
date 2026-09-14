import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { z } from "zod";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listBlogPosts, type BlogListItem } from "@/lib/blog.functions";
import { plainExcerpt, readingMinutes } from "@/lib/markdown";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  page: z.number().int().min(1).optional(),
  category: z.string().optional(),
});

const postsQuery = (page: number, category?: string) =>
  queryOptions({
    queryKey: ["blog", "list", page, category ?? "all"],
    queryFn: () => listBlogPosts({ data: { page, ...(category ? { category } : {}) } }),
  });

export const Route = createFileRoute("/blog")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1, category: search.category }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(postsQuery(deps.page, deps.category)),
  head: () => ({
    meta: [
      { title: "The WebWarheads Blog — Websites & SEO for local business" },
      {
        name: "description",
        content:
          "Practical guides on getting your local business online: websites that convert, local SEO, Google visibility and winning more jobs.",
      },
      { property: "og:title", content: "The WebWarheads Blog" },
      {
        property: "og:description",
        content: "Practical guides on local websites, SEO and getting found on Google.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.webwarheads.com/blog" },
      { property: "og:image", content: "https://www.webwarheads.com/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://www.webwarheads.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://www.webwarheads.com/blog" }],
  }),
  errorComponent: () => (
    <PublicLayout>
      <Shell>
        <p className="text-muted-foreground">The blog is temporarily unavailable. Please try again shortly.</p>
      </Shell>
    </PublicLayout>
  ),
  notFoundComponent: () => (
    <PublicLayout>
      <Shell>
        <p className="text-muted-foreground">That page doesn't exist.</p>
      </Shell>
    </PublicLayout>
  ),
  component: BlogIndex,
});

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">{children}</div>;
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BlogIndex() {
  const { page, category } = Route.useLoaderDeps();
  const { data } = useSuspenseQuery(postsQuery(page, category));
  const posts = data.posts;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const featured = page === 1 ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <PublicLayout>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">WebWarheads Blog</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Getting local businesses found online
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Straight-talking guides on websites, local SEO and turning searches into booked jobs — from the team
            behind $37 websites.
          </p>
        </div>
      </section>

      <Shell>
        {data.categories.length ? (
          <div className="mb-10 flex flex-wrap gap-2">
            <CategoryPill active={!category} label="All posts" />
            {data.categories.map((c) => (
              <CategoryPill key={c} to={c} active={category === c} label={c} />
            ))}
          </div>
        ) : null}

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No articles here yet — check back soon.</p>
        ) : null}

        {featured ? <FeaturedCard post={featured} /> : null}

        {rest.length ? (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="mt-14 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Button asChild variant="outline">
                <Link to="/blog" search={{ page: page - 1, ...(category ? { category } : {}) }}>
                  Previous
                </Link>
              </Button>
            ) : null}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Button asChild variant="outline">
                <Link to="/blog" search={{ page: page + 1, ...(category ? { category } : {}) }}>
                  Next
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-20 rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Want a site like the ones we write about?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Build your business website in minutes and go live from $37 a month.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/auth" search={{ mode: "signup" }}>
              Preview my website <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Shell>
    </PublicLayout>
  );
}

function CategoryPill({ to, active, label }: { to?: string; active: boolean; label: string }) {
  return (
    <Link
      to="/blog"
      search={to ? { category: to } : {}}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function Meta({ post }: { post: BlogListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {post.published_at ? (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.published_at)}
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" /> {readingMinutes(post.reading_body)} min read
      </span>
      {post.author_name ? <span>By {post.author_name}</span> : null}
    </div>
  );
}

function FeaturedCard({ post }: { post: BlogListItem }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg lg:grid-cols-2"
    >
      <div className="aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:h-full">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
        {post.category ? <Badge variant="secondary" className="w-fit">{post.category}</Badge> : null}
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{post.title}</h2>
        <p className="text-muted-foreground">{post.excerpt ?? plainExcerpt(post.reading_body, 220)}</p>
        <Meta post={post} />
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogListItem }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[16/9] overflow-hidden bg-muted">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        {post.category ? <Badge variant="secondary" className="w-fit">{post.category}</Badge> : null}
        <h3 className="text-lg font-bold leading-snug tracking-tight">{post.title}</h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {post.excerpt ?? plainExcerpt(post.reading_body)}
        </p>
        <div className="mt-auto pt-2">
          <Meta post={post} />
        </div>
      </div>
    </Link>
  );
}
