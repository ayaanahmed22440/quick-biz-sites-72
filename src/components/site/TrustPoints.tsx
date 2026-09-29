import { CodeXml, Hammer, Eye, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRIAL_LABEL } from "@/lib/plans";

const POINTS = [
  { label: TRIAL_LABEL, Icon: CalendarClock },
  { label: "Preview before you pay", Icon: Eye },
  { label: "No coding", Icon: CodeXml },
  { label: "No developer", Icon: Hammer },
] as const;


/**
 * Trust points under the hero starter input. Stacks as a centered list on
 * mobile, spreads into an evenly-spaced row from `sm` up.
 */
export function TrustPoints({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "grid justify-items-center gap-2.5 text-sm font-semibold text-foreground sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6 sm:gap-y-2",
        className,
      )}
    >
      {POINTS.map(({ label, Icon }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}
