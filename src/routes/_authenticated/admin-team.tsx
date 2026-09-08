import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MailPlus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { inviteStaff, listStaff } from "@/lib/staff.functions";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin-team")({
  head: () => ({
    meta: [
      { title: "Team access — WebWarheads Admin" },
      { name: "description", content: "Invite and review WebWarheads staff members." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTeamPage,
});

function AdminTeamPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const fetchStaff = useServerFn(listStaff);
  const sendInvite = useServerFn(inviteStaff);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const team = useQuery({
    queryKey: ["admin-team"],
    enabled: Boolean(workspace?.isAdmin),
    queryFn: () => fetchStaff(),
  });
  const invite = useMutation({
    mutationFn: () => sendInvite({ data: { email, role } }),
    onSuccess: async (result) => {
      toast.success(result.invited ? "Staff invitation sent" : "Staff access added");
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["admin-team"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not invite staff"),
  });

  if (isLoading) return <LoadingBlock />;
  if (!workspace?.isAdmin) return <ErrorBlock message="This area is for WebWarheads administrators only." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Team access" description="Invite staff and administrators to WebWarheads." />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><MailPlus className="h-4 w-4" /> Invite a team member</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              invite.mutate();
            }}
          >
            <div>
              <Label htmlFor="staff-email">Email address</Label>
              <Input id="staff-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>Access level</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "admin" | "staff")}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={invite.isPending || !email.trim()}>
              {invite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {team.isLoading ? <LoadingBlock /> : null}
      {team.isError ? <ErrorBlock message="Could not load team access." /> : null}
      {team.data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Current team</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {team.data.members.map((member) => (
                <div key={`${member.userId}-${member.role}`} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{member.name || member.email}</p>{member.name ? <p className="truncate text-xs text-muted-foreground">{member.email}</p> : null}</div>
                  <Badge variant="secondary">{member.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Invitations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {team.data.invitations.length === 0 ? <p className="text-sm text-muted-foreground">No invitations yet.</p> : team.data.invitations.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{item.email}</p><p className="text-xs text-muted-foreground">{item.accepted_at ? "Access added" : new Date(item.expires_at) < new Date() ? "Expired" : "Invitation sent"}</p></div>
                  <Badge variant="outline">{item.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}