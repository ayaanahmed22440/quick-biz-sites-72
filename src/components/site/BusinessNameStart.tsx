import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Optional analytics/pixel hook fired on a valid submit, replacing the old CTA click. */
  onSubmitTrack?: (businessName: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Shared landing-page starter: the visitor types their business name and is taken
 * straight into onboarding with that name already filled in.
 */
export function BusinessNameStart({
  onSubmitTrack,
  placeholder = "Enter your business name...",
  className,
}: Props) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        className="flex items-center gap-2 rounded-full border border-border bg-card p-2 pl-5 shadow-lg shadow-navy/10 transition-shadow focus-within:border-accent/50 focus-within:shadow-xl"
      >
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          aria-label="Your business name"
          className="h-11 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Start building my website"
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-all duration-300 hover:bg-accent/90"
        >
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </form>
      <p className={cn("mt-2 text-xs", error ? "text-destructive" : "text-muted-foreground")}>
        {error ?? "Type your business name and press Enter"}
      </p>
    </div>
  );
}
