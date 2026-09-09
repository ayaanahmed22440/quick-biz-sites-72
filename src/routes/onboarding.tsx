import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";

import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Check, Eye, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, workspaceQueryKey } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ImageUpload } from "@/components/app/ImageUpload";
import { BrowserPreview } from "@/components/app/BrowserPreview";
import { ReviewsEditor } from "@/components/website/ReviewsEditor";
import { LocalBusinessTemplate } from "@/components/templates/LocalBusinessTemplate";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { TEMPLATE_PRESETS, presetFor, templateIdForNiche } from "@/lib/template-registry";
import { PLAN_COPY, yearlyPrice } from "@/lib/plans";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "ww-onboarding-draft";
const PLAN_KEY = "ww-onboarding-plan";

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
  plan: string;
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
  plan: "seo",
};

const DEMO: Omit<Draft, "niche" | "plan"> = {
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

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Set up your website — WebWarheads" },
      { name: "description", content: "Answer a few questions and watch your website build itself." },
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

type StageKey = "trade" | "business" | "services" | "look" | "reviews" | "plan";

const STAGES: { key: StageKey; label: string }[] = [
  { key: "trade", label: "Trade" },
  { key: "business", label: "Business" },
  { key: "services", label: "Services" },
  { key: "look", label: "Look" },
  { key: "reviews", label: "Reviews" },
  { key: "plan", label: "Plan" },
];

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
  | "reviews"
  | "plan";

type Step = {
  key: StepKey;
  stage: StageKey;
  question: string;
  helper: string;
  validate?: (draft: Draft) => string | null;
  createsBusiness?: boolean;
};

const STEPS: Step[] = [
  {
    key: "niche",
    stage: "trade",
    question: "What kind of work do you do?",
    helper: "Each trade has its own approved design, with professional photos already in place.",
  },
  {
    key: "name",
    stage: "business",
    question: "What's your business called?",
    helper: "This is the name customers will see at the top of your website.",
    validate: (d) =>
      z.string().trim().min(2).max(120).safeParse(d.name).success
        ? null
        : "Enter your business name",
  },
  {
    key: "primary_service",
    stage: "business",
    question: "What's the main job you get hired for?",
    helper: "Just the one you do most. You can add the rest in a moment.",
    validate: (d) =>
      z.string().trim().min(2).max(120).safeParse(d.primary_service).success
        ? null
        : "Tell us your main service",
  },
  {
    key: "description",
    stage: "business",
    question: "In a sentence or two, why should someone pick you?",
    helper: "Skip it if you're not sure — we'll write something sensible for you.",
  },
  {
    key: "phone",
    stage: "business",
    question: "What number should customers call?",
    helper: "It shows on every page and on the call button.",
    validate: (d) =>
      d.phone.trim().length >= 6 ? null : "Enter a phone number customers can call",
  },
  {
    key: "email",
    stage: "business",
    question: "Where should enquiries land?",
    helper: "We send every website enquiry straight to this inbox.",
    validate: (d) =>
      z.string().email().safeParse(d.email.trim()).success ? null : "Enter a valid email",
  },
  {
    key: "city",
    stage: "business",
    question: "Which town or city are you based in?",
    helper: "This is what tells Google where you work.",
    validate: (d) => (d.city.trim().length >= 2 ? null : "Enter your main city"),
    createsBusiness: true,
  },
  {
    key: "services",
    stage: "services",
    question: "What jobs do you take on?",
    helper: "One per line. Four or five is plenty to start with.",
  },
  {
    key: "areas",
    stage: "services",
    question: "Which other towns do you cover?",
    helper: "Separate them with commas. Leave it empty if you only work in one place.",
  },
  {
    key: "primary_color",
    stage: "look",
    question: "Pick your main colour",
    helper: "Buttons, links and the contact band use it. Match your van or your logo.",
  },
  {
    key: "logo",
    stage: "look",
    question: "Got a logo?",
    helper: "A see-through PNG looks best. No logo? We'll use your business name instead.",
  },
  {
    key: "reviews",
    stage: "reviews",
    question: "Add a few happy customers",
    helper: "Reviews are the single biggest reason people call. Add them now or later.",
  },
  {
    key: "plan",
    stage: "plan",
    question: "Which plan suits you?",
    helper: "Nothing is charged now — you only pay when you're ready to go live.",
  },
];

const SWATCHES = ["#1f6feb", "#0f766e", "#b91c1c", "#d97706", "#7c3aed", "#0f172a"];

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

  const step = STEPS[index]!;
  const preview = useMemo(() => previewContent(draft), [draft]);
  const stageIndex = STAGES.findIndex((s) => s.key === step.stage);
  const isLast = index === STEPS.length - 1;
  const address = `webwarheads.com/${draft.name ? slugify(draft.name) : "your-business"}`;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (workspace?.business && !businessId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold">Your business is already set up</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You can change any of these details whenever you like.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/website" })}>
            Go to my website
          </Button>
        </div>
      </div>
    );
  }

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
    if (isLast) {
      await finish({ checkout: true });
      return;
    }
    setIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }

  async function finish({ checkout }: { checkout: boolean }) {
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
      localStorage.setItem(PLAN_KEY, draft.plan);
    } catch {
      /* ignore */
    }
    await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });

    if (checkout && draft.plan) {
      try {
        const result = await startCheckoutFn({
          data: { planId: draft.plan, returnPath: "/website", businessId: id },
        });
        window.location.href = result.url;
        return;
      } catch (checkoutError) {
        setSaving(false);
        toast.error(
          checkoutError instanceof Error
            ? checkoutError.message
            : "We couldn't open checkout. Your website is saved — you can pay from the editor.",
        );
        void navigate({ to: "/website" });
        return;
      }
    }

    setSaving(false);
    toast.success("Your website is ready to look at");
    void navigate({ to: "/website" });
  }


  const previewNode = (
    <BrowserPreview address={address}>
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
          .map((name, i) => ({ id: String(i), name, description: null, price_note: null }))}
        areas={[draft.city, ...draft.areas.split(",")]
          .map((s) => s.trim())
          .filter(Boolean)
          .map((city, i) => ({ id: String(i), city, state: draft.state || null }))}
        hours={[]}
        previewOnly
      />
    </BrowserPreview>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Progress rail */}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>

          <ol className="flex flex-1 items-center gap-1.5 sm:gap-3">
            {STAGES.map((stage, i) => {
              const done = i < stageIndex;
              const active = i === stageIndex;
              return (
                <li key={stage.key} className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors duration-500",
                      done || active ? "bg-accent" : "bg-muted",
                    )}
                  />
                  <span
                    className={cn(
                      "hidden shrink-0 text-xs font-medium sm:inline",
                      active
                        ? "text-foreground"
                        : done
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60",
                    )}
                  >
                    {stage.label}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Eye className="h-4 w-4" />
                  See my site
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-4">
                {previewNode}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:py-16",
          step.key === "plan"
            ? "lg:grid-cols-1"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]",
        )}
      >
        {/* Question column */}
        <div className={cn("mx-auto w-full", step.key === "plan" ? "max-w-5xl" : "max-w-xl")}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Step {index + 1} of {STEPS.length}
          </p>

          <div
            key={step.key}
            className="animate-in fade-in slide-in-from-bottom-3 duration-300"
            onKeyDown={(e) => {
              const target = e.target as HTMLElement;
              if (e.key === "Enter" && target.tagName !== "TEXTAREA" && !saving) {
                e.preventDefault();
                void next();
              }
            }}
          >
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {step.question}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">{step.helper}</p>

            <div className="mt-8 space-y-5">
              {step.key === "niche" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {TEMPLATE_PRESETS.map((p) => (
                    <button
                      key={p.templateId}
                      type="button"
                      onClick={() => set("niche", p.niche)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border text-left transition-all",
                        draft.niche === p.niche
                          ? "border-accent ring-2 ring-accent/30"
                          : "border-border hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md",
                      )}
                    >
                      <img
                        src={p.images.hero}
                        alt={`${p.industryLabel} website design`}
                        className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                      {draft.niche === p.niche ? (
                        <span className="absolute right-3 top-3 rounded-full bg-accent p-1 text-accent-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                      <span className="block p-4">
                        <span className="block text-sm font-semibold">{p.industryLabel}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
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
                    className="h-14 text-lg"
                    value={draft.name}
                    maxLength={120}
                    placeholder="e.g. Sparkle & Shine Cleaning Co."
                    onChange={(e) => set("name", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...DEMO, niche: d.niche, plan: d.plan }))}
                    className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border p-4 text-left transition-colors hover:border-accent/60 hover:bg-accent/5"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                    <span>
                      <span className="block text-sm font-medium">Just having a look?</span>
                      <span className="block text-xs text-muted-foreground">
                        Fill everything with an example business and see a finished site.
                      </span>
                    </span>
                  </button>
                </>
              ) : null}

              {step.key === "primary_service" ? (
                <Input
                  autoFocus
                  className="h-14 text-lg"
                  value={draft.primary_service}
                  maxLength={120}
                  placeholder={presetFor(draft.niche).copy.service}
                  onChange={(e) => set("primary_service", e.target.value)}
                />
              ) : null}

              {step.key === "description" ? (
                <Textarea
                  autoFocus
                  rows={5}
                  maxLength={600}
                  className="text-base"
                  value={draft.description}
                  placeholder="Family-run, same team every visit, satisfaction guaranteed…"
                  onChange={(e) => set("description", e.target.value)}
                />
              ) : null}

              {step.key === "phone" ? (
                <Input
                  autoFocus
                  className="h-14 text-lg"
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
                  className="h-14 text-lg"
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
                      className="mt-1.5 h-12"
                      value={draft.city}
                      maxLength={80}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>State / region</Label>
                    <Input
                      className="mt-1.5 h-12"
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
                  className="text-base"
                  value={draft.services}
                  placeholder={"Regular house cleaning\nDeep cleaning\nMove-out cleaning"}
                  onChange={(e) => set("services", e.target.value)}
                />
              ) : null}

              {step.key === "areas" ? (
                <Input
                  autoFocus
                  className="h-14 text-lg"
                  value={draft.areas}
                  placeholder="Matthews, Huntersville, Concord"
                  onChange={(e) => set("areas", e.target.value)}
                />
              ) : null}

              {step.key === "primary_color" ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {SWATCHES.map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        aria-label={`Use ${colour}`}
                        onClick={() => set("primary_color", colour)}
                        className={cn(
                          "h-11 w-11 rounded-full border-2 transition-transform hover:scale-105",
                          draft.primary_color.toLowerCase() === colour
                            ? "border-foreground"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: colour }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                    <input
                      type="color"
                      aria-label="Main colour"
                      value={draft.primary_color}
                      onChange={(e) => set("primary_color", e.target.value)}
                      className="h-11 w-14 shrink-0 cursor-pointer rounded border border-input bg-background"
                    />
                    <Input
                      className="h-11"
                      value={draft.primary_color}
                      onChange={(e) => set("primary_color", e.target.value)}
                    />
                  </div>
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

              {step.key === "plan" ? (
                <PlanPicker value={draft.plan} onChange={(plan) => set("plan", plan)} />
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="mt-10 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0 || saving}
              >
                Back
              </Button>
              <Button
                size="lg"
                onClick={() => void next()}
                disabled={saving}
                className={isLast ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : isLast ? (
                  "See my website"
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview column (hidden on the plan step, which uses the full width) */}
        <div className={step.key === "plan" ? "hidden" : "hidden lg:block"}>
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Live preview
            </p>
            {previewNode}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Plan selection. The chosen plan is taken to checkout when the step is confirmed. */
function PlanPicker({ value, onChange }: { value: string; onChange: (plan: string) => void }) {
  const [period, setPeriod] = useState<"monthly" | "yearly">(
    value.endsWith("_yearly") ? "yearly" : "monthly",
  );
  const baseId = value.replace(/_yearly$/, "");

  function pick(nextPeriod: "monthly" | "yearly", base: string) {
    setPeriod(nextPeriod);
    onChange(nextPeriod === "yearly" ? `${base}_yearly` : base);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(["monthly", "yearly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pick(p, baseId)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                period === p ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {p === "yearly" ? "Yearly — 2 months free" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 pt-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_COPY.map((plan) => {
          const selected = baseId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => pick(period, plan.id)}
              className={cn(
                "relative flex w-full min-w-0 flex-col rounded-2xl border bg-card p-5 text-left transition-all sm:p-6",
                selected
                  ? "border-accent shadow-lg ring-2 ring-accent/30"
                  : "border-border hover:border-accent/50 hover:shadow-md",
              )}
            >
              {plan.recommended ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
                  Most popular
                </span>
              ) : null}
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-base font-semibold">{plan.name}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-accent bg-accent text-accent-foreground" : "border-border",
                  )}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
              </span>
              <span className="mt-3 block text-3xl font-bold tracking-tight">
                ${period === "yearly" ? yearlyPrice(plan.price) : plan.price}
                <span className="text-sm font-normal text-muted-foreground">
                  {period === "yearly" ? "/year" : "/month"}
                </span>
              </span>
              <span className="mt-5 block space-y-2 border-t border-border pt-4">
                {plan.features.slice(0, 4).map((f) => (
                  <span key={f} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure payment by Whop. Cancel any time — or skip and pay later when you publish.
      </p>
    </div>
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
