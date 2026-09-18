const BADGES: ReadonlyArray<{
  href: string;
  alt: string;
  src: string;
  width?: number;
  height?: number;
  loading?: "lazy";
}> = [
  {
    href: "https://tinylaunch.com",
    src: "https://tinylaunch.com/tinylaunch_badge_launching_soon.svg",
    alt: "TinyLaunch Badge",
    width: 202,
    height: 56,
    loading: "lazy",
  },
  {
    href: "https://appalist.com/ai/webwarheads",
    src: "https://appalist.com/assets/images/badge.png",
    alt: "Appa List",
    height: 54,
    loading: "lazy",
  },
  {
    href: "https://submitmysaas.com",
    src: "https://submitmysaas.com/featured-badge.png",
    alt: "Featured on SubmitMySaas",
    height: 54,
    loading: "lazy",
  },
  {
    href: "https://neeed.directory/products/webwarheads?utm_source=webwarheads",
    src: "https://neeed.directory/badges/neeed-badge-light.svg",
    alt: "Featured on neeed.directory",
    width: 139,
    height: 44,
    loading: "lazy",
  },
  {
    href: "https://openhunts.com",
    src: "https://cdn.openhunts.com/badges/club.webp",
    alt: "OpenHunts Club Member",
    width: 195,
    height: 105,
    loading: "lazy",
  },
  {
    href: "https://thesaasdir.com/product/webwarheads?ref=badge",
    src: "https://thesaasdir.com/badge/webwarheads.svg",
    alt: "Featured on TheSaaSDir",
    width: 160,
    height: 44,
    loading: "lazy",
  },
  {
    href: "https://turbo0.com/item/webwarheads",
    src: "https://img.turbo0.com/badge-listed-light.svg",
    alt: "Listed on Turbo0",
    height: 54,
    loading: "lazy",
  },
  {
    href: "https://findly.tools/webwarheads?utm_source=webwarheads",
    src: "https://findly.tools/badges/findly-tools-badge-light.svg",
    alt: "Featured on Findly.tools",
    width: 175,
    height: 55,
    loading: "lazy",
  },
  {
    href: "https://toolfame.com/item/webwarheads",
    src: "https://toolfame.com/badge-light.svg",
    alt: "Featured on toolfame.com",
    height: 54,
    loading: "lazy",
  },
  {
    href: "https://letslaunch.today/product/webwarheads",
    src: "https://letslaunch.today/badge/webwarheads.svg",
    alt: "WebWarheads on LetsLaunch",
    width: 250,
    height: 54,
    loading: "lazy",
  },
  {
    href: "https://tools.cafe",
    src: "https://tools.cafe/b/light.svg",
    alt: "Featured on tools.cafe",
    width: 256,
    height: 80,
    loading: "lazy",
  },
  {
    href: "https://saasfame.com/item/webwarheads",
    src: "https://saasfame.com/badge-light.svg",
    alt: "Featured on saasfame.com",
    height: 54,
    loading: "lazy",
  },
];

export function FeaturedOnSection() {
  return (
    <section aria-label="Featured on" className="bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Featured on
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {BADGES.map(({ href, alt, src, width, height, loading }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center opacity-80 transition-[opacity,transform] duration-200 hover:-translate-y-0.5 hover:opacity-100 focus-visible:opacity-100"
            >
              <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                loading={loading}
                className="h-auto max-w-full"
                style={
                  width && height
                    ? undefined
                    : height
                      ? { height, width: "auto" }
                      : { width, height: "auto" }
                }
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
