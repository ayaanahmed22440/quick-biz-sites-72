import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/domains")({
  head: () => ({
    meta: [
      { title: "Domains — WebWarheads" },
      { name: "description", content: "Connect your domain to your WebWarheads website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DomainsPage,
});

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;

function DomainsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;
  const slug = workspace?.business?.slug;
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");

  const domains = useQuery({
    queryKey: ["domains", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select("id, domain, kind, status, ssl_active, created_at")
        .eq("business_id", businessId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const addDomain = useMutation({
    mutationFn: async () => {
      const domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!DOMAIN_PATTERN.test(domain)) throw new Error("That doesn't look like a valid domain name.");
      const { error } = await supabase
        .from("domains")
        .insert({ business_id: businessId!, domain, kind: "connected" });
      if (error) throw error;
    },
    onSuccess: () => {
      setValue("");
      toast.success("Domain added — we'll verify it and confirm when it's live");
      void queryClient.invalidateQueries({ queryKey: ["domains", businessId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add that domain"),
  });

  const removeDomain = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domain removed");
      void queryClient.invalidateQueries({ queryKey: ["domains", businessId] });
    },
  });

  if (isLoading || domains.isLoading) return <LoadingBlock rows={3} />;
  if (domains.isError) return <ErrorBlock />;

  const rows = domains.data ?? [];

  return (
    <>
      <PageHeader
        title="Domains"
        description="Use a domain you already own, or your free WebWarheads address while you decide."
      />

      {slug ? (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Your free WebWarheads address</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">webwarheads.com/{slug}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            Live now at {typeof window !== "undefined" ? window.location.origin : ""}/{slug}
          </p>
        </div>
      ) : null}

      <div className="mb-6 rounded-lg border border-accent/40 bg-accent/10 p-4">
        <p className="text-sm font-semibold">Not sure how domains work?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We have a short walkthrough and plain-English steps for pointing a domain you already own
          at your site.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link to="/connect-domain">Show me how</Link>
        </Button>
      </div>


      <section className="mb-6 space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Connect a domain you own</h2>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="domain">Domain name</Label>
            <Input
              id="domain"
              placeholder="yourbusiness.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button
            disabled={addDomain.isPending || !value.trim() || !businessId}
            onClick={() => addDomain.mutate()}
          >
            Add domain
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Once you add it, we send you the exact records to paste at your domain provider, check
          them for you, and switch your site over with a secure certificate. We never buy or
          transfer a domain on your behalf without your written go-ahead.
        </p>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="No domain connected yet"
          description="Add a domain above whenever you're ready. Your free WebWarheads address keeps working either way."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((d) => (
            <li
              key={d.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{d.domain}</p>
                <p className="text-xs text-muted-foreground">
                  {d.status === "active"
                    ? "Live"
                    : "Waiting on the records at your domain provider — we'll email you the moment it's live."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={d.status === "active" ? "default" : "secondary"}>{d.status}</Badge>
                {d.ssl_active ? <Badge>Secure</Badge> : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDomain.mutate(d.id)}
                  disabled={removeDomain.isPending}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
