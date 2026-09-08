import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPublishedSite, type PublishedSite } from "@/lib/public-site.functions";
import { PublicSiteView, publicSiteMeta } from "@/components/site/PublicSiteView";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const site = (await getPublishedSite({ data: { slug: params.slug } })) as PublishedSite | null;
    if (!site) throw notFound();
    return site;
  },
  head: ({ loaderData }) => publicSiteMeta(loaderData),
  errorComponent: () => (
    <div className="p-10 text-center text-sm">This website couldn't be loaded right now.</div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm">No published website at this address yet.</div>
  ),
  component: () => {
    const site = Route.useLoaderData();
    const { slug } = Route.useParams();
    return <PublicSiteView site={site} slug={slug} />;
  },
});
