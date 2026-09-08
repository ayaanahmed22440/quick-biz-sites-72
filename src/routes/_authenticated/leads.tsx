import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Leads — WebWarheads" },
      { name: "description", content: "Enquiries from your website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const businessId = workspace?.business?.id;

  const leads = useQuery({
    queryKey: ["leads", businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email, phone, message, status, created_at")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || (businessId && leads.isLoading)) return <LoadingBlock rows={4} />;
  if (leads.isError) return <ErrorBlock />;

  const rows = leads.data ?? [];

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every enquiry sent through your website contact form lands here."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Once your website is published, contact form enquiries appear here with the customer's name, phone and message."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.email ?? lead.phone ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-sm truncate">{lead.message ?? "—"}</TableCell>
                  <TableCell>{lead.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
