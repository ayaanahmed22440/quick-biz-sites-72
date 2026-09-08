import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, workspaceQueryKey } from "@/hooks/useWorkspace";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/business")({
  head: () => ({
    meta: [
      { title: "Business details — WebWarheads" },
      { name: "description", content: "Manage your business information and services." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BusinessPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your business name").max(120),
  tagline: z.string().trim().max(160).optional(),
  primary_service: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(255).optional(),
  address_line1: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(40).optional(),
  postal_code: z.string().trim().max(20).optional(),
});

type Form = z.infer<typeof schema>;

function BusinessPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ["business", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const [{ data: business }, { data: services }, { data: areas }] = await Promise.all([
        supabase.from("businesses").select("*").eq("id", businessId!).single(),
        supabase.from("services").select("id, name").eq("business_id", businessId!).order("sort_order"),
        supabase.from("service_areas").select("id, city, is_primary").eq("business_id", businessId!),
      ]);
      return { business, services: services ?? [], areas: areas ?? [] };
    },
  });

  const [form, setForm] = useState<Form>({ name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const b = detail.data?.business;
    if (!b) return;
    setForm({
      name: b.name ?? "",
      tagline: b.tagline ?? "",
      primary_service: b.primary_service ?? "",
      description: b.description ?? "",
      phone: b.phone ?? "",
      email: b.email ?? "",
      address_line1: b.address_line1 ?? "",
      city: b.city ?? "",
      state: b.state ?? "",
      postal_code: b.postal_code ?? "",
    });
  }, [detail.data?.business]);

  if (isLoading) return <LoadingBlock rows={4} />;
  if (!workspace?.business) {
    return (
      <>
        <PageHeader title="Business details" />
        <EmptyState
          title="No business yet"
          description="Add your business details and we can start building your website."
          action={
            <Button asChild>
              <Link to="/onboarding">Start onboarding</Link>
            </Button>
          }
        />
      </>
    );
  }
  if (detail.isLoading) return <LoadingBlock rows={4} />;
  if (detail.isError) return <ErrorBlock />;

  function field<K extends keyof Form>(key: K) {
    return {
      value: form[key] ?? "",
      onChange: (e: { target: { value: string } }) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function save() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: parsed.data.name,
        tagline: parsed.data.tagline || null,
        primary_service: parsed.data.primary_service || null,
        description: parsed.data.description || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address_line1: parsed.data.address_line1 || null,
        city: parsed.data.city || null,
        state: parsed.data.state || null,
        postal_code: parsed.data.postal_code || null,
      })
      .eq("id", businessId!);
    setSaving(false);
    if (error) {
      toast.error("We couldn't save those changes.");
      return;
    }
    toast.success("Business details saved");
    await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
    await queryClient.invalidateQueries({ queryKey: ["business", businessId] });
  }

  const services = detail.data?.services ?? [];
  const areas = detail.data?.areas ?? [];

  return (
    <>
      <PageHeader
        title="Business details"
        description="This is the information used on your website. Keep it accurate."
        action={
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="b-name">Business name</Label>
            <Input id="b-name" maxLength={120} className="mt-1.5" {...field("name")} />
            {errors["name"] ? <p className="mt-1 text-xs text-destructive">{errors["name"]}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="b-tagline">Tagline</Label>
            <Input id="b-tagline" maxLength={160} className="mt-1.5" {...field("tagline")} />
          </div>
          <div>
            <Label htmlFor="b-service">Main service</Label>
            <Input id="b-service" maxLength={120} className="mt-1.5" {...field("primary_service")} />
          </div>
          <div>
            <Label htmlFor="b-phone">Phone</Label>
            <Input id="b-phone" maxLength={30} className="mt-1.5" {...field("phone")} />
          </div>
          <div>
            <Label htmlFor="b-email">Business email</Label>
            <Input id="b-email" maxLength={255} className="mt-1.5" {...field("email")} />
          </div>
          <div>
            <Label htmlFor="b-address">Street address</Label>
            <Input id="b-address" maxLength={160} className="mt-1.5" {...field("address_line1")} />
          </div>
          <div>
            <Label htmlFor="b-city">City</Label>
            <Input id="b-city" maxLength={80} className="mt-1.5" {...field("city")} />
          </div>
          <div>
            <Label htmlFor="b-state">State / region</Label>
            <Input id="b-state" maxLength={40} className="mt-1.5" {...field("state")} />
          </div>
          <div>
            <Label htmlFor="b-postal">Postcode</Label>
            <Input id="b-postal" maxLength={20} className="mt-1.5" {...field("postal_code")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="b-description">Description</Label>
            <Textarea id="b-description" rows={4} maxLength={600} className="mt-1.5" {...field("description")} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Services</h2>
          {services.length ? (
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {services.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No services added yet.</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Areas you cover</h2>
          {areas.length ? (
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {areas.map((a) => (
                <li key={a.id}>
                  {a.city}
                  {a.is_primary ? " (main)" : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No service areas added yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
