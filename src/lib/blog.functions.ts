import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/** Anonymous, read-only client used for the public blog pages. */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const LIST_COLUMNS =
  "id, title, slug, excerpt, cover_image_url, cover_image_alt, category, tags, author_name, published_at, reading_body:body";

export type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category: string | null;
  tags: string[];
  author_name: string | null;
  published_at: string | null;
  reading_body: string;
};

export type BlogPost = BlogListItem & {
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  focus_keyword: string | null;
  indexable: boolean;
  updated_at: string;
};

const PAGE_SIZE = 9;

/** Published posts for the public index, newest first. */
export const listBlogPosts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ page: z.number().int().min(1).default(1), category: z.string().optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const from = (data.page - 1) * PAGE_SIZE;

    let query = supabase
      .from("blog_posts")
      .select(LIST_COLUMNS, { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE_SIZE - 1);
    if (data.category) query = query.eq("category", data.category);

    const { data: rows, count, error } = await query;
    if (error) return { posts: [] as BlogListItem[], total: 0, pageSize: PAGE_SIZE, categories: [] as string[] };

    const { data: categoryRows } = await supabase
      .from("blog_posts")
      .select("category")
      .eq("status", "published")
      .not("category", "is", null);

    const categories = Array.from(
      new Set((categoryRows ?? []).map((r) => r.category as string).filter(Boolean)),
    ).sort();

    return {
      posts: (rows ?? []) as unknown as BlogListItem[],
      total: count ?? 0,
      pageSize: PAGE_SIZE,
      categories,
    };
  });

/** One published article plus a few related reads. */
export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: post } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!post) return { post: null, related: [] as BlogListItem[] };

    const { data: related } = await supabase
      .from("blog_posts")
      .select(LIST_COLUMNS)
      .eq("status", "published")
      .neq("id", post.id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(3);

    return {
      post: { ...post, reading_body: post.body } as unknown as BlogPost,
      related: (related ?? []) as unknown as BlogListItem[],
    };
  });

async function requireStaff(context: { supabase: { rpc: Function }; userId: string }) {
  const { data: isStaff, error } = await (context.supabase as any).rpc("is_platform_staff", {
    _user_id: context.userId,
  });
  if (error) throw error;
  if (!isStaff) throw new Error("Staff access required");
}

/** Every post, drafts included — staff only. */
export const listAllBlogPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as never);
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select(
        "id, title, slug, status, category, author_name, published_at, updated_at, cover_image_url",
      )
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getBlogPostForEdit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const { data: post, error } = await context.supabase
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return post;
  });

const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only"),
  excerpt: z.string().trim().max(400).nullable().optional(),
  body: z.string().max(120_000),
  cover_image_url: z.string().trim().max(500).nullable().optional(),
  cover_image_alt: z.string().trim().max(200).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  status: z.enum(["draft", "published"]),
  meta_title: z.string().trim().max(200).nullable().optional(),
  meta_description: z.string().trim().max(400).nullable().optional(),
  og_image_url: z.string().trim().max(500).nullable().optional(),
  canonical_url: z.string().trim().max(500).nullable().optional(),
  focus_keyword: z.string().trim().max(80).nullable().optional(),
  indexable: z.boolean().default(true),
});

/** Creates or updates a post. Publishing stamps the publish date once. */
export const saveBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => postSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", context.userId)
      .maybeSingle();

    const clean = <T,>(value: T | null | undefined) =>
      typeof value === "string" ? (value.trim() ? value.trim() : null) : (value ?? null);

    const payload = {
      title: data.title,
      slug: data.slug,
      excerpt: clean(data.excerpt),
      body: data.body,
      cover_image_url: clean(data.cover_image_url),
      cover_image_alt: clean(data.cover_image_alt),
      category: clean(data.category),
      tags: data.tags,
      status: data.status,
      meta_title: clean(data.meta_title),
      meta_description: clean(data.meta_description),
      og_image_url: clean(data.og_image_url),
      canonical_url: clean(data.canonical_url),
      focus_keyword: clean(data.focus_keyword),
      indexable: data.indexable,
    };

    if (data.id) {
      const { data: existing } = await context.supabase
        .from("blog_posts")
        .select("published_at")
        .eq("id", data.id)
        .maybeSingle();

      const { data: updated, error } = await context.supabase
        .from("blog_posts")
        .update({
          ...payload,
          published_at:
            data.status === "published"
              ? (existing?.published_at ?? new Date().toISOString())
              : existing?.published_at ?? null,
        })
        .eq("id", data.id)
        .select("id, slug")
        .single();
      if (error) throw new Error(friendly(error.message));
      return updated;
    }

    const { data: created, error } = await context.supabase
      .from("blog_posts")
      .insert({
        ...payload,
        author_id: context.userId,
        author_name: profile?.full_name ?? profile?.email ?? "WebWarheads",
        published_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .select("id, slug")
      .single();
    if (error) throw new Error(friendly(error.message));
    return created;
  });

function friendly(message: string) {
  if (message.includes("blog_posts_slug_key")) {
    return "Another post already uses that web address — pick a different one.";
  }
  return message;
}

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { deleted: true };
  });

/** Quick publish / unpublish from the list screen. */
export const setBlogPostStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["draft", "published"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const { data: existing } = await context.supabase
      .from("blog_posts")
      .select("published_at")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase
      .from("blog_posts")
      .update({
        status: data.status,
        published_at:
          data.status === "published"
            ? (existing?.published_at ?? new Date().toISOString())
            : existing?.published_at ?? null,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
