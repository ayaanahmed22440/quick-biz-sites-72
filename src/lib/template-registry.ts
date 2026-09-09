/**
 * WebWarheads template registry.
 *
 * Every approved design is a preset: imagery, colours, layout variant and
 * starter copy. Customer business data is kept completely separate — the same
 * engine renders any preset with any business attached to it.
 */

import cleaningHero from "@/assets/templates/cleaning-hero.jpg";
import cleaningAbout from "@/assets/templates/cleaning-about.jpg";
import cleaningG1 from "@/assets/templates/cleaning-gallery-1.jpg";
import cleaningG2 from "@/assets/templates/cleaning-gallery-2.jpg";
import landscapingHero from "@/assets/templates/landscaping-hero.jpg";
import landscapingAbout from "@/assets/templates/landscaping-about.jpg";
import landscapingG1 from "@/assets/templates/landscaping-gallery-1.jpg";
import landscapingG2 from "@/assets/templates/landscaping-gallery-2.jpg";
import roofingHero from "@/assets/templates/roofing-hero.jpg";
import roofingAbout from "@/assets/templates/roofing-about.jpg";
import roofingG1 from "@/assets/templates/roofing-gallery-1.jpg";
import roofingG2 from "@/assets/templates/roofing-gallery-2.jpg";
import plumbingHero from "@/assets/templates/plumbing-hero.jpg";
import plumbingAbout from "@/assets/templates/plumbing-about.jpg";
import plumbingG1 from "@/assets/templates/plumbing-gallery-1.jpg";
import plumbingG2 from "@/assets/templates/plumbing-gallery-2.jpg";
import renovationHero from "@/assets/templates/renovation-hero.jpg";
import renovationAbout from "@/assets/templates/renovation-about.jpg";
import renovationG1 from "@/assets/templates/renovation-gallery-1.jpg";
import renovationG2 from "@/assets/templates/renovation-gallery-2.jpg";
import constructionHero from "@/assets/templates/construction-hero.jpg";
import constructionAbout from "@/assets/templates/construction-about.jpg";
import constructionG1 from "@/assets/templates/construction-gallery-1.jpg";
import constructionG2 from "@/assets/templates/construction-gallery-2.jpg";
import junkHero from "@/assets/templates/junk-removal-hero.jpg";
import junkAbout from "@/assets/templates/junk-removal-about.jpg";
import junkG1 from "@/assets/templates/junk-removal-gallery-1.jpg";
import junkG2 from "@/assets/templates/junk-removal-gallery-2.jpg";

/** Hero arrangement. All variants are responsive and share the same sections. */
export type TemplateLayout = "split" | "overlay" | "banner";

export type TemplatePreset = {
  templateId: string;
  /** Matches the `niche` stored on the business row. */
  niche: string;
  name: string;
  industryLabel: string;
  description: string;
  accent: string;
  layout: TemplateLayout;
  images: { hero: string; about: string; gallery: string[] };
  copy: {
    service: string;
    trustPoints: string[];
    servicesHeading: string;
    servicesIntro: string;
    galleryHeading: string;
    galleryIntro: string;
    serviceQuestion: string;
    quoteHeading: string;
    quoteIntro: string;
    cta: string;
  };
};

