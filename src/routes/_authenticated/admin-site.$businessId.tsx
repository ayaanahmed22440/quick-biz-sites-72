import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PreviewFrame } from "@/components/app/PreviewFrame";
import {
  LocalBusinessTemplate,
  type TemplateArea,
  type TemplateHour,
  type TemplateService,
} from "@/components/templates/LocalBusinessTemplate";
import {
  defaultSiteContent,
  normaliseContent,
  templateIdForNiche,
  type SiteContent,
} from "@/lib/site-content";

export const Route = createFileRoute("/_authenticated/admin-site/$businessId")({
  head: () => ({
    meta: [
      { title: "Edit client website — WebWarheads" },
      { name: "description", content: "Edit a client website from the WebWarheads admin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSitePage,
});

const WIDTHS = { desktop: 1280, tablet: 820, mobile: 390 } as const;
type DeviceKey = keyof typeof WIDTHS;

function AdminSitePage() {
  const { businessId } = Route.useParams();
  const navigate = useNavigate();
  const { data: workspace, isLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const key = ["admin-site", businessId] as const;

  const site = useQuery({
    queryKey: key,
    enabled: Boolean(workspace?.isStaff),
    queryFn: async () => {
      const { data: business, error } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, niche, tagline, phone, email, city, state, address_line1, postal_code, logo_url, primary_color, primary_service",
        )
        .eq("id", businessId)
        .single();
      if (error) throw error;

      const [{ data: website }, { data: services }, { data: areas }, { data: hours }] =
        await Promise.all([
          supabase
            .from("websites")
            .select("id, status, published_at")
            .eq("business_id", businessId)
            .maybeSingle(),
          supabase
            .from("services")
            .select("id, name, description, price_note")
            .eq("business_id", businessId)
            .order("sort_order"),
          supabase.from("service_areas").select("id, city, state").eq("business_id", businessId),
          supabase
            .from("business_hours")
            .select("id, day_of_week, opens_at, closes_at, is_closed")
            .eq("business_id", businessId),
        ]);

      const fallback = defaultSiteContent({
        businessName: business.name,
        city: business.city ?? "",
        primaryService: business.primary_service ?? "",
        primaryColor: business.primary_color,
        logoUrl: business.logo_url,
        niche: business.niche,
      });

      let content: SiteContent;
      if (website) {
        const { data: custom } = await supabase
          .from("website_customizations")
          .select("draft_content")
          .eq("website_id", website.id)
          .maybeSingle();
        content = normaliseContent(custom?.draft_content, fallback);
      } else {
        content = fallback;
        content.templateId = templateIdForNiche(business.niche);
      }
        content = defaultSiteContent({
          businessName: business.name,
          city: business.city ?? "",
          primaryService: business.primary_service ?? "",
          primaryColor: business.primary_color,
          logoUrl: business.logo_url,
          niche: business.niche,
        });
        content.templateId = templateIdForNiche(business.niche);
      }

      return {
        business,
        website,
        content,
        services: (services ?? []) as TemplateService[],
        areas: (areas ?? []) as TemplateArea[],
        hours: (hours ?? []) as TemplateHour[],
      };
    },
  });

  useEffect(() => {
    if (site.data?.content && !draft) setDraft(site.data.content);
  }, [site.data, draft]);

  const save = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      const website = site.data?.website;
      if (!website || !draft) throw new Error("This client has no website yet.");
      const payload = JSON.parse(JSON.stringify(draft)) as never;
      const { error } = await supabase.from("website_customizations").upsert(
        {
          website_id: website.id,
          business_id: businessId,
          draft_content: payload,
          ...(publish ? { published_content: payload } : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "website_id" },
      );
      if (error) throw error;
      if (publish) {
        await supabase
          .from("websites")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", website.id);
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success(variables.publish ? "Saved and published" : "Changes saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save"),
  });

  const removeSite = useMutation({
    mutationFn: async () => {
      const website = site.data?.website;
      if (!website) throw new Error("No website to delete.");
      await supabase.from("website_customizations").delete().eq("website_id", website.id);
      const { error } = await supabase.from("websites").delete().eq("id", website.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Website deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      void navigate({ to: "/admin" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete that website"),
  });

  if (isLoading) return <LoadingBlock rows={4} />;
  if (!workspace?.isStaff) {
    return (
      <>
        <PageHeader title="Client website" />
        <EmptyState title="Not available" description="This area is for the WebWarheads team." />
      </>
    );
  }
  if (site.isLoading) return <LoadingBlock rows={4} />;
  if (site.isError || !site.data || !draft) return <ErrorBlock />;

  const { business, website } = site.data;
  const update = (fn: (c: SiteContent) => SiteContent) => setDraft((c) => (c ? fn(c) : c));

  return (
    <>
      <PageHeader
        title={business.name}
        description="Edit this client's website text and put it live or take it offline."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={website?.status === "published" ? "default" : "secondary"}>
          {website?.status ?? "no website"}
        </Badge>
        <a
          className="text-sm underline"
          href={`/${business.slug}`}
          target="_blank"
          rel="noreferrer"
        >
          View public page
        </a>
        <Link to="/admin" className="ml-auto text-sm underline">
          Back to admin
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Top of the page</h2>
            <div className="space-y-1">
              <Label>Headline</Label>
              <Input
                value={draft.hero.headline}
                onChange={(e) =>
                  update((c) => ({ ...c, hero: { ...c.hero, headline: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Short intro</Label>
              <Textarea
                rows={3}
                value={draft.hero.subheadline}
                onChange={(e) =>
                  update((c) => ({ ...c, hero: { ...c.hero, subheadline: e.target.value } }))
                }
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">About</h2>
            <div className="space-y-1">
              <Label>Heading</Label>
              <Input
                value={draft.about.heading}
                onChange={(e) =>
                  update((c) => ({ ...c, about: { ...c.about, heading: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Story</Label>
              <Textarea
                rows={6}
                value={draft.about.body}
                onChange={(e) =>
                  update((c) => ({ ...c, about: { ...c.about, body: e.target.value } }))
                }
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Brand colour</h2>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <input
                type="color"
                aria-label="Brand colour"
                value={draft.brand.primaryColor}
                onChange={(e) =>
                  update((c) => ({ ...c, brand: { ...c.brand, primaryColor: e.target.value } }))
                }
                className="h-10 w-14 shrink-0 cursor-pointer rounded border border-input bg-background"
              />
              <Input
                value={draft.brand.primaryColor}
                onChange={(e) =>
                  update((c) => ({ ...c, brand: { ...c.brand, primaryColor: e.target.value } }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
            <Button
              variant="outline"
              disabled={save.isPending || !website}
              onClick={() => save.mutate({ publish: false })}
            >
              Save changes
            </Button>
            <Button
              disabled={save.isPending || !website}
              onClick={() => save.mutate({ publish: true })}
            >
              Save &amp; publish
            </Button>
            <Button
              variant="destructive"
              className="ml-auto"
              disabled={removeSite.isPending || !website}
              onClick={() => {
                if (window.confirm(`Delete the website for ${business.name}? This cannot be undone.`)) {
                  removeSite.mutate();
                }
              }}
            >
              Delete website
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Preview</p>
            <div className="ml-auto flex gap-1.5">
              {(Object.keys(WIDTHS) as DeviceKey[]).map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={device === k ? "default" : "outline"}
                  onClick={() => setDevice(k)}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
            <PreviewFrame width={WIDTHS[device]} height={880}>
              <LocalBusinessTemplate
                business={business}
                content={draft}
                services={site.data.services}
                areas={site.data.areas}
                hours={site.data.hours}
                previewOnly
              />
            </PreviewFrame>
          </div>
        </div>
      </div>
    </>
  );
}
