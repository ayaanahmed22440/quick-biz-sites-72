import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bold, Heading2, Image as ImageIcon, Italic, Link2, List, Quote } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogImageUpload } from "@/components/blog/BlogImageUpload";
import { Markdown } from "@/lib/markdown";
import { getBlogPostForEdit, saveBlogPost } from "@/lib/blog.functions";

export const Route = createFileRoute("/_authenticated/admin-blog_/$postId")({
  head: () => ({
    meta: [
      { title: "Write an article — WebWarheads Admin" },
      { name: "description", content: "Write, format and optimise a WebWarheads blog article." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BlogEditorPage,
});

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  category: string;
  tags: string;
  status: "draft" | "published";
  meta_title: string;
  meta_description: string;
  og_image_url: string | null;
  canonical_url: string;
  focus_keyword: string;
  indexable: boolean;
};

const EMPTY: Draft = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image_url: null,
  cover_image_alt: "",
  category: "",
  tags: "",
  status: "draft",
  meta_title: "",
  meta_description: "",
  og_image_url: null,
  canonical_url: "",
  focus_keyword: "",
  indexable: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 110);
}

function BlogEditorPage() {
  const { postId } = Route.useParams();
  const isNew = postId === "new";
  const { data: workspace, isLoading } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchPost = useServerFn(getBlogPostForEdit);
  const save = useServerFn(saveBlogPost);

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const existing = useQuery({
    queryKey: ["admin-blog-post", postId],
    enabled: Boolean(workspace?.isStaff) && !isNew,
    queryFn: () => fetchPost({ data: { id: postId } }),
  });

  useEffect(() => {
    const post = existing.data;
    if (!post) return;
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      body: post.body ?? "",
      cover_image_url: post.cover_image_url,
      cover_image_alt: post.cover_image_alt ?? "",
      category: post.category ?? "",
      tags: (post.tags ?? []).join(", "),
      status: post.status === "published" ? "published" : "draft",
      meta_title: post.meta_title ?? "",
      meta_description: post.meta_description ?? "",
      og_image_url: post.og_image_url,
      canonical_url: post.canonical_url ?? "",
      focus_keyword: post.focus_keyword ?? "",
      indexable: post.indexable,
    });
  }, [existing.data]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const mutation = useMutation({
    mutationFn: (status: "draft" | "published") =>
      save({
        data: {
          ...(isNew ? {} : { id: postId }),
          title: draft.title.trim(),
          slug: (draft.slug || slugify(draft.title)).trim(),
          excerpt: draft.excerpt,
          body: draft.body,
          cover_image_url: draft.cover_image_url,
          cover_image_alt: draft.cover_image_alt,
          category: draft.category,
          tags: draft.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          status,
          meta_title: draft.meta_title,
          meta_description: draft.meta_description,
          og_image_url: draft.og_image_url,
          canonical_url: draft.canonical_url,
          focus_keyword: draft.focus_keyword,
          indexable: draft.indexable,
        },
      }),
    onSuccess: (result, status) => {
      toast.success(status === "published" ? "Article published" : "Draft saved");
      void queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      set("status", status);
      if (isNew && result?.id) {
        void navigate({ to: "/admin-blog/$postId", params: { postId: result.id }, replace: true });
      }
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not save the article."),
  });

  if (isLoading) return <LoadingBlock />;
  if (!workspace?.isStaff) return <ErrorBlock message="This area is for WebWarheads staff only." />;
  if (!isNew && existing.isLoading) return <LoadingBlock />;

  function insert(before: string, after = "") {
    const el = document.getElementById("blog-body") as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = draft.body;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    set("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    });
  }

  const metaTitle = draft.meta_title || draft.title;
  const metaDescription = draft.meta_description || draft.excerpt;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => void navigate({ to: "/admin-blog" })}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to articles
      </Button>

      <PageHeader
        title={isNew ? "New article" : "Edit article"}
        description="Write the article, add pictures, then set how it appears in Google and on social."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      title: value,
                      slug: slugTouched ? d.slug : slugify(value),
                    }));
                  }}
                  placeholder="How local cleaners get found on Google"
                />
              </div>
              <div>
                <Label htmlFor="slug">Web address</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", slugify(e.target.value));
                    }}
                    placeholder="how-local-cleaners-get-found"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="excerpt">Short summary</Label>
                <Textarea
                  id="excerpt"
                  rows={2}
                  value={draft.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  placeholder="One or two lines shown on the blog listing."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={draft.category}
                    onChange={(e) => set("category", e.target.value)}
                    placeholder="Local SEO"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={draft.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="seo, google, cleaning"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => insert("## ")}>
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => insert("**", "**")}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => insert("*", "*")}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => insert("- ")}>
                  <List className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => insert("> ")}>
                  <Quote className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insert("[", "](https://example.com)")}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
                <span className="ml-auto">
                  <BlogImageUpload
                    buttonOnly
                    label="Insert image"
                    onChange={(url) => {
                      if (url) insert(`\n\n![](${url})\n\n`);
                    }}
                  />
                </span>
              </div>

              <Tabs defaultValue="write">
                <TabsList>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="write">
                  <Textarea
                    id="blog-body"
                    rows={22}
                    value={draft.body}
                    onChange={(e) => set("body", e.target.value)}
                    className="font-mono text-sm leading-6"
                    placeholder={"## A clear heading\n\nWrite your paragraph here.\n\n- A useful point\n- Another point"}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use the buttons above for headings, bold, lists, quotes, links and pictures.
                  </p>
                </TabsContent>
                <TabsContent value="preview">
                  <div className="rounded-lg border border-border bg-background p-6">
                    <Markdown source={draft.body || "_Nothing written yet._"} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cover picture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BlogImageUpload
                label="Cover image"
                hint="Shown at the top of the article and on the blog listing."
                value={draft.cover_image_url}
                onChange={(url) => set("cover_image_url", url)}
              />
              <div>
                <Label htmlFor="cover-alt">Image description</Label>
                <Input
                  id="cover-alt"
                  value={draft.cover_image_alt}
                  onChange={(e) => set("cover_image_alt", e.target.value)}
                  placeholder="Cleaner wiping a kitchen worktop"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search & social</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="meta-title">Google title</Label>
                  <span className="text-xs text-muted-foreground">{metaTitle.length}/60</span>
                </div>
                <Input
                  id="meta-title"
                  value={draft.meta_title}
                  onChange={(e) => set("meta_title", e.target.value)}
                  placeholder={draft.title || "Falls back to the article title"}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="meta-description">Google description</Label>
                  <span className="text-xs text-muted-foreground">{metaDescription.length}/160</span>
                </div>
                <Textarea
                  id="meta-description"
                  rows={3}
                  value={draft.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                  placeholder="What someone will read under the title in search results."
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Search result preview</p>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  webwarheads.com › blog › {draft.slug || "your-article"}
                </p>
                <p className="truncate text-base text-primary">{metaTitle || "Your article title"}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {metaDescription || "Your description appears here."}
                </p>
              </div>

              <div>
                <Label htmlFor="keyword">Main keyword</Label>
                <Input
                  id="keyword"
                  value={draft.focus_keyword}
                  onChange={(e) => set("focus_keyword", e.target.value)}
                  placeholder="cleaning business website"
                />
              </div>

              <BlogImageUpload
                label="Social share image"
                hint="Optional — the cover picture is used if you leave this empty."
                value={draft.og_image_url}
                onChange={(url) => set("og_image_url", url)}
              />

              <div>
                <Label htmlFor="canonical">Canonical link</Label>
                <Input
                  id="canonical"
                  value={draft.canonical_url}
                  onChange={(e) => set("canonical_url", e.target.value)}
                  placeholder="Leave empty unless this was published elsewhere first"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Allow search engines</p>
                  <p className="text-xs text-muted-foreground">Turn off to hide this from Google.</p>
                </div>
                <Switch checked={draft.indexable} onCheckedChange={(v) => set("indexable", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm text-muted-foreground">
                Status: <strong>{draft.status === "published" ? "Published" : "Draft"}</strong>
              </p>
              <Button
                className="w-full"
                disabled={mutation.isPending || draft.title.trim().length < 2}
                onClick={() => mutation.mutate("published")}
              >
                {draft.status === "published" ? "Save & keep live" : "Publish article"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={mutation.isPending || draft.title.trim().length < 2}
                onClick={() => mutation.mutate("draft")}
              >
                Save as draft
              </Button>
              {draft.status === "published" && draft.slug ? (
                <Button asChild variant="ghost" className="w-full">
                  <a href={`/blog/${draft.slug}`} target="_blank" rel="noopener noreferrer">
                    View live article
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
