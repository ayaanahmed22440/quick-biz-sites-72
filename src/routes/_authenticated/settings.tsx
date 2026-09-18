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
import { Switch } from "@/components/ui/switch";
import { getConsent, setConsent } from "@/lib/consent";
import { startMetaPixel } from "@/lib/meta-pixel";

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
  const [adMeasurement, setAdMeasurement] = useState(true);

  useEffect(() => {
    if (workspace?.fullName) setFullName(workspace.fullName);
  }, [workspace?.fullName]);

  useEffect(() => {
    setAdMeasurement(getConsent() !== "essential");
  }, []);

  function updateAdMeasurement(enabled: boolean) {
    setAdMeasurement(enabled);
    setConsent(enabled ? "accepted" : "essential");
    if (enabled) void startMetaPixel();
    toast.success(enabled ? "Ad measurement enabled" : "Ad measurement disabled");
  }

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
        <div className="flex items-center justify-between gap-6">
          <div>
            <Label htmlFor="ad-measurement" className="text-sm font-semibold">
              Ad measurement
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Allow WebWarheads to measure advertising performance on this device.
            </p>
          </div>
          <Switch
            id="ad-measurement"
            checked={adMeasurement}
            onCheckedChange={updateAdMeasurement}
            aria-label="Allow advertising measurement"
          />
        </div>
      </div>
    </>
  );
}
