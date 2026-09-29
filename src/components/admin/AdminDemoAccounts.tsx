import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, KeyRound, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  createDemoAccount,
  listDemoAccounts,
  resetDemoAccountPassword,
  updateDemoAccountPlan,
} from "@/lib/demo-accounts.functions";
import { deleteUserAccount } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const KEY = ["admin-demo-accounts"] as const;

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Website ($37)",
  seo: "Website + SEO ($68)",
  premium: "Growth ($97)",
};

type PlanId = "free" | "basic" | "seo" | "premium";

export function AdminDemoAccounts({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient();
  const load = useServerFn(listDemoAccounts);
  const create = useServerFn(createDemoAccount);
  const changePlan = useServerFn(updateDemoAccountPlan);
  const resetPassword = useServerFn(resetDemoAccountPassword);
  const removeUser = useServerFn(deleteUserAccount);

  const accounts = useQuery({
    queryKey: KEY,
    enabled,
    queryFn: () => load({ data: undefined }),
  });

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [planId, setPlanId] = useState<PlanId>("premium");

  const [resetFor, setResetFor] = useState<{ userId: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteFor, setDeleteFor] = useState<{ userId: string; email: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });

  const createMutation = useMutation({
    mutationFn: () =>
      create({
        data: { email: email.trim(), password, planId, businessName: businessName.trim(), niche: "cleaning" },
      }),
    onSuccess: () => {
      toast.success("Test account created — it can sign in straight away.");
      setOpen(false);
      setEmail("");
      setPassword("");
      setBusinessName("");
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const planMutation = useMutation({
    mutationFn: (vars: { businessId: string; planId: PlanId }) => changePlan({ data: vars }),
    onSuccess: () => {
      toast.success("Plan updated.");
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const passwordMutation = useMutation({
    mutationFn: () => resetPassword({ data: { userId: resetFor!.userId, password: newPassword } }),
    onSuccess: () => {
      toast.success("New password set.");
      setResetFor(null);
      setNewPassword("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeUser({ data: { userId: deleteFor!.userId } }),
    onSuccess: () => {
      toast.success("Test account removed.");
      setDeleteFor(null);
      setConfirmDelete(false);
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = accounts.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Accounts for reviewers and testers. They sign in with an email and password, with no
          payment and no confirmation email.
        </p>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Create test account
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                  No test accounts yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.userId} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{row.email}</td>
                  <td className="px-4 py-3">{row.businessName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.businessId ? (
                      <Select
                        value={row.planId as string}
                        onValueChange={(value) =>
                          planMutation.mutate({ businessId: row.businessId!, planId: value as PlanId })
                        }
                      >
                        <SelectTrigger className="h-8 w-[190px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PLAN_LABELS).map(([id, label]) => (
                            <SelectItem key={id} value={id}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">No business</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{row.websiteStatus ?? "none"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {row.slug ? (
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                          <a href={`/s/${row.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" /> Site
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setResetFor({ userId: row.userId, email: row.email })}
                      >
                        <KeyRound className="h-3.5 w-3.5" /> Password
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive"
                        onClick={() => {
                          setDeleteFor({ userId: row.userId, email: row.email });
                          setConfirmDelete(false);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create test account</DialogTitle>
            <DialogDescription>
              The account is ready immediately — no confirmation email and no payment needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-password">Password</Label>
              <Input
                id="demo-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-business">Business name</Label>
              <Input
                id="demo-business"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={planId} onValueChange={(value) => setPlanId(value as PlanId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_LABELS).map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                createMutation.isPending ||
                !email.includes("@") ||
                password.length < 8 ||
                businessName.trim().length < 2
              }
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Creating…" : "Create account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetFor)} onOpenChange={(o) => !o && setResetFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New password</DialogTitle>
            <DialogDescription>{resetFor?.email}</DialogDescription>
          </DialogHeader>
          <Input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={newPassword.length < 8 || passwordMutation.isPending}
              onClick={() => passwordMutation.mutate()}
            >
              Set password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteFor)} onOpenChange={(o) => !o && setDeleteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete test account</DialogTitle>
            <DialogDescription>
              {deleteFor?.email} and its demo website will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={confirmDelete}
              onCheckedChange={(value) => setConfirmDelete(value === true)}
            />
            <span>I understand this cannot be undone.</span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFor(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!confirmDelete || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
