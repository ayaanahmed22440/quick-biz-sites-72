import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon, PageHeader } from "@/components/app/StateBlocks";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — WebWarheads" },
      { name: "description", content: "Real visitor and enquiry numbers for your website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Real numbers only — nothing here is estimated or invented."
      />
      <ComingSoon
        title="Visitor and enquiry reporting"
        description="Once your website is live we record page views and enquiries from your own site. Until there is real traffic there is nothing honest to show, so this stays empty."
      />
    </>
  );
}
