import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { defaultServicesForNiche } from "@/lib/template-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Row = { name: string; description: string };

/** Add, edit and remove the services shown on the website. */
export function ServicesEditor({
  businessId,
  niche,
  services,
}: {
  businessId: string;
  niche: string;
  services: Array<{ name: string; description: string | null }>;
}) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(services.map((s) => ({ name: s.name, description: s.description ?? "" })));
  }, [services]);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  async function save(next: Row[] = rows) {
    setSaving(true);
    const clean = next.filter((r) => r.name.trim()).slice(0, 20);
    const { error: delError } = await supabase.from("services").delete().eq("business_id", businessId);
    const { error } = clean.length
      ? await supabase.from("services").insert(
          clean.map((r, i) => ({
            business_id: businessId,
            name: r.name.trim().slice(0, 120),
            description: r.description.trim().slice(0, 500) || null,
            sort_order: i,
          })),
        )
      : { error: null };
    setSaving(false);
    if (delError || error) {
      toast.error("We couldn't save your services. Please try again.");
      return;
    }
    toast.success("Services saved");
    await queryClient.invalidateQueries({ queryKey: ["website-editor", businessId] });
    await queryClient.invalidateQueries({ queryKey: ["business", businessId] });
  }

  return (
    <div className="space-y-3">
      <Label>Your services</Label>
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          No services yet, so this part of your website is hidden.
          <Button
            size="sm"
            variant="outline"
            className="mt-2 w-full"
            disabled={saving}
            onClick={() => {
              const defaults = defaultServicesForNiche(niche || "cleaning").map((name) => ({ name, description: "" }));
              setRows(defaults);
              void save(defaults);
            }}
          >
            Add the 4 starter services for your trade
          </Button>
        </div>
      ) : null}
      {rows.map((row, i) => (
        <div key={i} className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center gap-2">
            <Input
              value={row.name}
              maxLength={120}
              placeholder={`Service ${i + 1}`}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Remove service"
              className="shrink-0"
              onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            rows={2}
            maxLength={500}
            value={row.description}
            placeholder="Short description (optional)"
            onChange={(e) => update(i, { description: e.target.value })}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={rows.length >= 20}
          onClick={() => setRows((r) => [...r, { name: "", description: "" }])}
        >
          <Plus className="mr-2 h-4 w-4" /> Add service
        </Button>
        <Button type="button" className="flex-1" disabled={saving} onClick={() => void save()}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save services
        </Button>
      </div>
    </div>
  );
}
