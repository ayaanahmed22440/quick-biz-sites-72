import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Search,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelMyDomain,
  checkDomain,
  checkDomainAvailability,
  DOMAIN_SETUP_FEE_USD,
  DOMAIN_TARGET_IP,
  listMyDomains,
  requestDomainPurchase,
  requestOwnDomain,
} from "@/lib/domains.functions";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/domains")({
  head: () => ({
    meta: [
      { title: "Domains — WebWarheads" },
      { name: "description", content: "Get a domain for your WebWarheads website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DomainsPage,
});

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;

function clean(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

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

type DomainRow = Awaited<ReturnType<typeof listMyDomains>>[number];

function statusLabel(d: DomainRow) {
  if (d.status === "active") return { text: "Live", tone: "default" as const };
  if (d.request_type === "purchase" && d.purchase_status === "awaiting_payment")
    return { text: "Payment needed", tone: "secondary" as const };
  if (d.request_type === "purchase" && d.purchase_status === "paid")
    return { text: "Being set up", tone: "secondary" as const };
  if (!d.records_released) return { text: "We're on it", tone: "secondary" as const };
  if (d.status === "verifying") return { text: "Almost there", tone: "secondary" as const };
  return { text: "Waiting on records", tone: "secondary" as const };
}

function statusCopy(d: DomainRow) {
  if (d.status === "active") return "Live and secured. Visitors see your site on this name.";
  if (d.request_type === "purchase" && d.purchase_status === "awaiting_payment")
    return "Finish the one-off payment and we'll take it from there.";
  if (d.request_type === "purchase")
    return "Paid — our team is registering this name and pointing it at your site. Usually live within 24 hours.";
  if (!d.records_released)
    return "Our team is preparing this one. If we need anything from you, we'll email you simple steps.";
  if (d.status === "verifying")
    return "Records spotted. They can take 12–24 hours to fully settle — we'll email you the moment it's live.";
  return "Add the records below at your domain provider and we'll do the rest.";
}

function DomainsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;
  const slug = workspace?.business?.slug;
  const queryClient = useQueryClient();

  const check = useServerFn(checkDomain);
  const listMine = useServerFn(listMyDomains);
  const lookUp = useServerFn(checkDomainAvailability);
  const buy = useServerFn(requestDomainPurchase);
  const bringOwn = useServerFn(requestOwnDomain);
  const cancel = useServerFn(cancelMyDomain);

  const [wanted, setWanted] = useState("");
  const [owned, setOwned] = useState("");
  const [toRemove, setToRemove] = useState<{ id: string; domain: string } | null>(null);
  const [lookup, setLookup] = useState<{
    domain: string;
    available: boolean;
    known: boolean;
  } | null>(null);

  const domains = useQuery({
    queryKey: ["domains", businessId],
    enabled: Boolean(businessId),
    queryFn: () => listMine({ data: { businessId: businessId! } }),
  });

  const availability = useMutation({
    mutationFn: async () => {
      const domain = clean(wanted);
      if (!DOMAIN_PATTERN.test(domain))
        throw new Error("Type the full name, like yourbusiness.com");
      return lookUp({ data: { domain } });
    },
    onSuccess: (result) => setLookup(result),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not check that name"),
  });

  const startPurchase = useMutation({
    mutationFn: (domain: string) => buy({ data: { businessId: businessId!, domain } }),
    onSuccess: (result) => {
      if (result.url) window.location.href = result.url;
      else {
        toast.success("Already paid — our team is on it.");
        void queryClient.invalidateQueries({ queryKey: ["domains", businessId] });
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start that order"),
  });

  const addOwn = useMutation({
    mutationFn: async () => {
      const domain = clean(owned);
      if (!DOMAIN_PATTERN.test(domain))
        throw new Error("That doesn't look like a valid domain name.");
      return bringOwn({ data: { businessId: businessId!, domain } });
    },
    onSuccess: () => {
      setOwned("");
      toast.success("Got it — we're setting that up for you.");
      void queryClient.invalidateQueries({ queryKey: ["domains", businessId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add that domain"),
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

  const removeDomain = useMutation({
    mutationFn: (domainId: string) =>
      cancel({ data: { businessId: businessId!, domainId } }),
    onSuccess: (result) => {
      setToRemove(null);
      toast.success(`${result.domain} removed — you can add it again any time.`);
      void queryClient.invalidateQueries({ queryKey: ["domains", businessId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove that name"),
  });



  if (isLoading || domains.isLoading) return <LoadingBlock rows={3} />;
  if (domains.isError) return <ErrorBlock />;

  const rows = domains.data ?? [];

  return (
    <>
      <PageHeader
        title="Your website address"
        description="Use the free WebWarheads address, let us get you a name of your own, or bring one you already have."
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

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-accent/40 bg-accent/10 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Get a domain for me — ${DOMAIN_SETUP_FEE_USD} one-off
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us the name you want. We check it's free, buy it, and connect it to your website
            for you — nothing technical to do.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="wanted">Name you want</Label>
              <Input
                id="wanted"
                placeholder="yourbusiness.com"
                value={wanted}
                onChange={(e) => {
                  setWanted(e.target.value);
                  setLookup(null);
                }}
              />
            </div>
            <Button
              variant="outline"
              disabled={availability.isPending || !wanted.trim()}
              onClick={() => availability.mutate()}
            >
              {availability.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="ml-1.5">Check</span>
            </Button>
          </div>

          {lookup ? (
            <div className="mt-3 space-y-2">
              {lookup.available ? (
                <>
                  <p className="text-sm font-medium text-foreground">
                    {lookup.domain} looks available.
                  </p>
                  <Button
                    disabled={startPurchase.isPending || !businessId}
                    onClick={() => startPurchase.mutate(lookup.domain)}
                  >
                    {startPurchase.isPending
                      ? "Opening payment…"
                      : `Get ${lookup.domain} — $${DOMAIN_SETUP_FEE_USD}`}
                  </Button>
                </>
              ) : lookup.known ? (
                <p className="text-sm text-muted-foreground">
                  {lookup.domain} is already taken. Try another spelling or a different ending.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  We couldn't check that name right now. Try again in a moment.
                </p>
              )}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">I already have a domain</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add it here and our team sets up the connection. We'll email you if we need anything
            from your domain provider.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="owned">Your domain</Label>
              <Input
                id="owned"
                placeholder="yourbusiness.com"
                value={owned}
                onChange={(e) => setOwned(e.target.value)}
              />
            </div>
            <Button
              disabled={addOwn.isPending || !owned.trim() || !businessId}
              onClick={() => addOwn.mutate()}
            >
              {addOwn.isPending ? "Adding…" : "Add domain"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Not sure how domains work?{" "}
            <Link to="/connect-domain" className="underline">
              Read the short guide
            </Link>
            .
          </p>
        </section>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No domain yet"
          description="Pick one of the two options above whenever you're ready. Your free WebWarheads address keeps working either way."
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((d) => {
            const label = statusLabel(d);
            const showRecords = d.records_released && d.status !== "active";
            return (
              <li key={d.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="min-w-0 flex-1 truncate font-medium">{d.domain}</p>
                  <Badge variant={label.tone}>{label.text}</Badge>
                  {d.ssl_active ? <Badge>Secure</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{statusCopy(d)}</p>

                {showRecords ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                      <p className="flex items-start gap-2 text-sm font-medium text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        Before you add these, clear out any old records
                      </p>
                      <p className="mt-1.5 pl-6 text-sm text-muted-foreground">
                        At your provider, <span className="font-medium text-foreground">delete any existing A or AAAA record for @</span> — and if
                        there's already anything named <span className="font-medium text-foreground">www</span> (an A record or a CNAME), delete that
                        too. Old records pointing somewhere else will stop your site from showing and can leave the name stuck for days.
                      </p>
                    </div>
                    <p className="text-sm font-medium">Add these records at your provider</p>
                    <RecordRow host="@" name={`This one covers ${d.domain}`} />
                    <RecordRow host="www" name={`This one covers www.${d.domain}`} />
                    {d.verification_token ? (
                      <>
                        <RecordRow
                          type="TXT"
                          host="_lovable"
                          value={d.verification_token}
                          name="This one proves you own the name. Add it exactly as shown."
                        />
                        <RecordRow
                          type="TXT"
                          host="_lovable.www"
                          value={d.verification_token}
                          name={`Same code, added a second time with the name _lovable.www — this one covers www.${d.domain}.`}
                        />
                      </>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      In GoDaddy: My Products → your domain → DNS → Add New Record. If a record with
                      the same name already exists, edit it instead of adding a second one. Then hit
                      “Check my records” — we finish the secure setup for you.
                    </p>
                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="flex items-start gap-2 text-sm">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="text-muted-foreground">
                          Allow <span className="font-medium text-foreground">12–24 hours</span> for the records to fully settle across the internet.
                          We'll keep checking in the background and email you the moment your site is live — no need to keep refreshing this page.
                        </span>
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {d.request_type === "purchase" &&
                  d.purchase_status === "awaiting_payment" &&
                  d.checkout_url ? (
                    <Button size="sm" asChild>
                      <a href={d.checkout_url}>Finish payment</a>
                    </Button>
                  ) : null}
                  {showRecords ? (
                    <Button
                      size="sm"
                      onClick={() => runCheck.mutate(d.id)}
                      disabled={runCheck.isPending}
                    >
                      {runCheck.isPending ? "Checking…" : "Check my records"}
                    </Button>
                  ) : null}
                  {d.status === "active" ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`https://${d.domain}`} target="_blank" rel="noreferrer">
                        Open site <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </Button>
                  ) : null}
                  {d.status !== "active" &&
                  d.purchase_status !== "paid" &&
                  d.purchase_status !== "fulfilled" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setToRemove({ id: d.id, domain: d.domain })}
                    >
                      Remove
                    </Button>
                  ) : null}
                  {d.last_checked_at ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Last checked {new Date(d.last_checked_at).toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={Boolean(toRemove)} onOpenChange={(open) => !open && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toRemove?.domain}?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll stop setting this name up. Your website stays online at its free WebWarheads
              address, and you can add the correct name straight after.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeDomain.isPending}
              onClick={() => toRemove && removeDomain.mutate(toRemove.id)}
            >
              Remove it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>

  );
}
