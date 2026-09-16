import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCircle2, PauseCircle, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { listPlatformUsers, type PlatformUser } from "@/lib/users.functions";
import { deleteUserAccount } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const ADMIN_USERS_KEY = ["admin-users"] as const;
const SEEN_KEY = "ww-admin-notifications-seen";


export function useAdminUsers(enabled: boolean) {
  const load = useServerFn(listPlatformUsers);
  return useQuery({
    queryKey: ADMIN_USERS_KEY,
    enabled,
    refetchInterval: 60_000,
    queryFn: () => load({ data: undefined }),
  });
}

function when(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

/** Staff-only bell: new sign ups, finished questionnaires and drop-offs. */
export function AdminNotificationBell({ enabled }: { enabled: boolean }) {
  const users = useAdminUsers(enabled);
  const [seenAt, setSeenAt] = useState<string>(() => {
    try {
      return localStorage.getItem(SEEN_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const items = users.data?.notifications ?? [];
  const unread = items.filter((item) => item.at > seenAt).length;

  function markSeen() {
    const newest = items[0]?.at ?? new Date().toISOString();
    try {
      localStorage.setItem(SEEN_KEY, newest);
    } catch {
      /* storage blocked — the bell still works for this visit */
    }
    setSeenAt(newest);
  }

  return (
    <Popover onOpenChange={(open) => open && markSeen()}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2">
          <Bell className="h-4 w-4" />
          Activity
          {unread > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          Customer activity
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nothing new right now.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 border-b border-border/60 px-4 py-3 last:border-0">
                <span className="mt-0.5 text-muted-foreground">
                  {item.kind === "signup" ? (
                    <UserPlus className="h-4 w-4" />
                  ) : item.kind === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <PauseCircle className="h-4 w-4 text-amber-600" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="break-words text-xs text-muted-foreground">{item.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{when(item.at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function statusLabel(user: PlatformUser) {
  if (user.onboarding?.completed || user.business?.completed) return "Finished setup";
  if (user.onboarding) {
    const step = user.onboarding.stepIndex + 1;
    const total = user.onboarding.totalSteps || "?";
    return `Stopped at step ${step} of ${total}`;
  }
  return "Signed up, not started";
}

/** Every account, how far they got and what they answered. */
export function AdminUsersTab({ enabled }: { enabled: boolean }) {
  const users = useAdminUsers(enabled);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<PlatformUser | null>(null);
  const [toDelete, setToDelete] = useState<PlatformUser | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();
  const removeUser = useServerFn(deleteUserAccount);

  const deletion = useMutation({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Account deleted for good");
      setToDelete(null);
      setConfirmed(false);
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Could not delete that account"),
  });


  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const all = users.data?.users ?? [];
    if (!query) return all;
    return all.filter((user) =>
      `${user.email} ${user.fullName ?? ""} ${user.business?.name ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [users.data, search]);

  if (users.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading users…</p>;
  }
  if (users.error) {
    return <p className="text-sm text-destructive">Could not load users.</p>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search users by email, name or business"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Questionnaire</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Last seen</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-t border-border/70">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.fullName ?? user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.isStaff ? (
                    <Badge variant="secondary" className="mt-1">
                      Staff
                    </Badge>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {user.business ? (
                    <>
                      <p>{user.business.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.business.niche.replaceAll("_", " ")}
                        {user.websiteStatus ? ` · ${user.websiteStatus}` : ""}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p>{statusLabel(user)}</p>
                  {user.onboarding && !user.onboarding.completed ? (
                    <p className="text-xs text-muted-foreground">
                      {user.onboarding.lastStepLabel ?? user.onboarding.lastStep}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {user.plan ? `${user.plan.id} · ${user.plan.status}` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{when(user.createdAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.lastSignInAt ? when(user.lastSignInAt) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setOpen(user)}>
                    Answers
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  No users match that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(open)} onOpenChange={(value) => !value && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.fullName ?? open?.email}</DialogTitle>
          </DialogHeader>
          {open ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{statusLabel(open)}</p>
              {open.onboarding && Object.keys(open.onboarding.answers).length > 0 ? (
                <dl className="space-y-2">
                  {Object.entries(open.onboarding.answers).map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-muted-foreground">
                  No answers recorded yet for this account.
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
