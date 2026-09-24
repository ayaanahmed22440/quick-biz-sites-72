import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Optional analytics/pixel hook fired on a valid submit, replacing the old CTA click. */
  onSubmitTrack?: (businessName: string) => void;
  placeholder?: string;
  className?: string;
};

const EXAMPLE_NAMES = ["Sparkle Clean Co.", "Apex Roofing", "GreenScape Landscaping"];

/**
 * Shared landing-page starter: the visitor types their business name and is taken
 * straight into onboarding with that name already filled in.
 *
 * While the input is empty and unfocused, an animated caret types through example
 * business names; the animation stops as soon as the visitor focuses or types.
 */
export function BusinessNameStart({
  onSubmitTrack,
  placeholder = "Enter your business name...",
  className,
}: Props) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const listener = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  const animating = value === "" && !focused && !reducedMotion;

  useEffect(() => {
    if (!animating) {
      setTyped("");
      return;
    }
    let nameIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer: number;

    const tick = () => {
      const current = EXAMPLE_NAMES[nameIndex] ?? "Sparkle Clean Co.";
      if (!deleting) {
        charIndex += 1;
        setTyped(current.slice(0, charIndex));
        if (charIndex >= current.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1700);
          return;
        }
        timer = window.setTimeout(tick, 60 + Math.random() * 45);
        return;
      }
      charIndex -= 1;
      setTyped(current.slice(0, charIndex));
      if (charIndex <= 0) {
        deleting = false;
        nameIndex = (nameIndex + 1) % EXAMPLE_NAMES.length;
        timer = window.setTimeout(tick, 400);
        return;
      }
      timer = window.setTimeout(tick, 28);
    };

    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, [animating]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = value.trim();
    if (name.length < 2) {
      setError("Enter your business name to continue");
      return;
    }
    setError(null);
    onSubmitTrack?.(name);
    void navigate({ to: "/onboarding", search: { name } });
  };

  return (
    <div className={cn("mx-auto w-full max-w-xl", className)}>
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-2xl border-2 border-accent/35 bg-card p-2 pl-5 shadow-lg shadow-accent/10 transition-all focus-within:border-accent focus-within:shadow-xl focus-within:shadow-accent/20"
      >
        <div className="relative min-w-0 flex-1">
          <input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            aria-label="Your business name"
            className="h-11 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          className="group flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-navy px-4 text-sm font-semibold text-navy-foreground transition-all duration-300 hover:bg-navy-muted sm:px-6"
        >
          Build my website
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </form>
      <p className={cn("mt-2 text-xs", error ? "text-destructive" : "text-muted-foreground")}>
        {error ?? "Type your business name and press Enter"}
      </p>
    </div>
  );
}

