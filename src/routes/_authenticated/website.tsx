import { createFileRoute, Link } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ComingSoon, EmptyState, LoadingBlock, PageHeader } from "@/components/app/StateBlocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/website")({
  head: () => ({
    meta: [
      { title: "Your website — WebWarheads" },
      { name: "description", content: "Your WebWarheads website and editor." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WebsitePage,
});

function WebsitePage() {
  const { data: workspace, isLoading } = useWorkspace();
  if (isLoading) return <LoadingBlock rows={3} />;

  if (!workspace?.business) {
    return (
      <>
        <PageHeader title="Your website" />
        <EmptyState
          title="Add your business first"
          description="We build your website from your real business details — name, services, phone and areas covered."
          action={
            <Button asChild>
              <Link to="/onboarding">Start onboarding</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your website"
        description="Built from an approved WebWarheads template using your business details — never randomly generated."
      />
      <ComingSoon
        title="Cleaning Template 01 and the editor"
        description="The template renderer, the plain-English editor, draft and published versions, and the Save & Publish flow are the next thing we ship. Your business details are already saved and will populate the template when it lands."
      />
    </>
  );
}
