import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";
import { DOMAIN_TARGET_IP } from "@/lib/domains.functions";

export const Route = createFileRoute("/_authenticated/connect-domain")({
  head: () => ({
    meta: [
      { title: "Buy and connect your domain — WebWarheads" },
      {
        name: "description",
        content:
          "A plain-English guide to buying a domain on GoDaddy and pointing it at your WebWarheads website.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectDomainPage,
});

const BUY_STEPS = [
  {
    title: "Go to godaddy.com and search your business name",
    body: "Type the name you want in the search box — for example sparkleandshinecleaning.com. GoDaddy tells you instantly whether it's free.",
  },
  {
    title: "Pick a good name",
    body: "Short, easy to say down the phone, no hyphens or numbers. Add your town if the plain name is taken (sparklecleaningleeds.com). Stick to .com where you can; .co.uk is fine in the UK. Skip .info, .biz and .xyz — customers don't trust them.",
  },
  {
    title: "Add it to the basket and ignore the extras",
    body: "GoDaddy will offer hosting, a website builder, email and 'domain protection'. You don't need hosting or a builder — you already have us. Say no to everything except privacy protection if it's free or cheap.",
  },
  {
    title: "Pay — expect about $12 to $20 for the year",
    body: "Choose the one or two year option. Anything longer is only worth it if you're certain about the name.",
  },
  {
    title: "Turn auto-renew on",
    body: "This is the one setting that matters. If a domain lapses someone else can grab it. In GoDaddy: My Products → your domain → turn on Auto-renew.",
  },
  {
    title: "Come back here and add it",
    body: "Type the domain on your Domains page. We'll give you the two records to paste in — that's the last step.",
  },
];

const CONNECT_STEPS = [
  {
    title: "Add your domain on the Domains page",
    body: "Type it exactly as you bought it — no www, no https. We then show you two records, each with a copy button.",
  },
  {
    title: "Open the DNS screen at your provider",
    body: "GoDaddy: sign in → My Products → find your domain → DNS → Add New Record. Namecheap: Domain List → Manage → Advanced DNS. Hostinger: Domains → Manage → DNS / Nameservers. Cloudflare: pick the domain → DNS → Add record (set the cloud icon to grey/DNS-only).",
  },
  {
    title: "Add the first record — your plain domain",
    body: `Type: A. Name (or Host): @. Value (or Points to): ${DOMAIN_TARGET_IP}. TTL: 1 hour or default. If an A record for @ already exists, edit that one rather than creating a second.`,
  },
  {
    title: "Add the second record — the www version",
    body: `Type: A. Name: www. Value: ${DOMAIN_TARGET_IP}. TTL: default. If there's already a CNAME for www, delete it first — two records for the same name fight each other.`,
  },
  {
    title: "Save, then press 'Check my records'",
    body: "Back on your Domains page, hit the check button. It tells you straight away whether the records are visible yet. Between ten minutes and a couple of hours is normal.",
  },
  {
    title: "We turn the padlock on",
    body: "Once your domain reaches us we set up the security certificate automatically, so visitors see https with no warnings. We email you the moment it's live.",
  },
];

function StepList({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="mt-4 space-y-4">
      {steps.map((step, index) => (
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
  );
}

function ConnectDomainPage() {
  const { data: workspace } = useWorkspace();
  const slug = workspace?.business?.slug;

  return (
    <>
      <PageHeader
        title="Getting your website its own address"
        description="Buy a name on GoDaddy, or connect one you already own. Both take about five minutes."
      />

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Watch the walkthrough</h2>
        <div className="mt-3 flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-center">
          <div className="px-6">
            <PlayCircle className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium">Video coming shortly</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A short screen recording showing exactly where to click. The written steps below cover
              the same thing.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Option 1 — buy a domain on GoDaddy</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You buy the name in your own name, so you own it outright. We never charge you for it and
          never hold it for you.
        </p>
        <StepList steps={BUY_STEPS} />
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="https://www.godaddy.com/domains" target="_blank" rel="noreferrer">
              Search names on GoDaddy
            </a>
          </Button>
          <Button asChild>
            <Link to="/domains">I've bought it — connect it now</Link>
          </Button>
        </div>
      </section>

      <section id="connect" className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Option 2 — connect a domain you already own</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Works with any provider — GoDaddy, Namecheap, Hostinger, Cloudflare, 123-reg and the rest.
        </p>
        <StepList steps={CONNECT_STEPS} />
        <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm font-medium">The two records, for reference</p>
          <p className="mt-2 font-mono text-sm">A &nbsp; @ &nbsp; {DOMAIN_TARGET_IP}</p>
          <p className="mt-1 font-mono text-sm">A &nbsp; www &nbsp; {DOMAIN_TARGET_IP}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Your own page shows these with copy buttons so you don't have to retype anything.
          </p>
        </div>
        <Button asChild className="mt-5">
          <Link to="/domains">Add my domain</Link>
        </Button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Option 3 — use your free WebWarheads address</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No domain, no problem. Every WebWarheads site comes with a free address you can put on
          business cards, vans and Facebook straight away, and you can attach your own name later
          without rebuilding anything.
        </p>
        {slug ? (
          <p className="mt-3 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
            webwarheads.com/{slug}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Finish your business details and we'll reserve your free address.
          </p>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Stuck at any point?{" "}
        <Link to="/support" className="text-accent hover:underline">
          Message support
        </Link>{" "}
        and we'll do it with you on a call.
      </p>
    </>
  );
}
