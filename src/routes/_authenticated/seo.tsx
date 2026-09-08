import { createFileRoute } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { can } from "@/lib/plans";
import { ComingSoon, LoadingBlock, PageHeader, UpgradePrompt } from "@/components/app/StateBlocks";

export const Route = createFileRoute("/_authenticated/seo")({
  head: () => ({
    meta: [
      { title: "SEO — WebWarheads" },
      { name: "description", content: "Local SEO settings for your website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SeoPage,
});

function SeoPage() {
  const { data: workspace, isLoading } = useWorkspace();
  if (isLoading) return <LoadingBlock rows={3} />;

  const unlocked = workspace ? can(workspace.entitlements, "seo") : false;

  return (
    <>
      <PageHeader
        title="SEO"
        description="Helping local customers find you when they search for your service."
      />
      {unlocked ? (
        <ComingSoon
          title="Local SEO dashboard"
          description="Keyword targets built from your real services and cities, page titles and descriptions, structured data, sitemap and indexing status. We never promise rankings — only the work that gives you the best chance."
        />
      ) : (
        <UpgradePrompt
          title="SEO is part of the $68 plan"
          description="Local keyword targeting, service and location page optimisation, structured data, sitemap and indexing setup are included from the Website + SEO plan up."
          plan="seo"
        />
      )}
    </>
  );
}
