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
import { NICHE_CATALOG } from "@/lib/niche-catalog";
import { GENERATED_TEMPLATE_IMAGES } from "@/lib/template-generated-assets";

/** Hero arrangement. All variants are responsive and share the same sections. */
export type TemplateLayout = "split" | "overlay" | "banner";
export type TemplateFamily = "technical" | "emergency" | "showcase" | "wellness" | "professional" | "kinetic";

export type TemplateFeature = {
  eyebrow: string;
  heading: string;
  intro: string;
  items: Array<{ title: string; copy: string; meta: string }>;
};

export type TemplatePreset = {
  templateId: string;
  /** Matches the `niche` stored on the business row. */
  niche: string;
  name: string;
  industryLabel: string;
  description: string;
  accent: string;
  layout: TemplateLayout;
  family: TemplateFamily;
  feature: TemplateFeature;
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

/**
 * New templates must be added here as data-only presets. The shared renderer
 * owns typography, responsive sections and behavior so every design remains
 * modular and compatible with the editor, previews and live customer sites.
 */

function preset(p: TemplatePreset): TemplatePreset {
  return p;
}

const FAMILY_BY_NICHE: Partial<Record<string, TemplateFamily>> = {
  hvac: "technical", electrical_contractor: "technical", concrete_contractor: "technical", window_installation: "technical", flooring_contractor: "technical", construction: "technical",
  plumbing: "emergency", locksmith: "emergency", towing_service: "emergency", garage_door_service: "emergency", water_damage_restoration: "emergency", fire_damage_restoration: "emergency", auto_battery_service: "emergency",
  landscaping: "showcase", renovation: "showcase", painting_contractor: "showcase", bathroom_remodeling: "showcase", kitchen_remodeling: "showcase", masonry_contractor: "showcase", photography: "showcase", wedding_services: "showcase",
  hair_salon: "wellness", nail_salon: "wellness", spa: "wellness", massage_therapy: "wellness", yoga_studio: "wellness", pet_grooming: "wellness", dentist: "wellness", chiropractor: "wellness",
  home_inspection: "professional", real_estate_agent: "professional", law_firm: "professional", accountant: "professional", insurance_agency: "professional", storage_company: "professional",
};

function familyFor(niche: string): TemplateFamily {
  return FAMILY_BY_NICHE[niche] ?? "kinetic";
}

function featureFor(label: string, services: readonly string[], family: TemplateFamily): TemplateFeature {
  const service = services[0] ?? label;
  const second = services[1] ?? "Project planning";
  const third = services[2] ?? "Quality assurance";
  const fourth = services[3] ?? "Ongoing support";
  const variants: Record<TemplateFamily, TemplateFeature> = {
    technical: { eyebrow: "Methodology // 01", heading: `Precision built into every ${label.toLowerCase()} project.`, intro: "A measured, documented approach replaces guesswork with dependable performance.", items: [{ title: "Site analysis", copy: `We assess the property and requirements before recommending ${service.toLowerCase()}.`, meta: "Diagnostic" }, { title: "System planning", copy: `${second} is mapped around performance, code and your priorities.`, meta: "Engineering" }, { title: "Precision delivery", copy: `${third} is completed by an experienced, prepared crew.`, meta: "Execution" }, { title: "Final verification", copy: `${fourth} and a clear handover protect the finished work.`, meta: "Quality control" }] },
    emergency: { eyebrow: "Rapid response", heading: "When it matters, every minute has a job.", intro: "A calm response, clear decisions and capable work from the first call through resolution.", items: [{ title: "Answer fast", copy: `We quickly establish what is happening and whether ${service.toLowerCase()} is urgent.`, meta: "Triage" }, { title: "Make it safe", copy: "The immediate risk is controlled before permanent work begins.", meta: "Stabilize" }, { title: "Fix the cause", copy: `${second} is handled with the right equipment and a clear scope.`, meta: "Resolve" }, { title: "Confirm the result", copy: "We test the work, explain what changed and leave the site ready.", meta: "Verify" }] },
    showcase: { eyebrow: "The craft", heading: "Good work should be worth looking at.", intro: "Thoughtful planning, considered details and a finish that changes how the space feels.", items: [{ title: "Discover", copy: `We learn how you want ${service.toLowerCase()} to look, feel and function.`, meta: "Vision" }, { title: "Shape the idea", copy: `${second} turns priorities into a practical, visual direction.`, meta: "Design" }, { title: "Make it real", copy: `${third} is delivered with care for every visible detail.`, meta: "Craft" }, { title: "Reveal", copy: "We walk through the finished work together and make every detail count.", meta: "Finish" }] },
    wellness: { eyebrow: "Your experience", heading: "Care designed around how you want to feel.", intro: "Personal attention from the welcome through every detail of your visit.", items: [{ title: "A warm welcome", copy: `We listen first and understand what you want from ${service.toLowerCase()}.`, meta: "Connect" }, { title: "Personal plan", copy: `${second} is tailored to your comfort, goals and preferences.`, meta: "Personalize" }, { title: "Expert care", copy: `${third} is delivered in a calm, considered environment.`, meta: "Experience" }, { title: "Feel the difference", copy: `${fourth} helps the result last beyond your appointment.`, meta: "Continue" }] },
    professional: { eyebrow: "Our standard", heading: "Clear judgment. Careful work. No loose ends.", intro: "A disciplined engagement built around clarity, accountability and informed decisions.", items: [{ title: "Understand", copy: `We establish your priorities before advising on ${service.toLowerCase()}.`, meta: "Discovery" }, { title: "Evaluate", copy: `${second} is considered against the facts, risks and best options.`, meta: "Assessment" }, { title: "Advise", copy: "You receive a clear recommendation without unnecessary complexity.", meta: "Direction" }, { title: "Follow through", copy: `${fourth} keeps the work moving and you fully informed.`, meta: "Delivery" }] },
    kinetic: { eyebrow: "Built to move", heading: "Less waiting. More getting it done.", intro: "A direct, energetic service experience built for people who value their time.", items: [{ title: "Book it", copy: `Tell us what you need from ${service.toLowerCase()} and choose a convenient time.`, meta: "Schedule" }, { title: "We get moving", copy: `${second} starts with the crew, tools and information already prepared.`, meta: "Action" }, { title: "See the change", copy: `${third} is completed efficiently without cutting corners.`, meta: "Result" }, { title: "Back to your day", copy: "Simple payment, a clean handoff and no unnecessary follow-up.", meta: "Done" }] },
  };
  return variants[family];
}

const fallbackGeneratedImages = GENERATED_TEMPLATE_IMAGES["pressure_washing"];
if (!fallbackGeneratedImages) throw new Error("Missing generated template photography");

const GENERATED_PRESETS: TemplatePreset[] = NICHE_CATALOG.map((item) => {
  const family = familyFor(item.niche);
  return {
  templateId: `${item.niche.replaceAll("_", "-")}-01`,
  niche: item.niche,
  name: `${item.label} — Local Standard`,
  industryLabel: item.label,
  description: `A polished, conversion-focused ${item.label.toLowerCase()} website with real service photography and a clear enquiry journey.`,
  accent: item.accent,
  layout: item.layout,
  family,
  feature: featureFor(item.label, item.services, family),
  images: GENERATED_TEMPLATE_IMAGES[item.niche] ?? fallbackGeneratedImages,
  copy: {
    service: item.label.toLowerCase(),
    trustPoints: ["Experienced local team", "Clear, upfront pricing", "Work backed by local reviews"],
    servicesHeading: `${item.label} services`,
    servicesIntro: `${item.services.slice(0, 3).join(", ")} and more, delivered by a dependable local team.`,
    galleryHeading: "Our recent work",
    galleryIntro: `A closer look at the quality behind every ${item.label.toLowerCase()} project.`,
    serviceQuestion: `How can our ${item.label.toLowerCase()} team help?`,
    quoteHeading: "Request a free estimate",
    quoteIntro: "Share a few details and our team will follow up with clear next steps.",
    cta: "Get a free estimate",
  },
  };
});

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  preset({
    templateId: "cleaning-01",
    niche: "cleaning",
    name: "Cleaning — Bright Standard",
    industryLabel: "Cleaning company",
    description: "Airy, premium home-service design with strong proof, project photography and a clear quote journey.",
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
    name: "Landscaping — Living Outdoors",
    industryLabel: "Landscaping & lawn care",
    description: "Immersive garden photography and editorial project storytelling for design-led outdoor work.",
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
    name: "Roofing — Built Above",
    industryLabel: "Roofing",
    description: "Authoritative, project-led design balancing emergency response with long-term craftsmanship.",
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
    name: "Plumbing — Precision Flow",
    industryLabel: "Plumbing",
    description: "Crisp, service-first design for urgent callouts, premium installations and trusted local expertise.",
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
    name: "Renovation — Crafted Spaces",
    industryLabel: "Renovation & remodelling",
    description: "Editorial interiors showcase with rich project imagery and a considered consultation journey.",
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
    name: "Construction — Solid Ground",
    industryLabel: "Construction & building",
    description: "Confident contractor design with credentials, delivery process and completed builds at the forefront.",
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
    name: "Junk Removal — Clear Space",
    industryLabel: "Junk removal & hauling",
    description: "Energetic, straightforward design centred on fast pickups, responsible disposal and dramatic results.",
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
  ...GENERATED_PRESETS,
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
