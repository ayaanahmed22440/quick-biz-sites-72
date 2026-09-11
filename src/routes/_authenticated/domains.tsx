import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkDomain, DOMAIN_TARGET_IP } from "@/lib/domains.functions";
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

const STATUS_COPY: Record<string, string> = {
  pending: "Added — waiting for the two records at your domain provider.",
  verifying: "Records spotted. They can take an hour or two to spread across the internet.",
  active: "Live and secured. Visitors see your site on this name.",
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="mt-1 flex w-full items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-left font-mono text-sm hover:bg-muted"
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function RecordRow({
  name,
  host,
  type = "A",
  value = DOMAIN_TARGET_IP,
}: {
  name: string;
  host: string;
  type?: string;
  value?: string;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-4">
      <CopyField label="Type" value={type} />
      <CopyField label="Name / Host" value={host} />
      <CopyField label="Value / Points to" value={value} />
      <CopyField label="TTL" value="1 hour" />
      <p className="text-xs text-muted-foreground sm:col-span-4">{name}</p>
    </div>
  );
}

function DomainsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;
  const slug = workspace?.business?.slug;
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const check = useServerFn(checkDomain);

  const domains = useQuery({
    queryKey: ["domains", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select(
          "id, domain, kind, status, ssl_active, verification_token, last_checked_at, created_at",
        )
        .eq("business_id", businessId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const addDomain = useMutation({
    mutationFn: async () => {
      const domain = value
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "");
      if (!DOMAIN_PATTERN.test(domain)) throw new Error("That doesn't look like a valid domain name.");
      const { error } = await supabase
        .from("domains")
        .insert({ business_id: businessId!, domain, kind: "connected" });
      if (error) throw error;
    },
    onSuccess: () => {
      setValue("");
      toast.success("Domain added — now add the two records below");
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

  const runCheck = useMutation({
    mutationFn: (domainId: string) => check({ data: { domainId } }),
    onSuccess: (result) => {
      if (result.status === "active") toast.success(result.message);
      else toast.info(result.message);
      void queryClient.invalidateQueries({ queryKey: ["domains", businessId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not check that domain"),
  });

  if (isLoading || domains.isLoading) return <LoadingBlock rows={3} />;
  if (domains.isError) return <ErrorBlock />;

  const rows = domains.data ?? [];

  return (
    <>
      <PageHeader
        title="Your website address"
        description="Use the free WebWarheads address, buy a name of your own, or connect one you already have."
      />

      {slug ? (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Your free WebWarheads address</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">webwarheads.com/{slug}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This keeps working forever, even after you add your own name.
          </p>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">I don't have a domain yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A name like yourbusiness.com costs about $12–20 a year. Our guide walks you through
            buying one on GoDaddy in about five minutes, including which extras to skip.
          </p>
          <Button asChild className="mt-4">
            <Link to="/connect-domain">Show me how to buy one</Link>
          </Button>
        </section>

        <section className="rounded-xl border border-accent/40 bg-accent/10 p-5">
          <h2 className="text-sm font-semibold">I already own one</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add it below. We'll show you the exact two records to paste at your provider, then check
            them for you and switch the padlock on.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/connect-domain" hash="connect">
              Read the connecting steps
            </Link>
          </Button>
        </section>
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
          We never buy or transfer a domain on your behalf — you own the name, we just point it at
          your website.
        </p>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="No domain connected yet"
          description="Add a domain above whenever you're ready. Your free WebWarheads address keeps working either way."
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((d) => (
            <li key={d.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="min-w-0 flex-1 truncate font-medium">{d.domain}</p>
                <Badge variant={d.status === "active" ? "default" : "secondary"}>
                  {d.status === "active" ? "Live" : d.status === "verifying" ? "Almost there" : "Waiting on records"}
                </Badge>
                {d.ssl_active ? <Badge>Secure</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {STATUS_COPY[d.status] ?? "We're keeping an eye on this one."}
              </p>

              {d.status !== "active" ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Add these two records at your provider</p>
                  <RecordRow host="@" name="This one covers yourbusiness.com" />
                  <RecordRow host="www" name="This one covers www.yourbusiness.com" />
                  <p className="text-xs text-muted-foreground">
                    In GoDaddy: My Products → your domain → DNS → Add New Record. If a record with
                    the same name already exists, edit it instead of adding a second one.
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => runCheck.mutate(d.id)}
                  disabled={runCheck.isPending}
                >
                  {runCheck.isPending ? "Checking…" : "Check my records"}
                </Button>
                {d.status === "active" ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://${d.domain}`} target="_blank" rel="noreferrer">
                      Open site <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeDomain.mutate(d.id)}
                  disabled={removeDomain.isPending}
                >
                  Remove
                </Button>
                {d.last_checked_at ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Last checked {new Date(d.last_checked_at).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
