import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Copy, Loader2, Mail, Plus, PlusCircle, Timer, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  createManualSite,
  deleteManualSite,
  extendManualSite,
  listManualSites,
  resendManualLink,
  uploadManualImage,
  type ManualSite,
} from "@/lib/manual-sites.functions";
import { INDUSTRY_OPTIONS, defaultServicesForNiche } from "@/lib/template-registry";
import { PLAN_COPY, yearlyPrice } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KEY = ["admin-manual-sites"] as const;

const PLAN_OPTIONS = [
  ...PLAN_COPY.map((p) => ({ id: p.id, label: `${p.name} — $${p.price}/month` })),
  ...PLAN_COPY.map((p) => ({
    id: `${p.id}_yearly`,
    label: `${p.name} — $${yearlyPrice(p.price)}/year`,
  })),
];

type ServiceRow = { name: string; description: string };

type FormState = {
  businessName: string;
  niche: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  primaryService: string;
  tagline: string;
  description: string;
  services: ServiceRow[];
  areas: string;
  primaryColor: string;
  logoUrl: string;
  heroImageUrl: string;
  aboutImageUrl: string;
  galleryUrls: string[];
  planId: string;
  hours: number;
  notes: string;
};

const DEFAULT_COLOR = "#1f6feb";

const EMPTY: FormState = {
  businessName: "",
  niche: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  city: "",
  state: "",
  primaryService: "",
  tagline: "",
  description: "",
  services: [],
  areas: "",
  primaryColor: DEFAULT_COLOR,
  logoUrl: "",
  heroImageUrl: "",
  aboutImageUrl: "",
  galleryUrls: [],
  planId: "basic",
  hours: 12,
  notes: "",
};

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif";

