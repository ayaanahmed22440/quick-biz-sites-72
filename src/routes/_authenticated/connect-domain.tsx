import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/connect-domain")({
  head: () => ({
    meta: [
      { title: "How to connect your domain — WebWarheads" },
      {
        name: "description",
        content: "Step-by-step help for pointing your own domain at your WebWarheads website.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectDomainPage,
});

const STEPS = [
  {
    title: "Log in where you bought your domain",
    body: "That's whoever you pay for the name each year — GoDaddy, Namecheap, Hostinger, Google Domains and so on. Look for a section called DNS, Domain settings or Manage DNS.",
  },
  {
    title: "Add the two records we give you",
    body: "On the Domains page, add your domain and we show you the exact records to paste in. There are only two: one for your plain domain, one for the www version.",
  },
  {
    title: "Save and come back",
    body: "Changes usually take between ten minutes and a few hours to spread across the internet. We keep checking for you and email you the moment your site is live on your own name.",
  },
  {
    title: "We turn on the padlock",
    body: "Once your domain points to us we set up the security certificate automatically, so visitors see https and no warnings. You don't have to do anything.",
  },
];

function ConnectDomainPage() {
  const { data: workspace } = useWorkspace();
  const slug = workspace?.business?.slug;

  return (
    <>
      <PageHeader
        title="Getting your website its own address"
        description="Two options: use a domain you already own, or use a free WebWarheads address today and swap later."
      />

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Watch the walkthrough</h2>
        <div className="mt-3 flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-center">
          <div className="px-6">
            <PlayCircle className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium">Video coming shortly</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A short screen recording showing exactly where to click at your domain provider. The
              written steps below cover the same thing.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Option 1 — use the domain you already own</h2>
        <ol className="mt-4 space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button asChild className="mt-5">
          <Link to="/domains">Add my domain</Link>
        </Button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Option 2 — use a free WebWarheads address</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No domain, no problem. Every WebWarheads site comes with its own free address you can put
          on business cards, vans and Facebook straight away. You can attach your own domain later
          without rebuilding anything.
        </p>
        {slug ? (
          <p className="mt-3 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
            {slug}.webwarheads.com
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Finish your business details and we'll reserve your free address.
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Your site is already reachable at {slug ? `/s/${slug}` : "your WebWarheads link"} while
          the friendly address finishes setting up.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        Stuck at any point? <Link to="/support" className="text-accent hover:underline">Message support</Link>{" "}
        and we'll do it with you on a call.
      </p>
    </>
  );
}
