import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleaningTemplate01 } from "@/components/templates/CleaningTemplate01";
import { defaultSiteContent } from "@/lib/site-content";

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

const SAMPLE_BUSINESS = {
  name: "Sparkle & Shine Cleaning Co.",
  tagline: "Spotless homes, happy customers",
  phone: "(555) 014-8822",
  email: "hello@sparkleandshine.com",
  city: "Austin",
  state: "TX",
  address_line1: "1200 Barton Springs Rd",
  postal_code: "78704",
  logo_url: null,
};

const SAMPLE_SERVICES = [
  {
    id: "s1",
    name: "Regular home cleaning",
    description: "Weekly or fortnightly clean of every room, top to bottom.",
    price_note: "From $95 per visit",
  },
  {
    id: "s2",
    name: "Deep clean",
    description: "Skirting boards, ovens, inside cupboards — the full reset.",
    price_note: "From $220",
  },
  {
    id: "s3",
    name: "End of tenancy",
    description: "Landlord-ready cleaning with a checklist you can hand over.",
    price_note: "Quoted per property",
  },
  {
    id: "s4",
    name: "Office cleaning",
    description: "Evening and weekend cleans for small offices and studios.",
    price_note: "Monthly contracts",
  },
];

const SAMPLE_AREAS = [
  { id: "a1", city: "Austin", state: "TX" },
  { id: "a2", city: "Round Rock", state: "TX" },
  { id: "a3", city: "Cedar Park", state: "TX" },
  { id: "a4", city: "Pflugerville", state: "TX" },
];

const SAMPLE_HOURS = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day_of_week: day,
  opens_at: day === 0 ? null : "08:00",
  closes_at: day === 0 ? null : day === 6 ? "14:00" : "18:00",
  is_closed: day === 0,
}));

const WIDTHS = {
  desktop: "100%",
  tablet: "820px",
  mobile: "390px",
} as const;

type DeviceKey = keyof typeof WIDTHS;

const RENDERABLE: Record<string, true> = { "cleaning-01": true };

function AdminTemplatesPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [accent, setAccent] = useState("#1f6feb");

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

  const content = useMemo(
    () =>
      defaultSiteContent({
        businessName: SAMPLE_BUSINESS.name,
        city: SAMPLE_BUSINESS.city,
        primaryService: "cleaning",
        primaryColor: accent,
      }),
    [accent],
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

  const list = templates.data ?? [];
  const selected = list.find((t) => t.slug === activeSlug) ?? null;

  return (
    <>
      <PageHeader
        title="Website templates"
        description="Preview every template exactly as a customer's live site would look, using sample business details."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No templates have been added yet.
          </div>
        ) : (
          list.map((t) => {
            const canPreview = Boolean(RENDERABLE[t.slug]);
            return (
              <div key={t.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">{t.name}</h2>
                    <p className="text-xs text-muted-foreground">{t.niche}</p>
                  </div>
                  <Badge variant="secondary">{t.status}</Badge>
                </div>
                {t.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
                ) : null}
                <div className="mt-4 flex-1" />
                <Button
                  className="mt-4"
                  variant={activeSlug === t.slug ? "default" : "outline"}
                  disabled={!canPreview}
                  onClick={() => setActiveSlug(t.slug)}
                >
                  {canPreview
                    ? activeSlug === t.slug
                      ? "Previewing"
                      : "Preview"
                    : "Preview coming soon"}
                </Button>
              </div>
            );
          })
        )}
      </div>

      {selected && RENDERABLE[selected.slug] ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold">{selected.name} preview</h2>
            <div className="ml-auto flex items-center gap-2">
              {(Object.keys(WIDTHS) as DeviceKey[]).map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={device === key ? "default" : "outline"}
                  onClick={() => setDevice(key)}
                >
                  {key[0].toUpperCase() + key.slice(1)}
                </Button>
              ))}
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Accent
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
            <div
              className="mx-auto max-h-[75vh] overflow-y-auto rounded-md bg-white shadow-sm"
              style={{ width: WIDTHS[device], maxWidth: "100%" }}
            >
              <CleaningTemplate01
                business={SAMPLE_BUSINESS}
                content={content}
                services={SAMPLE_SERVICES}
                areas={SAMPLE_AREAS}
                hours={SAMPLE_HOURS}
                previewOnly
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Sample details only — customer sites use their own business info, services and colours.
          </p>
        </div>
      ) : null}
    </>
  );
}
