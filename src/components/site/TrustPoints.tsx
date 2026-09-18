import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const POINTS = ["No coding", "No developer", "Preview before you pay"] as const;

/**
 * Trust checkmarks under the hero starter input. Stacks as a centered list on
 * mobile, spreads into an evenly-spaced row from `sm` up.
 */
export function TrustPoints({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center", className)}>
      <ul className="flex flex-col items-start gap-3 text-sm font-semibold text-foreground sm:flex-row sm:items-center sm:gap-x-6 sm:gap-y-2">
        {POINTS.map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <Check className="h-4 w-4 shrink-0 text-success" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
