import { works } from "@/config/site";

/** Which abstract visual renders in the panel. One per capability. */
export type CapabilityVisualKey =
  | "social"
  | "creative"
  | "seo"
  | "paid"
  | "web"
  | "software"
  | "automation"
  | "systems";

export type CapabilityProject = {
  /** Slug of an entry in `works` — client, title and link are read from there. */
  work: string;
  /** What we actually did on that engagement for *this* discipline. */
  role: string;
  /** One figure from that engagement, picked for its relevance here. */
  metric: { value: string; label: string };
  /**
   * Optional file in `/public/videos` (e.g. "craft-studio-reel.mp4"). When set,
   * the project card plays it inline instead of showing the still preview.
   */
  video?: string;
};

export type Capability = {
  id: string;
  number: string;
  /** Long form, used in the left rail and the mobile accordion. */
  label: string;
  /** Short form, used as the panel kicker beside the number. */
  kicker: string;
  title: string;
  description: string;
  services: string[];
  highlights: string[];
  visual: CapabilityVisualKey;
  projects: CapabilityProject[];
};

export const capabilities: Capability[] = [
  {
    id: "social-media",
    number: "01",
    label: "Social Media",
    kicker: "Social Media",
    title: "Turn attention into a growing audience.",
    description:
      "Strategy, content and campaigns designed to build a stronger presence across the platforms your customers actually use.",
    services: [
      "Social media strategy",
      "Content planning",
      "Content creation",
      "Instagram management",
      "Facebook marketing",
      "LinkedIn marketing",
      "Community management",
      "Social media analytics",
    ],
    highlights: ["Content systems", "Audience growth", "Campaign management"],
    visual: "social",
    projects: [
      {
        work: "craft-studio",
        role: "Moved forty makers off Instagram DMs and kept their own voice in the follow-up flows.",
        metric: { value: "22%", label: "Cart recovery rate" },
      },
      {
        work: "himalayan-cafe",
        role: "Built the loyalty flow that turns a first order into an audience we can reach without paying for it.",
        metric: { value: "+240%", label: "Direct online orders" },
      },
      {
        work: "greenpath",
        role: "Turned real installation data into a content programme the team publishes from every month.",
        metric: { value: "34%", label: "Of pipeline from content" },
      },
    ],
  },
  {
    id: "creative",
    number: "02",
    label: "Creative & Video",
    kicker: "Creative",
    title: "Content people actually stop to watch.",
    description:
      "Short-form videos, ads and creative assets built to capture attention and turn views into action.",
    services: [
      "Video editing",
      "Reels",
      "TikTok content",
      "YouTube Shorts",
      "Advertisement videos",
      "AI video production",
      "Motion graphics",
      "Creative strategy",
    ],
    highlights: ["Short-form editing", "Ad creative", "Motion systems"],
    visual: "creative",
    projects: [
      {
        work: "craft-studio",
        role: "Photographed and structured four hundred artisan products, then built the templates the makers publish with.",
        metric: { value: "+310%", label: "Revenue year on year" },
      },
      {
        work: "himalayan-cafe",
        role: "Branch-aware menu and ordering creative, carried across five locations without a redraw.",
        metric: { value: "5", label: "Branches launched" },
      },
      {
        work: "greenpath",
        role: "Rebuilt a static annual report as an interactive piece people finish rather than download.",
        metric: { value: "3.1x", label: "Qualified leads" },
      },
    ],
  },
  {
    id: "seo",
    number: "03",
    label: "SEO",
    kicker: "SEO",
    title: "Get found when customers are searching.",
    description:
      "Technical SEO, content and search strategy designed to build sustainable organic visibility and qualified traffic.",
    services: [
      "Technical SEO",
      "On-page SEO",
      "Keyword research",
      "Content strategy",
      "Local SEO",
      "Link building",
      "SEO audits",
      "Search analytics",
    ],
    highlights: ["Organic visibility", "Qualified traffic", "Search rankings"],
    visual: "seo",
    projects: [
      {
        work: "greenpath",
        role: "A data-backed cluster on solar cost, written from the client's own installation numbers.",
        metric: { value: "#1", label: "For 'solar cost Nepal'" },
      },
      {
        work: "urban-space",
        role: "Static listing pages with per-property structured data, so four thousand properties could finally be crawled.",
        metric: { value: "98%", label: "Listings indexed" },
      },
      {
        work: "edubridge",
        role: "Courses modelled as structured data so listings surface in Google's course results.",
        metric: { value: "+180%", label: "Organic sessions" },
      },
    ],
  },
  {
    id: "paid-growth",
    number: "04",
    label: "Paid Growth",
    kicker: "Paid Growth",
    title: "Put your business in front of people ready to buy.",
    description:
      "Performance-focused campaigns built around the right audience, the right offer and measurable acquisition.",
    services: [
      "Google Search Ads",
      "Google Display Ads",
      "Meta Ads",
      "Retargeting",
      "Campaign strategy",
      "Landing pages",
      "Conversion tracking",
      "Performance optimization",
    ],
    highlights: ["Cost per customer", "Creative testing", "Attribution"],
    visual: "paid",
    projects: [
      {
        work: "edubridge",
        role: "Rebuilt what happens after the click: three-step enrolment on exactly the same ad spend.",
        metric: { value: "3.4x", label: "Signup conversion" },
      },
      {
        work: "greenpath",
        role: "Calculator results piped into HubSpot as scored leads, so spend is judged on pipeline rather than clicks.",
        metric: { value: "-19 days", label: "Sales cycle" },
      },
      {
        work: "craft-studio",
        role: "Retargeting and cart-recovery flows built around four hundred SKUs and international intent.",
        metric: { value: "67%", label: "International orders" },
      },
    ],
  },
  {
    id: "websites",
    number: "05",
    label: "Websites",
    kicker: "Web Development",
    title: "Websites built to turn visitors into customers.",
    description:
      "Fast, modern and conversion-focused websites designed around your brand, your customers and your business goals.",
    services: [
      "Business websites",
      "Landing pages",
      "E-commerce",
      "Web applications",
      "UI/UX design",
      "Conversion optimization",
      "SEO-ready architecture",
      "Performance optimization",
    ],
    highlights: ["Sub-second loads", "Conversion design", "Code you own"],
    visual: "web",
    projects: [
      {
        work: "himalayan-cafe",
        role: "A Next.js storefront with branch-aware menus and a ninety-second checkout.",
        metric: { value: "0.9s", label: "Largest Contentful Paint" },
      },
      {
        work: "edubridge",
        role: "Static course pages with incremental revalidation, and a CMS the academic team runs alone.",
        metric: { value: "-71%", label: "Page load time" },
      },
      {
        work: "craft-studio",
        role: "A multi-vendor storefront quoting live international shipping and duty at checkout.",
        metric: { value: "67%", label: "International orders" },
      },
    ],
  },
  {
    id: "software",
    number: "06",
    label: "Software",
    kicker: "Software",
    title: "Software built around the way your business works.",
    description:
      "Custom platforms and internal tools that replace disconnected processes with software designed specifically for your operation.",
    services: [
      "Custom web applications",
      "CRM systems",
      "Admin dashboards",
      "Customer portals",
      "Business management systems",
      "API integrations",
      "Database systems",
      "SaaS platforms",
    ],
    highlights: ["Internal tools", "Integrations", "Documented handover"],
    visual: "software",
    projects: [
      {
        work: "urban-space",
        role: "A Node.js search service with geo-indexed queries sitting behind four thousand listings.",
        metric: { value: "11s → 1.2s", label: "Search response" },
      },
      {
        work: "craft-studio",
        role: "Per-maker inventory, payouts and a sales dashboard each maker reads themselves.",
        metric: { value: "40", label: "Makers onboarded" },
      },
      {
        work: "himalayan-cafe",
        role: "An order service wired to payments and kitchen printing across five branches.",
        metric: { value: "5", label: "Branches launched" },
      },
    ],
  },
  {
    id: "automation",
    number: "07",
    label: "Automation",
    kicker: "Automation",
    title: "Let technology handle the repetitive work.",
    description:
      "AI-powered workflows and business automations that save time, reduce manual work and help your team move faster.",
    services: [
      "AI workflows",
      "Lead automation",
      "WhatsApp automation",
      "Email automation",
      "CRM automation",
      "AI chatbots",
      "Data automation",
      "Workflow automation",
    ],
    highlights: ["Hours returned", "Fewer handoffs", "No manual re-entry"],
    visual: "automation",
    projects: [
      {
        work: "greenpath",
        role: "Calculator to scored CRM lead with the whole funnel instrumented, so nobody rekeys anything.",
        metric: { value: "3.1x", label: "Qualified leads" },
      },
      {
        work: "urban-space",
        role: "Sold-status sync straight from the agents' CRM, so nothing stale stays live.",
        metric: { value: "4,000+", label: "Live properties" },
      },
      {
        work: "craft-studio",
        role: "Cart recovery that runs on its own, written in each maker's own voice.",
        metric: { value: "22%", label: "Cart recovery rate" },
      },
    ],
  },
  {
    id: "digital-systems",
    number: "08",
    label: "Digital Systems",
    kicker: "Digital Systems",
    title: "Connect everything into one system.",
    description:
      "We bring marketing, software, data and automation together so your digital operation works as one.",
    services: [
      "Business dashboards",
      "CRM",
      "Analytics",
      "Marketing automation",
      "Internal tools",
      "Integrations",
      "Data systems",
      "Custom platforms",
    ],
    highlights: ["One source of truth", "Shared dashboards", "Compounding output"],
    visual: "systems",
    projects: [
      {
        work: "edubridge",
        role: "Front end, CMS, structured data and enrolment running as one system the team operates without us.",
        metric: { value: "12k", label: "Students enrolled" },
      },
      {
        work: "greenpath",
        role: "Content, calculator, CRM and analytics wired together so marketing can see what closes.",
        metric: { value: "34%", label: "Of pipeline from content" },
      },
      {
        work: "urban-space",
        role: "Portal, search service, CRM sync and index coverage kept in step automatically.",
        metric: { value: "+96%", label: "Enquiries per listing" },
      },
    ],
  },
];

/** Case-study lookup, so a capability only ever stores a slug. */
export const workBySlug = new Map(works.map((work) => [work.slug, work]));

if (process.env.NODE_ENV !== "production") {
  for (const capability of capabilities) {
    for (const project of capability.projects) {
      if (!workBySlug.has(project.work)) {
        throw new Error(
          `capabilities: "${capability.id}" references unknown work "${project.work}".`,
        );
      }
    }
  }
}
