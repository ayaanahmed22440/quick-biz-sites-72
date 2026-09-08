import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon, PageHeader } from "@/components/app/StateBlocks";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => ({
    meta: [
      { title: "Media — WebWarheads" },
      { name: "description", content: "Your logo and website images." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  return (
    <>
      <PageHeader title="Media" description="Your logo and the photos used on your website." />
      <ComingSoon
        title="Logo and image library"
        description="Uploading, cropping and choosing images for each part of your website ships with the template editor."
      />
    </>
  );
}
