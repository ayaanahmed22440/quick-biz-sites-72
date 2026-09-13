import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteBlogPost, listAllBlogPosts, setBlogPostStatus } from "@/lib/blog.functions";

export const Route = createFileRoute("/_authenticated/admin-blog")({
  head: () => ({
    meta: [
      { title: "Blog — WebWarheads Admin" },
      { name: "description", content: "Write and publish WebWarheads blog articles." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBlogPage,
});

function AdminBlogPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const fetchPosts = useServerFn(listAllBlogPosts);
  const toggleStatus = useServerFn(setBlogPostStatus);
  const removePost = useServerFn(deleteBlogPost);
  const [search, setSearch] = useState("");
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  const posts = useQuery({
    queryKey: ["admin-blog-posts"],
    enabled: Boolean(workspace?.isStaff),
    queryFn: () => fetchPosts({}),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "published" }) => toggleStatus({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(vars.status === "published" ? "Article published" : "Article unpublished");
      void queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: () => toast.error("That didn't work. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removePost({ data: { id } }),
    onSuccess: () => {
      toast.success("Article deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: () => toast.error("Could not delete that article."),
  });

  if (isLoading) return <LoadingBlock />;
  if (!workspace?.isStaff) return <ErrorBlock message="This area is for WebWarheads staff only." />;

  const term = search.trim().toLowerCase();
  const rows = (posts.data ?? []).filter(
    (p) =>
      !term ||
      p.title.toLowerCase().includes(term) ||
      p.slug.toLowerCase().includes(term) ||
      (p.category ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        description="Write articles that bring search traffic to WebWarheads."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles…"
          className="max-w-xs"
        />
        <Button asChild className="ml-auto">
          <Link to="/admin-blog/$postId" params={{ postId: "new" }}>
            <Plus className="mr-1.5 h-4 w-4" /> New article
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href="/blog" target="_blank" rel="noopener noreferrer">
            View blog <ExternalLink className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
      </div>

      {posts.isLoading ? <LoadingBlock /> : null}
      {posts.isError ? <ErrorBlock message="Could not load the articles." /> : null}

      {posts.data && rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No articles yet. Write your first one to start pulling in search traffic.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {rows.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                {post.cover_image_url ? (
                  <img src={post.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/admin-blog/$postId"
                    params={{ postId: post.id }}
                    className="font-semibold hover:underline"
                  >
                    {post.title}
                  </Link>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {post.status === "published" ? "Published" : "Draft"}
                  </Badge>
                  {post.category ? <Badge variant="outline">{post.category}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  /blog/{post.slug}
                  {post.author_name ? ` · ${post.author_name}` : ""} · updated{" "}
                  {new Date(post.updated_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin-blog/$postId" params={{ postId: post.id }}>
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      id: post.id,
                      status: post.status === "published" ? "draft" : "published",
                    })
                  }
                >
                  {post.status === "published" ? (
                    <>
                      <EyeOff className="mr-1.5 h-4 w-4" /> Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1.5 h-4 w-4" /> Publish
                    </>
                  )}
                </Button>
                <label className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground">
                  <Checkbox
                    checked={Boolean(confirmed[post.id])}
                    onCheckedChange={(v) => setConfirmed((s) => ({ ...s, [post.id]: v === true }))}
                  />
                  Confirm delete
                </label>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!confirmed[post.id] || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
