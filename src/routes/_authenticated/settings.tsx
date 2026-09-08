import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, workspaceQueryKey } from "@/hooks/useWorkspace";
import { LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account settings — WebWarheads" },
      { name: "description", content: "Manage your WebWarheads account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (workspace?.fullName) setFullName(workspace.fullName);
  }, [workspace?.fullName]);

  if (isLoading) return <LoadingBlock rows={3} />;

  async function saveName() {
    const value = fullName.trim();
    if (value.length < 2) {
      toast.error("Enter your name");
      return;
    }
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: value })
      .eq("id", workspace!.userId);
    setSavingName(false);
    if (error) {
      toast.error("We couldn't save your name.");
      return;
    }
    toast.success("Name updated");
    await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
  }

  async function savePassword() {
    if (newPassword.length < 8) {
      toast.error("Your new password needs at least 8 characters");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      ...(currentPassword ? { current_password: currentPassword } : {}),
    } as { password: string });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    toast.success("Password updated");
  }

  return (
    <>
      <PageHeader title="Account settings" description="Your login details and profile." />

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="full-name">Your name</Label>
            <Input
              id="full-name"
              value={fullName}
              maxLength={120}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" value={workspace?.email ?? ""} disabled className="mt-1.5" />
          </div>
        </div>
        <Button onClick={saveName} disabled={savingName} className="mt-5">
          {savingName ? "Saving…" : "Save profile"}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">Change password</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <Button onClick={savePassword} disabled={savingPassword} className="mt-5">
          {savingPassword ? "Updating…" : "Update password"}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          If you signed in with Google, you can set a password here to also log in with email.
        </p>
      </div>
    </>
  );
}
