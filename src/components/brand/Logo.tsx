import { Link } from "@tanstack/react-router";
import logo from "@/assets/webwarheads-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Renders the wordmark next to the mark. */
  showWordmark?: boolean;
  /** Wordmark color context. */
  tone?: "light" | "dark";
  to?: string;
};

export function Logo({ className, showWordmark = true, tone = "dark", to = "/" }: LogoProps) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src={logo.url}
        alt="WebWarheads"
        className="h-8 w-8 rounded-md object-cover"
        width={32}
        height={32}
      />
      {showWordmark ? (
        <span
          className={cn(
            "text-[15px] font-extrabold tracking-tight",
            tone === "light" ? "text-navy-foreground" : "text-navy",
          )}
        >
          Web<span className="text-accent">Warheads</span>
        </span>
      ) : null}
    </Link>
  );
}
