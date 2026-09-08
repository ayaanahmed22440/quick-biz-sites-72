import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ComingSoon, EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/domains")({
  head: () => ({
    meta: [
      { title: "Domains — WebWarheads" },
      { name: "description", content: "Connect your domain to your WebWarheads website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DomainsPage,
});

function DomainsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;

  const domains = useQuery({
    queryKey: ["domains", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select("id, hostname, kind, status, is_primary")
        .eq("business_id", businessId!);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <LoadingBlock rows={3} />;
  if (domains.isError) return <ErrorBlock />;

  const rows = domains.data ?? [];

  return (
    <>
      <PageHeader
        title="Domains"
        description="Use a domain you already own, or a free WebWarheads address while you decide."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No domain connected yet"
          description="Once your website is published you'll get step-by-step instructions for pointing your domain at it, plus a temporary WebWarheads address to use in the meantime."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="font-medium">{d.hostname}</span>
              <Badge variant="secondary">{d.status}</Badge>
              {d.is_primary ? <Badge>Primary</Badge> : null}
            </li>
          ))}
        </ul>
      )}
      <ComingSoon
        title="Guided domain connection"
        description="DNS instructions, verification checks and SSL status arrive with the publishing engine. We never buy a domain on your behalf without you doing it yourself at your registrar."
      />
    </>
  );
}
