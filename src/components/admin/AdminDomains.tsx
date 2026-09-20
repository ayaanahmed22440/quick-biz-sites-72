import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  adminAddDomain,
  adminRemoveDomain,
  adminUpdateDomain,
  checkDomain,
  DOMAIN_TARGET_IP,
  listDomainOverview,
  setDomainVerification,
} from "@/lib/domains.functions";
import { ErrorBlock, LoadingBlock } from "@/components/app/StateBlocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type DomainRow = {
  id: string;
  domain: string;
  status: string;
  ssl_active: boolean;
  ssl_status: string;
  verification_token: string | null;
  admin_notes: string | null;
  last_checked_at: string | null;
};

type SiteRow = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  domains: DomainRow[];
};

type CheckResult = {
  status: string;
  message: string;
  records: { label: string; ok: boolean; observed: string[] }[];
};

/** Plain-language state for a client site, shown as the status column. */
function siteStatus(site: SiteRow) {
  if (site.domains.length === 0)
    return { label: "Default subdomain", tone: "secondary" as const };
  if (site.domains.some((d) => d.status === "active"))
    return { label: "Connected", tone: "default" as const };
  if (site.domains.some((d) => d.status === "error"))
    return { label: "Failed", tone: "destructive" as const };
  return { label: "Pending connection", tone: "secondary" as const };
}

