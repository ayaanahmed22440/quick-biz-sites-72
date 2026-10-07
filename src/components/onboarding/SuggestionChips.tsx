import { Plus } from "lucide-react";
import { defaultServicesForNiche } from "@/lib/template-registry";

/** Ready-made lines people can tap to add to their "why pick you" answer. */
export const DESCRIPTION_SUGGESTIONS = [
  "Family-owned and locally operated.",
  "Fully licensed and insured.",
  "Upfront pricing with no hidden fees.",
  "Free, no-obligation quotes.",
  "100% satisfaction guaranteed.",
  "Same-week appointments available.",
  "Friendly, background-checked team.",
  "Hundreds of happy local customers.",
];

const EXTRA_SERVICES = ["Free estimates", "Emergency call-outs", "Commercial work", "Maintenance plans"];

/** The trade's four starter services plus a few common extras. */
export function serviceSuggestions(niche: string) {
  return [...defaultServicesForNiche(niche || "cleaning"), ...EXTRA_SERVICES];
}

export function SuggestionChips({
  label,
  items,
  onPick,
}: {
  label: string;
  items: string[];
  onPick: (value: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPick(item)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:bg-accent/10"
          >
            <Plus className="h-3 w-3 text-accent" />
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
