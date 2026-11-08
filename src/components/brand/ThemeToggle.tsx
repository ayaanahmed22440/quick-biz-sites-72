import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Segmented Light / Dark / System switch. */
export function ThemeToggle({
  className,
  showLabels = false,
  tone = "default",
}: {
  className?: string;
  showLabels?: boolean;
  tone?: "default" | "sidebar";
}) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border p-0.5",
        tone === "sidebar" ? "border-sidebar-border bg-sidebar-accent/40" : "border-border bg-muted/60",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-all",
              showLabels && "flex-1 px-3",
              tone === "sidebar"
                ? active
                  ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                : active
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {showLabels ? label : null}
          </button>
        );
      })}
    </div>
  );
}
