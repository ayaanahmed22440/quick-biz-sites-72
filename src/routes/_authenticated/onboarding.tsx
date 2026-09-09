import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, workspaceQueryKey } from "@/hooks/useWorkspace";
import { LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/app/ImageUpload";
import { PreviewFrame } from "@/components/app/PreviewFrame";
import { ReviewsEditor } from "@/components/website/ReviewsEditor";
import { LocalBusinessTemplate } from "@/components/templates/LocalBusinessTemplate";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { TEMPLATE_PRESETS, presetFor, templateIdForNiche } from "@/lib/template-registry";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "ww-onboarding-draft";

type Draft = {
  niche: string;
  name: string;
  primary_service: string;
  description: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  services: string;
  areas: string;
  primary_color: string;
  logo_url: string | null;
  google_url: string;
};

const EMPTY: Draft = {
  niche: "cleaning",
  name: "",
  primary_service: "",
  description: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  services: "",
  areas: "",
  primary_color: "#1f6feb",
  logo_url: null,
  google_url: "",
};

const DEMO: Omit<Draft, "niche"> = {
  name: "Sparkle & Shine Cleaning Co.",
  primary_service: "House cleaning",
  description:
    "A family-run cleaning team looking after homes and small offices, with the same cleaner every visit and a satisfaction guarantee.",
  phone: "(704) 555-0142",
  email: "hello@sparkleandshine.example",
  city: "Charlotte",
  state: "NC",
  services: "Regular house cleaning\nDeep cleaning\nMove-in / move-out cleaning\nOffice cleaning",
  areas: "Matthews, Huntersville, Concord, Pineville",
  primary_color: "#1f6feb",
  logo_url: null,
  google_url: "",
};

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your business — WebWarheads" },
      { name: "description", content: "Tell WebWarheads about your business." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "business"
  );
}

/** One question per screen. `key` drives validation and the field shown. */
type StepKey =
  | "niche"
  | "name"
  | "primary_service"
  | "description"
  | "phone"
  | "email"
  | "city"
  | "services"
  | "areas"
  | "primary_color"
  | "logo"
  | "reviews";

type Step = {
  key: StepKey;
  question: string;
  helper: string;
  /** Validated before moving on. Undefined means the step is optional. */
  validate?: (draft: Draft) => string | null;
  /** The business record is created once this step is answered. */
  createsBusiness?: boolean;
};

