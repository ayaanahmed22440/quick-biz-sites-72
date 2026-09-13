import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/components/app/ImageUpload";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/avif";
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

/** Shared folder in the media store that holds WebWarheads blog imagery. */
export const BLOG_MEDIA_FOLDER = "00000000-0000-0000-0000-0000000b1069";

/** Picture upload for the blog editor — staff only, no business attached. */
export function BlogImageUpload({
  label,
  hint,
  value,
  onChange,
  buttonOnly = false,
}: {
  label: string;
  hint?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  buttonOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please choose a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is larger than 8 MB. Please choose a smaller one.");
      return;
    }
    setBusy(true);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${BLOG_MEDIA_FOLDER}/post-${Date.now()}.${ext || "jpg"}`;

    const { error } = await supabase.storage
      .from("business-media")
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });

    setBusy(false);
    if (error) {
      toast.error("That upload didn't work. Please try again.");
      return;
    }
    onChange(mediaUrl(path));
    toast.success("Image uploaded");
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) void handleFile(file);
      }}
    />
  );

  if (buttonOnly) {
    return (
      <>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
          {label}
        </Button>
        {input}
      </>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
            {value ? "Replace" : "Upload"}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
      {input}
    </div>
  );
}
