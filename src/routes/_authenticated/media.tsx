import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/components/app/ImageUpload";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => ({
    meta: [
      { title: "Media — WebWarheads" },
      { name: "description", content: "Your logo and website images." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MediaPage,
});

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

function MediaPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id ?? null;
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const library = useQuery({
    queryKey: ["media", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("id, url, kind, alt_text, storage_path, created_at")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (item: { id: string; storage_path: string | null }) => {
      if (item.storage_path) {
        await supabase.storage.from("business-media").remove([item.storage_path]);
      }
      const { error } = await supabase.from("media").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Image deleted");
      void queryClient.invalidateQueries({ queryKey: ["media", businessId] });
    },
    onError: () => toast.error("That image couldn't be deleted. Please try again."),
  });

  async function uploadFiles(files: File[]) {
    if (!businessId) return;
    setBusy(true);
    let uploaded = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} isn't an image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 8 MB.`);
        continue;
      }
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${businessId}/photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
      const { error } = await supabase.storage
        .from("business-media")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
      if (error) {
        toast.error(`${file.name} didn't upload. Please try again.`);
        continue;
      }
      await supabase
        .from("media")
        .insert({ business_id: businessId, url: mediaUrl(path), kind: "photo", storage_path: path });
      uploaded += 1;
    }
    setBusy(false);
    if (uploaded > 0) {
      toast.success(uploaded === 1 ? "Image added" : `${uploaded} images added`);
      void queryClient.invalidateQueries({ queryKey: ["media", businessId] });
    }
  }

  if (isLoading) return <LoadingBlock rows={4} />;

  if (!businessId) {
    return (
      <>
        <PageHeader title="Media" description="Your logo and the photos used on your website." />
        <EmptyState
          title="No business set up yet"
          description="Finish setting up your business and your photo library will appear here."
        />
      </>
    );
  }

  const items = library.data ?? [];

  return (
    <>
      <PageHeader
        title="Media"
        description="Every photo and logo you've uploaded. Add pictures here, then pick them in the website editor."
        action={
          <Button disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload photos
          </Button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void uploadFiles(files);
        }}
      />

      {library.isLoading ? <LoadingBlock rows={3} /> : null}
      {library.isError ? <ErrorBlock /> : null}

      {!library.isLoading && !library.isError && items.length === 0 ? (
        <EmptyState
          title="No pictures yet"
          description="Upload your logo and a few photos of your work — JPG, PNG, WebP or SVG up to 8 MB each."
          action={<Button onClick={() => inputRef.current?.click()}>Upload photos</Button>}
        />
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex h-40 items-center justify-center bg-muted/40">
                <img
                  src={item.url}
                  alt={item.alt_text ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-xs text-muted-foreground">{item.kind}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        `${window.location.origin}${item.url.startsWith("/") ? item.url : `/${item.url}`}`,
                      );
                      toast.success("Link copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy link</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate({ id: item.id, storage_path: item.storage_path })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