/** Upload control used while building a demo site — no URL typing needed. */
function ManualUpload({
  label,
  hint,
  kind,
  folder,
  value,
  square,
  onChange,
}: {
  label: string;
  hint?: string;
  kind: string;
  folder: string;
  value: string;
  square?: boolean;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = useServerFn(uploadManualImage);

  async function handleFile(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("That image is larger than 8 MB.");
      return;
    }
    setBusy(true);
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]!);
      const result = await upload({
        data: {
          folder,
          kind,
          contentType: file.type,
          dataBase64: btoa(binary),
        },
      });
      onChange(result.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That upload didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 ${
            square ? "h-20 w-20" : "h-20 w-32"
          }`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            {value ? "Replace" : "Upload"}
          </Button>
          {value ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
              <X className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}

/** Live "11:42:08" style countdown to an expiry timestamp. */
function Countdown({ iso, status }: { iso: string; status: ManualSite["status"] }) {
  const target = new Date(iso).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (status === "paid") return <span className="text-muted-foreground">—</span>;
  const total = Math.floor((target - now) / 1000);
  if (total <= 0) return <span className="font-semibold text-destructive">Expired</span>;
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return (
    <span className="font-mono font-semibold tabular-nums">
      {hh}:{mm}:{ss}
    </span>
  );
}

function StatusBadge({ status }: { status: ManualSite["status"] }) {
  if (status === "paid") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Paid</Badge>;
  if (status === "expired") return <Badge variant="destructive">Expired</Badge>;
  if (status === "cancelled") return <Badge variant="outline">Cancelled</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export function AdminManualSitesTab({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient();
  const load = useServerFn(listManualSites);
  const create = useServerFn(createManualSite);
  const extend = useServerFn(extendManualSite);
  const resend = useServerFn(resendManualLink);
  const remove = useServerFn(deleteManualSite);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  // Uploads happen before the business exists, so they live in their own folder.
  const [folder, setFolder] = useState(() => crypto.randomUUID());
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ManualSite | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const sites = useQuery({
    queryKey: KEY,
    enabled,
    refetchInterval: 60_000,
    queryFn: () => load({ data: undefined }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });

  const createMutation = useMutation({
    mutationFn: async () =>
      create({
        data: {
          ...form,
          services: form.services.filter((s) => s.name.trim()),
          galleryUrls: form.galleryUrls.filter(Boolean).slice(0, 6),
          ...(form.primaryColor ? { primaryColor: form.primaryColor } : {}),
          hours: Number(form.hours) || 12,
        },
      }),
    onSuccess: async (result) => {
      await refresh();
      setOpen(false);
      setForm({ ...EMPTY });
      setFolder(crypto.randomUUID());
      try {
        await navigator.clipboard.writeText(result.url);
        toast.success("Demo site created — link copied to your clipboard");
      } catch {
        toast.success(`Demo site created at ${result.url}`);
      }
    },
    onError: (error: Error) => toast.error(error.message || "Could not create the demo site."),
  });

  const extendMutation = useMutation({
    mutationFn: (vars: { id: string; hours: number }) => extend({ data: vars }),
    onSuccess: async () => {
      await refresh();
      toast.success("Countdown extended");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => resend({ data: { id } }),
    onSuccess: () => toast.success("Preview link emailed to the customer"),
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      await refresh();
      setPendingDelete(null);
      setConfirmed(false);
      toast.success("Demo site deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = useMemo(() => {
    const list = sites.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((row) =>
      [row.businessName, row.contactEmail, row.slug, row.contactName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [sites.data, search]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Picking a trade prefills its usual services; the team can edit or remove them. */
  const chooseNiche = (niche: string) =>
    setForm((prev) => ({
      ...prev,
      niche,
      services: prev.services.length
        ? prev.services
        : defaultServicesForNiche(niche).map((name) => ({ name, description: "" })),
    }));

  const setService = (index: number, patch: Partial<ServiceRow>) =>
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search demo sites"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button className="ml-auto gap-2" onClick={() => setOpen(true)}>
          <PlusCircle className="h-4 w-4" /> New demo site
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Time left</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.isLoading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Loading demo sites…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  No demo sites yet. Create one for a prospect from Messenger or outreach.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.businessName}</p>
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      /{row.slug}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <p>{row.contactName || "—"}</p>
                    <p className="text-xs text-muted-foreground">{row.contactEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs uppercase">{row.planId}</td>
                  <td className="px-4 py-3">
                    <Countdown iso={row.expiresAt} status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => {
                          void navigator.clipboard.writeText(row.url);
                          toast.success("Link copied");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" /> Link
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/admin-site/$businessId" params={{ businessId: row.businessId }}>
                          Edit site
                        </Link>
                      </Button>
                      {row.status !== "paid" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={extendMutation.isPending}
                            onClick={() => extendMutation.mutate({ id: row.id, hours: 12 })}
                          >
                            <Timer className="h-3.5 w-3.5" /> +12h
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={resendMutation.isPending}
                            onClick={() => resendMutation.mutate(row.id)}
                          >
                            <Mail className="h-3.5 w-3.5" /> Resend
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={() => {
                              setConfirmed(false);
                              setPendingDelete(row);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------------------------------------------------- create */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New demo site</DialogTitle>
            <DialogDescription>
              Builds a real website from our template library, publishes it, and puts a
              pay-now countdown banner on top until the customer pays.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                placeholder="Sparkle Cleaning Co"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Business type</Label>
              <Select value={form.niche} onValueChange={chooseNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a trade" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {INDUSTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contact name</Label>
              <Input
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact email</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="owner@business.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Main service</Label>
              <Input
                value={form.primaryService}
                onChange={(e) => set("primaryService", e.target.value)}
                placeholder="End of tenancy cleaning"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Town / city</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>State / county</Label>
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Tagline</Label>
              <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>About the business</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Label>Services on the services section</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto gap-1.5"
                  onClick={() =>
                    set("services", [...form.services, { name: "", description: "" }])
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add service
                </Button>
              </div>
              {form.services.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Choose a business type to load the usual services, or add your own.
                </p>
              ) : null}
              <div className="space-y-2">
                {form.services.map((service, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]"
                  >
                    <Input
                      value={service.name}
                      placeholder="Service name"
                      onChange={(e) => setService(index, { name: e.target.value })}
                    />
                    <Input
                      value={service.description}
                      placeholder="Short description (optional)"
                      onChange={(e) => setService(index, { description: e.target.value })}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Remove service"
                      onClick={() =>
                        set(
                          "services",
                          form.services.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Other areas covered (comma separated)</Label>
              <Textarea rows={3} value={form.areas} onChange={(e) => set("areas", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Brand colour</Label>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <input
                  type="color"
                  aria-label="Brand colour"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.primaryColor) ? form.primaryColor : DEFAULT_COLOR}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-10 w-14 shrink-0 cursor-pointer rounded border border-input bg-background"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  placeholder="#1f6feb"
                />
              </div>
            </div>
            <ManualUpload
              label="Logo"
              hint="Shown in the header of their website."
              kind="logo"
              folder={folder}
              square
              value={form.logoUrl}
              onChange={(url) => set("logoUrl", url)}
            />
            <ManualUpload
              label="Main photo (top of the page)"
              kind="hero"
              folder={folder}
              value={form.heroImageUrl}
              onChange={(url) => set("heroImageUrl", url)}
            />
            <ManualUpload
              label="About photo"
              kind="about"
              folder={folder}
              value={form.aboutImageUrl}
              onChange={(url) => set("aboutImageUrl", url)}
            />
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Label>Gallery photos</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto gap-1.5"
                  disabled={form.galleryUrls.length >= 6}
                  onClick={() => set("galleryUrls", [...form.galleryUrls, ""])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add photo
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {form.galleryUrls.map((url, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <ManualUpload
                      label={`Photo ${index + 1}`}
                      kind="gallery"
                      folder={folder}
                      value={url}
                      onChange={(next) =>
                        set(
                          "galleryUrls",
                          form.galleryUrls.map((v, i) => (i === index ? next : v)),
                        )
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Remove photo"
                      onClick={() =>
                        set(
                          "galleryUrls",
                          form.galleryUrls.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Plan the pay button charges</Label>
              <Select value={form.planId} onValueChange={(v) => set("planId", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preview lasts (hours)</Label>
              <Input
                type="number"
                min={1}
                max={720}
                value={form.hours}
                onChange={(e) => set("hours", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Internal notes (optional)</Label>
              <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                createMutation.isPending ||
                form.businessName.trim().length < 2 ||
                !form.niche ||
                !form.contactEmail.includes("@")
              }
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Building…" : "Build demo site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------------- delete */}
      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) {
            setPendingDelete(null);
            setConfirmed(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this demo site?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.businessName} and everything built for it — the website, photos,
              enquiries and the prospect's sign-in — will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} />
            Yes, delete this demo site permanently
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!confirmed || deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