function preset(p: TemplatePreset): TemplatePreset {
  return p;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  preset({
    templateId: "cleaning-01",
    niche: "cleaning",
    name: "Cleaning 01 — Fresh Split",
    industryLabel: "Cleaning company",
    description: "Bright, trust-led layout with the quote form beside the headline.",
    accent: "#1f6feb",
    layout: "split",
    images: { hero: cleaningHero, about: cleaningAbout, gallery: [cleaningG1, cleaningG2] },
    copy: {
      service: "cleaning",
      trustPoints: ["Insured and vetted cleaners", "Clear fixed pricing", "Local, family-run team"],
      servicesHeading: "What we clean",
      servicesIntro: "Every job is quoted properly. No surprise charges at the end.",
      galleryHeading: "Recent work",
      galleryIntro: "A look at the standard we leave behind.",
      serviceQuestion: "What do you need cleaned?",
      quoteHeading: "Get your free quote",
      quoteIntro: "Tell us what needs cleaning and when suits you. We'll reply with a price.",
      cta: "Get a free quote",
    },
  }),
  preset({
    templateId: "landscaping-01",
    niche: "landscaping",
    name: "Landscaping 01 — Open Air",
    industryLabel: "Landscaping & lawn care",
    description: "Full-width garden photography with a bold headline over the image.",
    accent: "#2f7d32",
    layout: "overlay",
    images: {
      hero: landscapingHero,
      about: landscapingAbout,
      gallery: [landscapingG1, landscapingG2],
    },
    copy: {
      service: "landscaping",
      trustPoints: ["Fully insured crews", "Free on-site estimates", "Tidy site, every visit"],
      servicesHeading: "What we look after",
      servicesIntro: "Lawns, borders, hard landscaping and everything in between.",
      galleryHeading: "Gardens we've built",
      galleryIntro: "Real projects from around the area.",
      serviceQuestion: "What does your garden need?",
      quoteHeading: "Book a free estimate",
      quoteIntro: "Tell us about your garden and we'll come out and price it up.",
      cta: "Book a free estimate",
    },
  }),
  preset({
    templateId: "roofing-01",
    niche: "roofing",
    name: "Roofing 01 — Storm Ready",
    industryLabel: "Roofing",
    description: "Strong, urgent layout built around emergency callouts and inspections.",
    accent: "#b3341f",
    layout: "banner",
    images: { hero: roofingHero, about: roofingAbout, gallery: [roofingG1, roofingG2] },
    copy: {
      service: "roofing",
      trustPoints: ["Licensed & insured roofers", "Free roof inspections", "Workmanship guarantee"],
      servicesHeading: "Roofing services",
      servicesIntro: "Repairs, replacements and storm damage — priced honestly.",
      galleryHeading: "Roofs we've finished",
      galleryIntro: "Recent replacements and repairs.",
      serviceQuestion: "What's happening with your roof?",
      quoteHeading: "Get a free roof inspection",
      quoteIntro: "Tell us what you've noticed and we'll take a look, free of charge.",
      cta: "Get a free inspection",
    },
  }),
  preset({
    templateId: "plumbing-01",
    niche: "plumbing",
    name: "Plumbing 01 — Call Out",
    industryLabel: "Plumbing",
    description: "Phone-first layout for urgent jobs, with the quote form right at the top.",
    accent: "#12608f",
    layout: "split",
    images: { hero: plumbingHero, about: plumbingAbout, gallery: [plumbingG1, plumbingG2] },
    copy: {
      service: "plumbing",
      trustPoints: ["Same-day emergency callouts", "Upfront pricing", "Licensed plumbers"],
      servicesHeading: "Plumbing services",
      servicesIntro: "Leaks, boilers, bathrooms and blocked drains.",
      galleryHeading: "Recent jobs",
      galleryIntro: "Clean, code-compliant work every time.",
      serviceQuestion: "What do you need help with?",
      quoteHeading: "Book a plumber",
      quoteIntro: "Tell us the problem and when suits — we'll confirm a time and a price.",
      cta: "Book a plumber",
    },
  }),
  preset({
    templateId: "renovation-01",
    niche: "renovation",
    name: "Renovation 01 — Showcase",
    industryLabel: "Renovation & remodelling",
    description: "Photo-led design that leads with finished rooms and a soft, premium feel.",
    accent: "#8a6a3a",
    layout: "overlay",
    images: {
      hero: renovationHero,
      about: renovationAbout,
      gallery: [renovationG1, renovationG2],
    },
    copy: {
      service: "renovation",
      trustPoints: ["Fixed written quotes", "One team start to finish", "Guaranteed workmanship"],
      servicesHeading: "What we remodel",
      servicesIntro: "Kitchens, bathrooms, extensions and whole-home projects.",
      galleryHeading: "Finished projects",
      galleryIntro: "Before-and-after quality you can walk into.",
      serviceQuestion: "What are you planning?",
      quoteHeading: "Talk about your project",
      quoteIntro: "Tell us what you'd like to change and we'll come back with a plan and a price.",
      cta: "Start your project",
    },
  }),
  preset({
    templateId: "construction-01",
    niche: "construction",
    name: "Construction 01 — Groundwork",
    industryLabel: "Construction & building",
    description: "Sturdy, contractor-grade layout with credentials up front.",
    accent: "#c98a12",
    layout: "banner",
    images: {
      hero: constructionHero,
      about: constructionAbout,
      gallery: [constructionG1, constructionG2],
    },
    copy: {
      service: "construction",
      trustPoints: ["Licensed & bonded", "On time, on budget", "Full project management"],
      servicesHeading: "What we build",
      servicesIntro: "New builds, extensions, groundworks and commercial fit-outs.",
      galleryHeading: "Completed builds",
      galleryIntro: "Projects delivered across the area.",
      serviceQuestion: "What are you building?",
      quoteHeading: "Request a quote",
      quoteIntro: "Send us the details and we'll price the work properly.",
      cta: "Request a quote",
    },
  }),
  preset({
    templateId: "junk-removal-01",
    niche: "junk_removal",
    name: "Junk Removal 01 — Clear Out",
    industryLabel: "Junk removal & hauling",
    description: "Fast, friendly layout built around same-day pickups and simple pricing.",
    accent: "#1f8f6a",
    layout: "split",
    images: { hero: junkHero, about: junkAbout, gallery: [junkG1, junkG2] },
    copy: {
      service: "junk removal",
      trustPoints: ["Same-day pickups", "We load everything", "Recycled wherever possible"],
      servicesHeading: "What we take away",
      servicesIntro: "Furniture, appliances, garden waste, full house clear-outs.",
      galleryHeading: "Before and after",
      galleryIntro: "Spaces we've cleared for local customers.",
      serviceQuestion: "What needs taking away?",
      quoteHeading: "Get a pickup price",
      quoteIntro: "Tell us roughly what you've got and we'll give you a price.",
      cta: "Get a pickup price",
    },
  }),
];

export const DEFAULT_TEMPLATE_ID = "cleaning-01";

const BY_TEMPLATE = new Map(TEMPLATE_PRESETS.map((p) => [p.templateId, p]));
const BY_NICHE = new Map(TEMPLATE_PRESETS.map((p) => [p.niche, p]));

/** Accepts a template id or a business niche; always returns a usable preset. */
export function presetFor(key?: string | null): TemplatePreset {
  if (key) {
    const found = BY_TEMPLATE.get(key) ?? BY_NICHE.get(key);
    if (found) return found;
  }
  return BY_TEMPLATE.get(DEFAULT_TEMPLATE_ID)!;
}

export function templateIdForNiche(niche?: string | null): string {
  return (niche ? BY_NICHE.get(niche)?.templateId : null) ?? DEFAULT_TEMPLATE_ID;
}

export const INDUSTRY_OPTIONS = TEMPLATE_PRESETS.map((p) => ({
  value: p.niche,
  label: p.industryLabel,
  templateId: p.templateId,
}));
