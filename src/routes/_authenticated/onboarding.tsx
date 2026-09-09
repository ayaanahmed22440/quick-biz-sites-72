import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
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
import { ReviewsEditor } from "@/components/website/ReviewsEditor";
import { LocalBusinessTemplate } from "@/components/templates/LocalBusinessTemplate";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { TEMPLATE_PRESETS, presetFor, templateIdForNiche } from "@/lib/template-registry";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "ww-onboarding-draft";

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

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your business name").max(120),
  primary_service: z.string().trim().min(2, "What is your main service?").max(120),
  description: z.string().trim().max(600).optional(),
});
const contactSchema = z.object({
  phone: z.string().trim().min(6, "Enter a contact phone number").max(30),
  email: z.string().trim().email("Enter a valid email").max(255),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().max(40).optional(),
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

const STEPS = ["Your trade", "Your business", "Contact & areas", "Look & photos", "Reviews"];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: workspace, isLoading } = useWorkspace();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  // Bring back anything typed before, so a closed tab never loses the work.
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
      /* storage full or blocked — the wizard still works */
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

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function validate(schema: z.ZodTypeAny) {
    const parsed = schema.safeParse(draft);
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
    setErrors(next);
    return false;
  }

  /** Creates the business the first time it's needed, so photos have somewhere to live. */
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
    const { data: business, error } = await supabase
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

    if (error || !business) {
      setSaving(false);
      toast.error("We couldn't save that. Please try again.");
      return null;
    }

    await supabase
      .from("business_members")
      .insert({ business_id: business.id, user_id: userId, role: "owner" });

    const services = draft.services
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (services.length) {
      await supabase
        .from("services")
        .insert(services.map((name, i) => ({ business_id: business.id, name, sort_order: i })));
    }

    const areas = draft.areas
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 25);
    await supabase.from("service_areas").insert([
      {
        business_id: business.id,
        city: draft.city.trim(),
        state: draft.state.trim() || null,
        is_primary: true,
      },
      ...areas.map((city) => ({
        business_id: business.id,
        city,
        state: draft.state.trim() || null,
        is_primary: false,
      })),
    ]);

    setBusinessId(business.id);
    setSaving(false);
    await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
    return business.id;
  }

  async function next() {
    if (step === 1 && !validate(detailsSchema)) return;
    if (step === 2) {
      if (!validate(contactSchema)) return;
      const id = await ensureBusiness();
      if (!id) return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
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

  return (
    <>
      <PageHeader
        title="Set up your website"
        description="Five short steps. Everything you type shows up on the right straight away — and it's all free until you publish."
      />

      <ol className="mb-6 flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5",
              index === step
                ? "border-primary bg-primary/10 font-medium text-foreground"
                : index < step
                  ? "border-border text-muted-foreground"
                  : "border-border/60 text-muted-foreground/70",
            )}
          >
            {index < step ? <Check className="h-3 w-3" /> : <span>{index + 1}.</span>}
            {label}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border bg-card p-6">
          {step === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pick your trade. Each one has its own approved design with professional photos
                already in place — you can swap any of them later.
              </p>
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
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-dashed border-border p-4">
                <p className="text-sm font-medium">Just having a look?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fill everything with an example business so you can see a finished site. Change
                  anything before you save.
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
              <FieldRow label="Business name" error={errors["name"]}>
                <Input
                  value={draft.name}
                  maxLength={120}
                  onChange={(e) => set("name", e.target.value)}
                />
              </FieldRow>
              <FieldRow label="Main service" error={errors["primary_service"]}>
                <Input
                  placeholder={presetFor(draft.niche).copy.service}
                  value={draft.primary_service}
                  maxLength={120}
                  onChange={(e) => set("primary_service", e.target.value)}
                />
              </FieldRow>
              <FieldRow label="Describe your business in a sentence or two">
                <Textarea
                  rows={3}
                  maxLength={600}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </FieldRow>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FieldRow label="Phone" error={errors["phone"]}>
                  <Input
                    value={draft.phone}
                    maxLength={30}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </FieldRow>
                <FieldRow label="Business email" error={errors["email"]}>
                  <Input
                    type="email"
                    value={draft.email}
                    maxLength={255}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </FieldRow>
                <FieldRow label="Main city" error={errors["city"]}>
                  <Input
                    value={draft.city}
                    maxLength={80}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </FieldRow>
                <FieldRow label="State / region">
                  <Input
                    value={draft.state}
                    maxLength={40}
                    onChange={(e) => set("state", e.target.value)}
                  />
                </FieldRow>
              </div>
              <FieldRow label="Your services — one per line">
                <Textarea
                  rows={5}
                  placeholder={"Regular house cleaning\nDeep cleaning\nMove-out cleaning"}
                  value={draft.services}
                  onChange={(e) => set("services", e.target.value)}
                />
              </FieldRow>
              <FieldRow label="Other towns you cover — separated by commas">
                <Input
                  placeholder="Matthews, Huntersville, Concord"
                  value={draft.areas}
                  onChange={(e) => set("areas", e.target.value)}
                />
              </FieldRow>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <Label>Your main colour</Label>
                <div className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
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
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Buttons, links and the contact band use this colour.
                </p>
              </div>
              {businessId ? (
                <ImageUpload
                  businessId={businessId}
                  label="Your logo"
                  hint="A PNG with a see-through background looks best. Skip it if you don't have one — we'll use your business name."
                  aspect="square"
                  kind="logo"
                  value={draft.logo_url}
                  onChange={(url) => set("logo_url", url)}
                />
              ) : null}
              <p className="text-xs text-muted-foreground">
                Your design already includes professional photos for your trade. You can upload your
                own work photos on the next screen, once your site is open.
              </p>
            </div>
          ) : null}

          {step === 4 && businessId ? (
            <ReviewsEditor
              businessId={businessId}
              googleUrl={draft.google_url}
              onGoogleUrlChange={(v) => set("google_url", v)}
            />
          ) : null}

          <div className="mt-7 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => void next()} disabled={saving}>
                {saving ? "Saving…" : "Continue"}
              </Button>
            ) : (
              <Button
                onClick={() => void finish()}
                disabled={saving}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {saving ? "Saving…" : "See my website"}
              </Button>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <p className="mb-2 text-sm font-medium">Live preview</p>
          <div className="overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
            <div className="mx-auto max-h-[70vh] overflow-y-auto rounded-md bg-white shadow-sm">
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
                  primary_color: draft.primary_color,
                  primary_service: draft.primary_service || null,
                  slug: "preview",
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
            </div>
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

function FieldRow({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
