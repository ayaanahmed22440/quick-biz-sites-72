import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { can } from "@/lib/plans";
import { ErrorBlock, LoadingBlock, PageHeader, UpgradePrompt } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/seo")({
  head: () => ({
    meta: [
      { title: "SEO — WebWarheads" },
      { name: "description", content: "Local SEO settings for your website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SeoPage,
});

type SeoForm = {
  meta_title: string;
  meta_description: string;
  primary_keyword: string;
  primary_city: string;
  indexing_enabled: boolean;
  localbusiness_schema: boolean;
  service_schema: boolean;
  sitemap_enabled: boolean;
  robots_enabled: boolean;
};

function SeoPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SeoForm | null>(null);

  const seo = useQuery({
    queryKey: ["seo", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const [{ data: settings, error }, { data: business }] = await Promise.all([
        supabase.from("seo_settings").select("*").eq("business_id", businessId!).maybeSingle(),
        supabase
          .from("businesses")
          .select("name, city, primary_service")
          .eq("id", businessId!)
          .single(),
      ]);
      if (error) throw error;
      return { settings, business };
    },
  });

  useEffect(() => {
    if (!seo.data || form) return;
    const s = seo.data.settings;
    const b = seo.data.business;
    setForm({
      meta_title: s?.meta_title ?? `${b?.name ?? ""} — ${b?.primary_service ?? "Cleaning"}${b?.city ? ` in ${b.city}` : ""}`,
      meta_description: s?.meta_description ?? "",
      primary_keyword: s?.primary_keyword ?? (b?.primary_service ?? ""),
      primary_city: s?.primary_city ?? (b?.city ?? ""),
      indexing_enabled: s?.indexing_enabled ?? true,
      localbusiness_schema: s?.localbusiness_schema ?? true,
      service_schema: s?.service_schema ?? true,
      sitemap_enabled: s?.sitemap_enabled ?? true,
      robots_enabled: s?.robots_enabled ?? true,
    });
  }, [seo.data, form]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form || !businessId) return;
      const { error } = await supabase
        .from("seo_settings")
        .upsert(
          { business_id: businessId, ...form, updated_at: new Date().toISOString() },
          { onConflict: "business_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("SEO settings saved");
      void queryClient.invalidateQueries({ queryKey: ["seo", businessId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  if (isLoading || seo.isLoading) return <LoadingBlock rows={3} />;

  const unlocked = workspace ? can(workspace.entitlements, "seo") : false;

  if (!unlocked) {
    return (
      <>
        <PageHeader title="SEO" description="Helping local customers find you when they search." />
        <UpgradePrompt
          title="SEO is part of the $68 plan"
          description="Local keyword targeting, page titles and descriptions, structured data, sitemap and indexing setup are included from the Website + SEO plan up."
          plan="seo"
        />
      </>
    );
  }

  if (seo.isError) return <ErrorBlock />;
  if (!form) return <LoadingBlock rows={3} />;

  const set = <K extends keyof SeoForm>(key: K, value: SeoForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <>
      <PageHeader
        title="SEO"
        description="What search engines see. We do the groundwork properly — nobody can guarantee rankings."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Search result wording</h2>
          <div className="space-y-1">
            <Label>Page title</Label>
            <Input
              value={form.meta_title}
              maxLength={60}
              onChange={(e) => set("meta_title", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{form.meta_title.length}/60 characters</p>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={3}
              maxLength={158}
              value={form.meta_description}
              onChange={(e) => set("meta_description", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {form.meta_description.length}/158 characters
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="truncate text-sm text-primary">{form.meta_title || "Your page title"}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {form.meta_description || "Your description appears here in search results."}
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Local targeting</h2>
          <div className="space-y-1">
            <Label>Main service you want to be found for</Label>
            <Input
              value={form.primary_keyword}
              onChange={(e) => set("primary_keyword", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Main town or city</Label>
            <Input value={form.primary_city} onChange={(e) => set("primary_city", e.target.value)} />
          </div>
          <Toggle
            label="Allow search engines to list my site"
            checked={form.indexing_enabled}
            onChange={(v) => set("indexing_enabled", v)}
          />
          <Toggle
            label="Include business information for search engines"
            checked={form.localbusiness_schema}
            onChange={(v) => set("localbusiness_schema", v)}
          />
          <Toggle
            label="Include service information for search engines"
            checked={form.service_schema}
            onChange={(v) => set("service_schema", v)}
          />
          <Toggle
            label="Include my site in the sitemap"
            checked={form.sitemap_enabled}
            onChange={(v) => set("sitemap_enabled", v)}
          />
        </section>
      </div>

      <div className="mt-6">
        <Button disabled={save.isPending} onClick={() => save.mutate()}>
          Save SEO settings
        </Button>
      </div>
    </>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
