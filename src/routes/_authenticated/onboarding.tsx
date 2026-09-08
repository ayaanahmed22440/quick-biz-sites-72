import { useState } from "react";
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

const step1 = z.object({
  name: z.string().trim().min(2, "Enter your business name").max(120),
  primary_service: z.string().trim().min(2, "What is your main service?").max(120),
  description: z.string().trim().max(600).optional(),
});
const step2 = z.object({
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
  name: string;
  primary_service: string;
  description: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  services: string;
  areas: string;
};

const EMPTY: Draft = {
  name: "",
  primary_service: "",
  description: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  services: "",
  areas: "",
};

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: workspace, isLoading } = useWorkspace();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (isLoading) return <LoadingBlock rows={4} />;

  if (workspace?.business) {
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

  function next() {
    const schema = step === 1 ? step1 : step2;
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) nextErrors[String(issue.path[0])] = issue.message;
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  }

  async function finish() {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setSaving(false);
      toast.error("Your session expired. Please log in again.");
      return;
    }

    const slug = `${slugify(draft.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: business, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        name: draft.name.trim(),
        slug,
        niche: "cleaning",
        primary_service: draft.primary_service.trim(),
        description: draft.description.trim() || null,
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        city: draft.city.trim(),
        state: draft.state.trim() || null,
        onboarding_completed: true,
      })
      .select("id")
      .single();

    if (error || !business) {
      setSaving(false);
      toast.error("We couldn't save that. Please try again.");
      return;
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
      await supabase.from("services").insert(
        services.map((name, i) => ({ business_id: business.id, name, sort_order: i })),
      );
    }

    const areas = draft.areas
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 25);
    await supabase.from("service_areas").insert(
      [
        { business_id: business.id, city: draft.city.trim(), state: draft.state.trim() || null, is_primary: true },
        ...areas.map((city) => ({
          business_id: business.id,
          city,
          state: draft.state.trim() || null,
          is_primary: false,
        })),
      ],
    );

    await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
    setSaving(false);
    toast.success("Business saved");
    void navigate({ to: "/billing" });
  }

  return (
    <>
      <PageHeader title="Set up your business" description={`Step ${step} of 3`} />

      <div className="rounded-xl border border-border bg-card p-6">
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                value={draft.name}
                maxLength={120}
                onChange={(e) => set("name", e.target.value)}
                className="mt-1.5"
              />
              {errors["name"] ? (
                <p className="mt-1 text-xs text-destructive">{errors["name"]}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="primary_service">Main service</Label>
              <Input
                id="primary_service"
                placeholder="House cleaning"
                value={draft.primary_service}
                maxLength={120}
                onChange={(e) => set("primary_service", e.target.value)}
                className="mt-1.5"
              />
              {errors["primary_service"] ? (
                <p className="mt-1 text-xs text-destructive">{errors["primary_service"]}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="description">Describe your business in a sentence or two</Label>
              <Textarea
                id="description"
                rows={3}
                maxLength={600}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={draft.phone}
                  maxLength={30}
                  onChange={(e) => set("phone", e.target.value)}
                  className="mt-1.5"
                />
                {errors["phone"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["phone"]}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="email">Business email</Label>
                <Input
                  id="email"
                  type="email"
                  value={draft.email}
                  maxLength={255}
                  onChange={(e) => set("email", e.target.value)}
                  className="mt-1.5"
                />
                {errors["email"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["email"]}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="city">Main city</Label>
                <Input
                  id="city"
                  value={draft.city}
                  maxLength={80}
                  onChange={(e) => set("city", e.target.value)}
                  className="mt-1.5"
                />
                {errors["city"] ? (
                  <p className="mt-1 text-xs text-destructive">{errors["city"]}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="state">State / region</Label>
                <Input
                  id="state"
                  value={draft.state}
                  maxLength={40}
                  onChange={(e) => set("state", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div>
              <Label htmlFor="services">Your services — one per line</Label>
              <Textarea
                id="services"
                rows={5}
                placeholder={"Regular house cleaning\nDeep cleaning\nMove-out cleaning"}
                value={draft.services}
                onChange={(e) => set("services", e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="areas">Other towns or areas you cover — separated by commas</Label>
              <Input
                id="areas"
                placeholder="Matthews, Huntersville, Concord"
                value={draft.areas}
                onChange={(e) => set("areas", e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-7 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button
              onClick={finish}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Saving…" : "Save and choose a plan"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
