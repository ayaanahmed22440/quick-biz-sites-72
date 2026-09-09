import type {
  TemplateArea,
  TemplateBusiness,
  TemplateHour,
  TemplateReview,
  TemplateService,
} from "@/components/templates/LocalBusinessTemplate";

export type TemplatePreviewData = {
  business: TemplateBusiness;
  services: TemplateService[];
  areas: TemplateArea[];
  hours: TemplateHour[];
  reviews: TemplateReview[];
};

const HOURS: TemplateHour[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day_of_week: day,
  opens_at: day === 0 ? null : "08:00",
  closes_at: day === 0 ? null : day === 6 ? "14:00" : "18:00",
  is_closed: day === 0,
}));

function preview(
  business: TemplateBusiness,
  serviceNames: [string, string, string, string],
  areaNames: [string, string, string, string],
  review: Pick<TemplateReview, "author_name" | "location" | "quote">,
): TemplatePreviewData {
  return {
    business,
    services: serviceNames.map((name, index) => ({
      id: `service-${index + 1}`,
      name,
      description: `Professional ${name.toLowerCase()} delivered by an experienced local team, with clear communication from start to finish.`,
      price_note: index === 0 ? "Free estimate" : "Quoted for your project",
    })),
    areas: areaNames.map((city, index) => ({ id: `area-${index + 1}`, city, state: business.state })),
    hours: HOURS,
    reviews: [{ id: "review-1", rating: 5, source: "Google", ...review }],
  };
}

export const TEMPLATE_PREVIEW_DATA = {
  cleaning: preview(
    {
      name: "Sparkle & Shine Cleaning Co.",
      tagline: "Spotless homes, happy customers",
      phone: "(704) 555-0142",
      email: "hello@sparkleandshine.example",
      city: "Charlotte",
      state: "NC",
      address_line1: "1420 South Boulevard",
      postal_code: "28203",
      logo_url: null,
    },
    ["Regular house cleaning", "Deep cleaning", "Move-in / move-out cleaning", "Office cleaning"],
    ["Charlotte", "Matthews", "Huntersville", "Concord"],
    { author_name: "Danielle Brooks", location: "Charlotte, NC", quote: "The house looked immaculate, and the whole process was easy from the first call." },
  ),
  landscaping: preview(
    {
      name: "Greenline Landscapes",
      tagline: "Outdoor spaces made for living",
      phone: "(512) 555-0186",
      email: "hello@greenline.example",
      city: "Austin",
      state: "TX",
      address_line1: "8502 Burnet Road",
      postal_code: "78757",
      logo_url: null,
    },
    ["Landscape design", "Lawn care", "Patios & pathways", "Garden maintenance"],
    ["Austin", "Round Rock", "Cedar Park", "Pflugerville"],
    { author_name: "Marcus Hill", location: "Austin, TX", quote: "Greenline turned an unused yard into the place our family spends every evening." },
  ),
  roofing: preview(
    {
      name: "Summit Roofing Co.",
      tagline: "Protection built to last",
      phone: "(303) 555-0171",
      email: "team@summitroofing.example",
      city: "Denver",
      state: "CO",
      address_line1: "4600 Brighton Boulevard",
      postal_code: "80216",
      logo_url: null,
    },
    ["Roof inspections", "Storm damage repair", "Roof replacement", "Gutter systems"],
    ["Denver", "Lakewood", "Aurora", "Arvada"],
    { author_name: "Alex Ramirez", location: "Lakewood, CO", quote: "They explained every option, finished on schedule and left the property spotless." },
  ),
  plumbing: preview(
    {
      name: "Blueflow Plumbing",
      tagline: "Fast answers. Lasting repairs.",
      phone: "(602) 555-0138",
      email: "service@blueflow.example",
      city: "Phoenix",
      state: "AZ",
      address_line1: "211 East Camelback Road",
      postal_code: "85012",
      logo_url: null,
    },
    ["Emergency plumbing", "Drain cleaning", "Water heater service", "Bathroom installation"],
    ["Phoenix", "Scottsdale", "Tempe", "Glendale"],
    { author_name: "Olivia Chen", location: "Tempe, AZ", quote: "Blueflow arrived the same day, found the issue quickly and gave us a fair price." },
  ),
  renovation: preview(
    {
      name: "Form & Foundry Renovations",
      tagline: "Thoughtful homes, beautifully rebuilt",
      phone: "(615) 555-0194",
      email: "studio@formandfoundry.example",
      city: "Nashville",
      state: "TN",
      address_line1: "901 Main Street",
      postal_code: "37206",
      logo_url: null,
    },
    ["Kitchen remodeling", "Bathroom renovation", "Home additions", "Whole-home remodeling"],
    ["Nashville", "Franklin", "Brentwood", "Hendersonville"],
    { author_name: "Sophie Grant", location: "Franklin, TN", quote: "The team understood how we wanted to live and made every detail feel intentional." },
  ),
  construction: preview(
    {
      name: "Ironwood Construction",
      tagline: "Built with purpose",
      phone: "(404) 555-0162",
      email: "projects@ironwood.example",
      city: "Atlanta",
      state: "GA",
      address_line1: "1776 Marietta Boulevard",
      postal_code: "30318",
      logo_url: null,
    },
    ["Custom homes", "Commercial build-outs", "Home additions", "Project management"],
    ["Atlanta", "Decatur", "Sandy Springs", "Marietta"],
    { author_name: "James Wilson", location: "Decatur, GA", quote: "Ironwood kept a complex build organized, transparent and on budget from day one." },
  ),
  junk_removal: preview(
    {
      name: "Clearway Junk Removal",
      tagline: "Your space, cleared today",
      phone: "(813) 555-0119",
      email: "pickup@clearway.example",
      city: "Tampa",
      state: "FL",
      address_line1: "3902 North Armenia Avenue",
      postal_code: "33607",
      logo_url: null,
    },
    ["Same-day pickup", "Furniture removal", "Property cleanouts", "Construction debris"],
    ["Tampa", "Brandon", "Clearwater", "St. Petersburg"],
    { author_name: "Rachel Foster", location: "Tampa, FL", quote: "Clearway was quick, friendly and cleared the entire garage in under an hour." },
  ),
} satisfies Record<string, TemplatePreviewData>;

export function previewDataFor(niche: string): TemplatePreviewData {
  if (niche in TEMPLATE_PREVIEW_DATA) {
    return TEMPLATE_PREVIEW_DATA[niche as keyof typeof TEMPLATE_PREVIEW_DATA];
  }
  return TEMPLATE_PREVIEW_DATA.cleaning;
}