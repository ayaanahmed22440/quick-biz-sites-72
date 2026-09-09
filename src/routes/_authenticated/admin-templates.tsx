import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalBusinessTemplate } from "@/components/templates/LocalBusinessTemplate";
import { PreviewFrame } from "@/components/app/PreviewFrame";
import { defaultSiteContent } from "@/lib/site-content";
import { TEMPLATE_PRESETS } from "@/lib/template-registry";
import { previewDataFor } from "@/lib/template-preview-data";

export const Route = createFileRoute("/_authenticated/admin-templates")({
  head: () => ({
    meta: [
      { title: "Website templates — WebWarheads" },
      {
        name: "description",
        content: "Preview every approved WebWarheads website template with sample business data.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTemplatesPage,
});

const WIDTHS = {
  desktop: 1280,
  tablet: 820,
  mobile: 390,
} as const;

type DeviceKey = keyof typeof WIDTHS;

function AdminTemplatesPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [accent, setAccent] = useState<string | null>(null);

  const templates = useQuery({
    queryKey: ["admin-template-gallery"],
    enabled: Boolean(workspace?.isStaff),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id, name, slug, status, niche, description")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedPreset = TEMPLATE_PRESETS.find((p) => p.templateId === activeSlug) ?? null;
  const previewData = previewDataFor(selectedPreset?.niche ?? "cleaning");

  const content = useMemo(
    () =>
      defaultSiteContent({
        businessName: previewData.business.name,
        city: previewData.business.city,
        primaryService: selectedPreset?.copy.service ?? "cleaning",
        primaryColor: accent ?? selectedPreset?.accent ?? null,
        templateId: selectedPreset?.templateId ?? null,
      }),
    [accent, previewData.business.city, previewData.business.name, selectedPreset],
  );

  if (isLoading) return <LoadingBlock rows={4} />;

  if (!workspace?.isStaff) {
    return (
      <>
        <PageHeader title="Website templates" />
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-base font-semibold">Not available</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This area is for the WebWarheads team only.
          </p>
        </div>
      </>
    );
  }

  if (templates.isLoading) return <LoadingBlock rows={4} />;
  if (templates.isError) return <ErrorBlock />;

  const dbRows = templates.data ?? [];
  const list = TEMPLATE_PRESETS.map((p) => ({
    ...p,
    status: dbRows.find((row) => row.slug === p.templateId)?.status ?? "approved",
  }));

  return (
    <>
      <PageHeader
        title="Website templates"
        description="Preview every template exactly as a customer's live site would look, using sample business details."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <div key={t.templateId} className="flex flex-col rounded-xl border border-border bg-card p-5">
            <img
              src={t.images.hero}
              alt=""
              loading="lazy"
              className="mb-4 h-32 w-full rounded-lg object-cover"
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{t.name}</h2>
                <p className="text-xs text-muted-foreground">{t.industryLabel}</p>
              </div>
              <Badge variant="secondary">{t.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
            <div className="mt-4 flex-1" />
            <Button
              className="mt-4"
              variant={activeSlug === t.templateId ? "default" : "outline"}
              onClick={() => {
                setActiveSlug(t.templateId);
                setAccent(null);
              }}
            >
              {activeSlug === t.templateId ? "Previewing" : "Preview"}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(selectedPreset)} onOpenChange={(open) => (open ? null : setActiveSlug(null))}>
        <DialogContent className="max-w-[min(1200px,96vw)] p-0">
          {selectedPreset ? (
            <>
              <DialogHeader className="border-b border-border px-5 py-4">
                <DialogTitle className="text-sm font-semibold">
                  {selectedPreset.name} preview
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Sample details only — customer sites use their own business info, services and
                  colours.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2 px-5">
                {(Object.keys(WIDTHS) as DeviceKey[]).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={device === key ? "default" : "outline"}
                    onClick={() => setDevice(key)}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Button>
                ))}
                <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  Accent
                  <input
                    type="color"
                    value={accent ?? selectedPreset.accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                  />
                </label>
              </div>

              <div className="m-5 mt-3 overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
                <PreviewFrame width={WIDTHS[device]} height={820}>
                  <LocalBusinessTemplate
                    business={previewData.business}
                    content={content}
                    services={previewData.services}
                    areas={previewData.areas}
                    hours={previewData.hours}
                    reviews={previewData.reviews}
                    previewOnly
                  />
                </PreviewFrame>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
