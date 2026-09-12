import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, Sparkles, Wand2 } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/preview")({
  head: () => ({
    meta: [
      { title: "Preview my website — WebWarheads" },
      {
        name: "description",
        content:
          "See your finished website before you pay a cent. Pick your trade, answer a few questions and preview a real site built for your business.",
      },
      { property: "og:title", content: "Preview my website — WebWarheads" },
      {
        property: "og:description",
        content:
          "See your finished website before you pay a cent. Pick your trade, answer a few questions and preview a real site built for your business.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://webwarheads.com/preview" },
      { property: "og:image", content: "https://webwarheads.com/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://webwarheads.com/og-cover.jpg" },
      { name: "twitter:title", content: "Preview my website — WebWarheads" },
      {
        name: "twitter:description",
        content: "See your finished website before you pay a cent.",
      },
    ],
    links: [{ rel: "canonical", href: "https://webwarheads.com/preview" }],
  }),
  component: PreviewLandingPage,
});

const steps = [
  {
    icon: Sparkles,
    title: "Pick your trade",
    body: "Cleaning, plumbing, roofing, salons and 50 more. Each one comes with its own design, photos and wording.",
  },
  {
    icon: Wand2,
    title: "Answer a few simple questions",
    body: "Your business name, services, phone number and the areas you cover. One question at a time, about five minutes.",
  },
  {
    icon: Eye,
    title: "See your real website",
    body: "Not a mock-up — the actual site, with your details in it. Change any wording or photo before anyone sees it.",
  },
];

function PreviewLandingPage() {
  return (
    <PublicLayout>
      <section className="overflow-hidden bg-background">
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-[11px] font-bold uppercase text-muted-foreground">
            <Eye className="h-3.5 w-3.5 text-accent" /> Free preview — no card needed
          </div>
          <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-bold leading-[1.05] text-foreground sm:text-6xl">
            See your website first. <span className="text-accent">Pay only if you love it.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8">
            Answer a few questions about your business and we'll build a real, finished website you
            can look at straight away. Nothing goes live and nothing is charged until you say so.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group h-12 bg-accent px-7 text-accent-foreground shadow-lg shadow-accent/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent/90"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Start my free preview{" "}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No setup fee · Takes about 5 minutes · Cancel anytime
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 text-center sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            "Built with your own details",
            "Change anything before it goes live",
            "Plans from $37 a month",
          ].map((item) => (
            <div key={item} className="flex items-center justify-center gap-2 text-sm font-semibold">
              <Check className="h-4 w-4 text-accent" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-accent">HOW THE PREVIEW WORKS</p>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
              Three short steps to a website you can actually see.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <step.icon className="h-5 w-5 text-accent" />
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ready to see yours?
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Start now and you'll be looking at your own website in a few minutes.
          </p>
          <Button
            asChild
            size="lg"
            className="group mt-8 h-12 bg-accent px-7 text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              Preview my website{" "}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