const STEPS: Step[] = [
  {
    key: "niche",
    question: "What kind of work do you do?",
    helper: "Each trade has its own approved design, with professional photos already in place.",
  },
  {
    key: "name",
    question: "What's your business called?",
    helper: "This is the name customers will see at the top of your website.",
    validate: (d) =>
      z.string().trim().min(2).max(120).safeParse(d.name).success
        ? null
        : "Enter your business name",
  },
  {
    key: "primary_service",
    question: "What's the main job you get hired for?",
    helper: "Just the one you do most. You can add the rest in a moment.",
    validate: (d) =>
      z.string().trim().min(2).max(120).safeParse(d.primary_service).success
        ? null
        : "Tell us your main service",
  },
  {
    key: "description",
    question: "In a sentence or two, why should someone pick you?",
    helper: "Skip it if you're not sure — we'll write something sensible for you.",
  },
  {
    key: "phone",
    question: "What number should customers call?",
    helper: "It shows on every page and on the call button.",
    validate: (d) =>
      d.phone.trim().length >= 6 ? null : "Enter a phone number customers can call",
  },
  {
    key: "email",
    question: "Where should enquiries land?",
    helper: "We send every website enquiry straight to this inbox.",
    validate: (d) => (z.string().email().safeParse(d.email.trim()).success ? null : "Enter a valid email"),
  },
  {
    key: "city",
    question: "Which town or city are you based in?",
    helper: "This is what tells Google where you work.",
    validate: (d) => (d.city.trim().length >= 2 ? null : "Enter your main city"),
    createsBusiness: true,
  },
  {
    key: "services",
    question: "What jobs do you take on?",
    helper: "One per line. Four or five is plenty to start with.",
  },
  {
    key: "areas",
    question: "Which other towns do you cover?",
    helper: "Separate them with commas. Leave it empty if you only work in one place.",
  },
  {
    key: "primary_color",
    question: "Pick your main colour",
    helper: "Buttons, links and the contact band use it. Match your van or your logo.",
  },
  {
    key: "logo",
    question: "Got a logo?",
    helper: "A see-through PNG looks best. No logo? We'll use your business name instead.",
  },
  {
    key: "reviews",
    question: "Add a few happy customers",
    helper: "Reviews are the single biggest reason people call. Add them now or later.",
  },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: workspace, isLoading } = useWorkspace();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) setDraft({ ...EMPTY, ...(JSON.parse(stored) as Partial<Draft>) });
    } catch {
      /* ignore unreadable drafts */
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage blocked — the wizard still works */
    }
  }, [draft, restored]);

  if (isLoading) return <LoadingBlock rows={4} />;

  if (workspace?.business && !businessId) {
    return (
      <>
        <PageHeader
          title="Business already set up"
          description="You can change any of these details from the Business page."
        />
        <Button onClick={() => navigate({ to: "/business" })}>Go to business details</Button>
      </>
    );
  }

  const step = STEPS[index]!;
  const progress = Math.round(((index + 1) / STEPS.length) * 100);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  }

  async function ensureBusiness(): Promise<string | null> {
    if (businessId) return businessId;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setSaving(false);
      toast.error("Your session expired. Please log in again.");
      return null;
    }

    const slug = `${slugify(draft.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: business, error: insertError } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        name: draft.name.trim(),
        slug,
        niche: draft.niche,
        primary_service: draft.primary_service.trim(),
        description: draft.description.trim() || null,
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        city: draft.city.trim(),
        state: draft.state.trim() || null,
        primary_color: draft.primary_color,
        onboarding_completed: false,
      })
      .select("id")
      .single();

    if (insertError || !business) {
      setSaving(false);
      toast.error("We couldn't save that. Please try again.");
      return null;
    }

    await supabase
      .from("business_members")
      .insert({ business_id: business.id, user_id: userId, role: "owner" });

    await supabase.from("service_areas").insert({
      business_id: business.id,
      city: draft.city.trim(),
      state: draft.state.trim() || null,
      is_primary: true,
    });

    setBusinessId(business.id);
    setSaving(false);
    await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
    return business.id;
  }

  /** Saves the answers that belong to a step once the business exists. */
  async function persistStep(key: StepKey, id: string) {
    if (key === "services") {
      const services = draft.services
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      await supabase.from("services").delete().eq("business_id", id);
      if (services.length) {
        await supabase
          .from("services")
          .insert(services.map((name, i) => ({ business_id: id, name, sort_order: i })));
      }
    }
    if (key === "areas") {
      const areas = draft.areas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 25);
      await supabase.from("service_areas").delete().eq("business_id", id).eq("is_primary", false);
      if (areas.length) {
        await supabase.from("service_areas").insert(
          areas.map((city) => ({
            business_id: id,
            city,
            state: draft.state.trim() || null,
            is_primary: false,
          })),
        );
      }
    }
  }

  async function next() {
    const message = step.validate?.(draft) ?? null;
    if (message) {
      setError(message);
      return;
    }
    if (step.createsBusiness) {
      const id = await ensureBusiness();
      if (!id) return;
    }
    if (businessId) await persistStep(step.key, businessId);
    if (index === STEPS.length - 1) {
      await finish();
      return;
    }
    setIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  async function finish() {
    const id = businessId ?? (await ensureBusiness());
    if (!id) return;
    setSaving(true);

    await supabase
      .from("businesses")
      .update({
        primary_color: draft.primary_color,
        logo_url: draft.logo_url,
        onboarding_completed: true,
      })
      .eq("id", id);

    const preset = presetFor(draft.niche);
    const content = previewContent(draft);
    const { data: template } = await supabase
      .from("templates")
      .select("id")
      .eq("slug", preset.templateId)
      .maybeSingle();

    let { data: website } = await supabase
      .from("websites")
      .select("id")
      .eq("business_id", id)
      .maybeSingle();

    if (!website) {
      const { data: created } = await supabase
        .from("websites")
        .insert({ business_id: id, template_id: template?.id ?? null })
        .select("id")
        .single();
      website = created ?? null;
    }

    if (website) {
      await supabase.from("website_customizations").upsert(
        {
          website_id: website.id,
          business_id: id,
          draft_content: JSON.parse(JSON.stringify(content)) as never,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "website_id" },
      );
    }

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
    setSaving(false);
    toast.success("Your website is ready to look at");
    void navigate({ to: "/website" });
  }

  const preview = previewContent(draft);
  const isLast = index === STEPS.length - 1;

  return (
    <>
      <PageHeader
        title="Let's build your website"
        description="One question at a time. Everything you answer appears on the right straight away — and it stays free until you publish."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div>
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Question {index + 1} of {STEPS.length}
              </span>
              <span>{progress}% done</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div
            key={step.key}
            className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border bg-card p-6 duration-300"
            onKeyDown={(e) => {
              const target = e.target as HTMLElement;
              if (e.key === "Enter" && target.tagName !== "TEXTAREA" && !saving) {
                e.preventDefault();
                void next();
              }
            }}
          >
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{step.question}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.helper}</p>

            <div className="mt-5 space-y-4">
              {step.key === "niche" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {TEMPLATE_PRESETS.map((p) => (
                    <button
                      key={p.templateId}
                      type="button"
                      onClick={() => set("niche", p.niche)}
                      className={cn(
                        "overflow-hidden rounded-lg border text-left transition",
                        draft.niche === p.niche
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <img
                        src={p.images.hero}
                        alt={`${p.industryLabel} website design`}
                        className="h-24 w-full object-cover"
                        loading="lazy"
                      />
                      <span className="block p-3">
                        <span className="block text-sm font-medium">{p.industryLabel}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {p.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {step.key === "name" ? (
                <>
                  <Input
                    autoFocus
                    value={draft.name}
                    maxLength={120}
                    placeholder="e.g. Sparkle & Shine Cleaning Co."
                    onChange={(e) => set("name", e.target.value)}
                  />
                  <div className="rounded-lg border border-dashed border-border p-4">
                    <p className="text-sm font-medium">Just having a look?</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Fill everything with an example business so you can see a finished site.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setDraft((d) => ({ ...DEMO, niche: d.niche }))}
                    >
                      Use example details
                    </Button>
                  </div>
                </>
              ) : null}

              {step.key === "primary_service" ? (
                <Input
                  autoFocus
                  value={draft.primary_service}
                  maxLength={120}
                  placeholder={presetFor(draft.niche).copy.service}
                  onChange={(e) => set("primary_service", e.target.value)}
                />
              ) : null}

              {step.key === "description" ? (
                <Textarea
                  autoFocus
                  rows={4}
                  maxLength={600}
                  value={draft.description}
                  placeholder="Family-run, same team every visit, satisfaction guaranteed…"
                  onChange={(e) => set("description", e.target.value)}
                />
              ) : null}

              {step.key === "phone" ? (
                <Input
                  autoFocus
                  value={draft.phone}
                  maxLength={30}
                  placeholder="(704) 555-0142"
                  onChange={(e) => set("phone", e.target.value)}
                />
              ) : null}

              {step.key === "email" ? (
                <Input
                  autoFocus
                  type="email"
                  value={draft.email}
                  maxLength={255}
                  placeholder="you@yourbusiness.com"
                  onChange={(e) => set("email", e.target.value)}
                />
              ) : null}

              {step.key === "city" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>City or town</Label>
                    <Input
                      autoFocus
                      className="mt-1.5"
                      value={draft.city}
                      maxLength={80}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>State / region</Label>
                    <Input
                      className="mt-1.5"
                      value={draft.state}
                      maxLength={40}
                      onChange={(e) => set("state", e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {step.key === "services" ? (
                <Textarea
                  autoFocus
                  rows={6}
                  value={draft.services}
                  placeholder={"Regular house cleaning\nDeep cleaning\nMove-out cleaning"}
                  onChange={(e) => set("services", e.target.value)}
                />
              ) : null}

              {step.key === "areas" ? (
                <Input
                  autoFocus
                  value={draft.areas}
                  placeholder="Matthews, Huntersville, Concord"
                  onChange={(e) => set("areas", e.target.value)}
                />
              ) : null}

              {step.key === "primary_color" ? (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                  <input
                    type="color"
                    aria-label="Main colour"
                    value={draft.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                    className="h-10 w-14 shrink-0 cursor-pointer rounded border border-input bg-background"
                  />
                  <Input
                    value={draft.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                  />
                </div>
              ) : null}

              {step.key === "logo" && businessId ? (
                <ImageUpload
                  businessId={businessId}
                  label="Your logo"
                  hint="PNG with a see-through background works best."
                  aspect="square"
                  kind="logo"
                  value={draft.logo_url}
                  onChange={(url) => set("logo_url", url)}
                />
              ) : null}

              {step.key === "reviews" && businessId ? (
                <ReviewsEditor
                  businessId={businessId}
                  googleUrl={draft.google_url}
                  onGoogleUrlChange={(v) => set("google_url", v)}
                />
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="mt-7 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0 || saving}
              >
                Back
              </Button>
              <Button
                onClick={() => void next()}
                disabled={saving}
                className={isLast ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
              >
                {saving ? "Saving…" : isLast ? "See my website" : "Continue"}
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <p className="mb-2 text-sm font-medium">Live preview</p>
          <div className="overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
            <PreviewFrame width={1280} height={860}>
              <LocalBusinessTemplate
                business={{
                  name: draft.name || "Your business name",
                  tagline: null,
                  phone: draft.phone || null,
                  email: draft.email || null,
                  city: draft.city || null,
                  state: draft.state || null,
                  address_line1: null,
                  postal_code: null,
                  logo_url: draft.logo_url,
                }}
                content={preview}
                services={draft.services
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((name, i) => ({
                    id: String(i),
                    name,
                    description: null,
                    price_note: null,
                  }))}
                areas={[draft.city, ...draft.areas.split(",")]
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((city, i) => ({ id: String(i), city, state: draft.state || null }))}
                hours={[]}
                previewOnly
              />
            </PreviewFrame>
          </div>
        </div>
      </div>
    </>
  );
}

function previewContent(draft: Draft): SiteContent {
  const content = defaultSiteContent({
    businessName: draft.name || "Your business name",
    city: draft.city,
    primaryService: draft.primary_service,
    primaryColor: draft.primary_color,
    logoUrl: draft.logo_url,
    niche: draft.niche,
  });
  content.templateId = templateIdForNiche(draft.niche);
  content.reviews.googleUrl = draft.google_url;
  if (draft.description.trim()) content.about.body = draft.description.trim();
  return content;
}