function Copyable({ label, value }: { label: string; value: string }) {
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
        className="mt-1 flex w-full items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-left font-mono text-xs hover:bg-muted"
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

function RecordCard({
  type,
  host,
  value,
  hint,
}: {
  type: string;
  host: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-4">
      <Copyable label="Type" value={type} />
      <Copyable label="Name / Host" value={host} />
      <Copyable label="Value" value={value} />
      <Copyable label="TTL" value="1 hour" />
      <p className="text-xs text-muted-foreground sm:col-span-4">{hint}</p>
    </div>
  );
}

function DomainCard({
  domain,
  onDone,
}: {
  domain: DomainRow;
  onDone: () => void;
}) {
  const check = useServerFn(checkDomain);
  const save = useServerFn(setDomainVerification);
  const rename = useServerFn(adminUpdateDomain);
  const remove = useServerFn(adminRemoveDomain);

  const [token, setToken] = useState(domain.verification_token ?? "");
  const [notes, setNotes] = useState(domain.admin_notes ?? "");
  const [name, setName] = useState(domain.domain);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const runCheck = useMutation({
    mutationFn: () => check({ data: { domainId: domain.id } }),
    onSuccess: (r) => {
      setResult(r as CheckResult);
      toast.info(r.message);
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not check that domain"),
  });

  const saveDetails = useMutation({
    mutationFn: () =>
      save({ data: { domainId: domain.id, verificationToken: token, adminNotes: notes } }),
    onSuccess: () => {
      toast.success("Saved");
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save that"),
  });

  const saveName = useMutation({
    mutationFn: () => rename({ data: { domainId: domain.id, domain: name } }),
    onSuccess: () => {
      toast.success("Domain updated — status reset to pending");
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update that domain"),
  });

  const dropDomain = useMutation({
    mutationFn: () => remove({ data: { domainId: domain.id } }),
    onSuccess: () => {
      toast.success("Domain removed");
      setConfirmRemove(false);
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove that domain"),
  });

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="truncate font-medium">{domain.domain}</span>
        <Badge variant={domain.status === "active" ? "default" : "secondary"}>
          {domain.status === "active"
            ? "DNS verified"
            : domain.status === "verifying"
              ? "Records spotted"
              : domain.status === "error"
                ? "Failed"
                : "Waiting on records"}
        </Badge>
        <Badge variant={domain.ssl_active ? "default" : "outline"}>
          {domain.ssl_active ? "SSL issued" : "SSL pending"}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          {domain.last_checked_at
            ? `Checked ${new Date(domain.last_checked_at).toLocaleString()}`
            : "Never checked"}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Records the client must add at their registrar
        </p>
        <RecordCard
          type="A"
          host="@"
          value={DOMAIN_TARGET_IP}
          hint={`Covers ${domain.domain}. Edit any existing @ record rather than adding a second one.`}
        />
        <RecordCard
          type="A"
          host="www"
          value={DOMAIN_TARGET_IP}
          hint={`Covers www.${domain.domain}. This one is not automatic — it must be added separately.`}
        />
        {domain.verification_token ? (
          <RecordCard
            type="TXT"
            host="_lovable"
            value={domain.verification_token}
            hint="Proves ownership. Paste exactly as shown."
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Attach {domain.domain} in the WebWarheads project settings first, then paste the
            ownership token below so the client sees the TXT record.
          </p>
        )}
      </div>

      {result ? (
        <ul className="mt-3 space-y-1 rounded-lg border border-border bg-background p-3 text-xs">
          {result.records.map((r) => (
            <li key={r.label} className="flex flex-wrap items-center gap-2">
              <Badge variant={r.ok ? "default" : "secondary"}>{r.ok ? "OK" : "Missing"}</Badge>
              <span className="font-mono">{r.label}</span>
              <span className="text-muted-foreground">
                {r.observed.length ? r.observed.join(", ") : "nothing found"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Ownership token (TXT value for _lovable)</Label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Edit domain name</Label>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button
              variant="outline"
              disabled={saveName.isPending || name.trim() === domain.domain}
              onClick={() => saveName.mutate()}
            >
              Save
            </Button>
          </div>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Admin notes</Label>
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. emailed Dave 12 Sep, registrar is Hostinger, waiting on TXT"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={saveDetails.isPending} onClick={() => saveDetails.mutate()}>
          Save token &amp; notes
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={runCheck.isPending}
          onClick={() => runCheck.mutate()}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {runCheck.isPending ? "Checking…" : "Re-check DNS"}
        </Button>
        {domain.status === "active" ? (
          <Button size="sm" variant="outline" asChild>
            <a href={`https://${domain.domain}`} target="_blank" rel="noreferrer">
              Open <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={() => setConfirmRemove(true)}
        >
          Remove
        </Button>
      </div>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {domain.domain}?</AlertDialogTitle>
            <AlertDialogDescription>
              The client's site stays online at its free WebWarheads address. Their DNS records
              will simply stop resolving to us.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction disabled={dropDomain.isPending} onClick={() => dropDomain.mutate()}>
              Remove domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SiteCard({ site, onDone }: { site: SiteRow; onDone: () => void }) {
  const add = useServerFn(adminAddDomain);
  const [value, setValue] = useState("");
  const status = siteStatus(site);

  const addDomain = useMutation({
    mutationFn: () => add({ data: { businessId: site.id, domain: value } }),
    onSuccess: (r) => {
      setValue("");
      toast.success(`${r.domain} added — attach it in project settings, then paste the token`);
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add that domain"),
  });

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="truncate font-medium">{site.name}</span>
        <Badge variant={status.tone}>{status.label}</Badge>
        <span className="text-xs text-muted-foreground">webwarheads.com/{site.slug}</span>
      </div>

      {site.domains.length > 0 ? (
        <div className="mt-3 space-y-3">
          {site.domains.map((d) => (
            <DomainCard key={d.id} domain={d} onDone={onDone} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          placeholder="cleanpro.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          variant="outline"
          disabled={addDomain.isPending || !value.trim()}
          onClick={() => addDomain.mutate()}
        >
          Add domain
        </Button>
      </div>
    </li>
  );
}

/** Staff domain queue: every client site, its domain state and the records to hand over. */
export function AdminDomains() {
  const queryClient = useQueryClient();
  const overview = useServerFn(listDomainOverview);
  const [search, setSearch] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);

  const sites = useQuery({
    queryKey: ["admin-domain-overview"],
    queryFn: () => overview({ data: undefined }) as Promise<SiteRow[]>,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-domain-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
  };

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (sites.data ?? []).filter((s) => {
      if (onlyPending && siteStatus(s).label !== "Pending connection") return false;
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        (s.email ?? "").toLowerCase().includes(term) ||
        s.domains.some((d) => d.domain.includes(term))
      );
    });
  }, [sites.data, search, onlyPending]);

  if (sites.isLoading) return <LoadingBlock rows={3} />;
  if (sites.isError) return <ErrorBlock />;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Client domains</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Add a client's own domain here, hand them the records below, then re-check. Remember each
          domain also has to be attached once in the WebWarheads project settings — until that's
          done, correct DNS still won't serve their site, and the ownership token comes from there.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search by business, address or domain"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant={onlyPending ? "default" : "outline"} onClick={() => setOnlyPending((v) => !v)}>
          Pending only
        </Button>
        <Button variant="ghost" onClick={refresh}>
          Refresh
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No client sites match that search.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((site) => (
            <SiteCard key={site.id} site={site} onDone={refresh} />
          ))}
        </ul>
      )}
    </div>
  );
}
