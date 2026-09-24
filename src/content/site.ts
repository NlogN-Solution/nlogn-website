// All page copy, links and image references live here so content edits
// never require touching component markup.

export type SiteImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const site = {
  name: "NLOGN",
  title: "NLOGN — Good ideas. Better systems.",
  description:
    "NLOGN is a digital studio in Nepal building websites, custom software, AI automation and the marketing that connects them to your customers.",
  email: "nlognweb@gmail.com",
  phone: { display: "+977 9747745188", href: "tel:+9779747745188" },
  mainSite: "https://nlogn.online",
  contactUrl: "https://nlogn.online/contact",
  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/nlogn" },
    { label: "Instagram", href: "https://instagram.com/nlogn" },
  ],
  legal: [
    { label: "Privacy", href: "https://nlogn.online/privacy" },
    { label: "Terms", href: "https://nlogn.online/terms" },
  ],
};

export const navLinks = [
  { label: "Work", href: "#work" },
  { label: "What we do", href: "#services" },
  { label: "The studio", href: "#studio" },
];

export const images = {
  hero: {
    src: "/images/hero.png",
    alt: "A vivid blue magnet brings scattered steel spheres into precise rows",
    width: 1536,
    height: 1024,
  },
  movingParts: {
    src: "/images/hero-down.png",
    alt: "Three steel pulleys of different sizes turning together on a single blue belt",
    width: 1254,
    height: 1254,
  },
  chatboq: {
    src: "/images/chatboq.webp",
    alt: "Chatboq’s actual customer communication workspace",
    width: 1080,
    height: 542,
  },
  ed360: {
    src: "/images/ed360.webp",
    alt: "ED360 consultancy management dashboard",
    width: 1050,
    height: 576,
  },
  ignition: {
    src: "/images/ignition.webp",
    alt: "Ignition admissions dashboard showing applications and student operations",
    width: 1080,
    height: 529,
  },
  docket: {
    src: "/images/docket.webp",
    alt: "Docket legal practice management product imagery",
    width: 1080,
    height: 720,
  },
  connections: {
    src: "/images/connections.webp",
    alt: "Blue cable connecting sculptural metal blocks into a single system",
    width: 1536,
    height: 1024,
  },
  process: {
    src: "/images/process.webp",
    alt: "Tactile paper plans and connected components on a cobalt work surface",
    width: 1536,
    height: 1024,
  },
  studio: {
    src: "/images/studio.webp",
    alt: "Still from NLOGN’s existing studio film",
    width: 1200,
    height: 2132,
  },
} satisfies Record<string, SiteImage>;

// "Scatter" section: a stack of service cards that spreads out around the
// headline on scroll. Each image fills one photo slot of the layout.
export const scatter = {
  title: ["One studio.", "Every discipline."],
  body: [
    "Websites, software, automation, marketing and consulting,",
    "built by one team, the same way for every client.",
  ],
  stat: { label: "Disciplines", value: "5", note: "under one roof" },
  chart: { label: "Growth, n log n" },
  images: {
    software: {
      label: "Software",
      src: "/images/services/software-development.png",
      alt: "Close-up of a dark software dashboard with analytics charts",
      width: 1920,
      height: 1280,
    },
    automation: {
      label: "Automation",
      src: "/images/services/ai-automation.png",
      alt: "Laptop on a desk showing an AI automation dashboard",
      width: 1920,
      height: 1280,
    },
    marketing: {
      label: "Marketing",
      src: "/images/services/marketing-campaigns.jpg",
      alt: "Portrait collage with colourful media fragments bursting outward",
      width: 1920,
      height: 1375,
    },
    web: {
      label: "Web design",
      src: "/images/services/web-design.jpg",
      alt: "Hand-drawn website wireframes in a notebook beside a phone",
      width: 1920,
      height: 1280,
    },
    consulting: {
      label: "Consulting",
      src: "/images/services/it-consulting.jpg",
      alt: "Two IT consultants reviewing a tablet in a server room",
      width: 1920,
      height: 1080,
    },
  },
} satisfies {
  title: string[];
  body: string[];
  stat: Record<string, string>;
  chart: Record<string, string>;
  images: Record<string, SiteImage & { label: string }>;
};

// Web-ready versions of the logos in public/images/clients (trimmed, on
// transparent backgrounds). `height` evens out their visual weight, since
// square marks read smaller than wide wordmarks at the same height.
export const clients = [
  {
    name: "Ananta Legal",
    src: "/images/clients/web/ananta-legal.png",
    width: 465,
    height: 327,
    displayHeight: 48,
  },
  {
    name: "Capital Education Foundation",
    src: "/images/clients/web/capital-education.png",
    width: 899,
    height: 900,
    displayHeight: 58,
  },
  {
    name: "Dream High Education Academy",
    src: "/images/clients/web/dream-high.png",
    width: 900,
    height: 456,
    displayHeight: 44,
  },
  {
    name: "Ignition",
    src: "/images/clients/web/ignition.png",
    width: 900,
    height: 218,
    displayHeight: 32,
  },
];

export type Project = {
  word: string;
  wordMark: string;
  title: [string, string];
  summary: string;
  status: string;
  href: string;
  tone: "blue" | "silver" | "orange" | "dark";
  large?: boolean;
  image: SiteImage;
};

export const projects: Project[] = [
  {
    word: "chatboq",
    wordMark: "®",
    title: ["Every conversation.", "One shared workspace."],
    summary: "Chatboq — AI, live chat, ticketing & CRM",
    status: "In production",
    href: "https://nlogn.online/software/chatboq",
    tone: "blue",
    large: true,
    image: images.chatboq,
  },
  {
    word: "ED360",
    wordMark: "↗",
    title: ["A clearer picture", "of the whole business."],
    summary: "ED360 — Consultancy operations",
    status: "In production",
    href: "https://nlogn.online/software/ed360",
    tone: "silver",
    image: images.ed360,
  },
  {
    word: "ignition",
    wordMark: "↗",
    title: ["From first enquiry", "to the next chapter."],
    summary: "Ignition — Admissions management",
    status: "In production",
    href: "https://nlogn.online/software/ignition",
    tone: "orange",
    image: images.ignition,
  },
  {
    word: "Docket",
    wordMark: "®",
    title: ["Every matter.", "Everything in its place."],
    summary: "Docket — Legal practice management",
    status: "In development",
    href: "https://nlogn.online/software/docket",
    tone: "dark",
    large: true,
    image: images.docket,
  },
];

export type Service = {
  id: "web" | "software" | "automation" | "marketing";
  title: string;
  /** Category shown to the right of the title. */
  label: string;
  body: string;
  tags: string[];
  outcome: string;
  /** Existing call to action; links to the contact section. */
  cta: string;
};

export const services: Service[] = [
  {
    id: "web",
    title: "A better digital front door.",
    label: "Websites & digital experiences",
    body: "Give people a clear reason to choose you, and an easy way to take the next step.",
    tags: ["Websites", "E-commerce", "UI / UX", "CMS"],
    outcome: "Thoughtful design. Clear next steps.",
    cta: "Let’s build your website ↗",
  },
  {
    id: "software",
    title: "Software that fits your day.",
    label: "Custom software & business systems",
    body: "Bring your leads, tasks and team into one place. Build around how your business actually works.",
    tags: ["CRM", "ERP", "Portals", "Integrations"],
    outcome: "One workspace. A clearer working day.",
    cta: "Talk through your workflow ↗",
  },
  {
    id: "automation",
    title: "Less repetition. More room.",
    label: "AI & workflow automation",
    body: "Let the routine work happen in the background, so your team can focus on the work that needs them.",
    tags: ["AI assistants", "Workflows", "API connections"],
    outcome: "From enquiry to follow-up. Automatically.",
    cta: "Find the work worth automating ↗",
  },
  {
    id: "marketing",
    title: "Good work deserves an audience.",
    label: "Search, content & marketing",
    body: "Help the right people find you, understand your value, and take the next step.",
    tags: ["SEO", "Content", "Campaigns", "Creative"],
    outcome: "Be found. Be understood. Be remembered.",
    cta: "Talk about reaching your customers ↗",
  },
];

// The section's connecting-cable artwork.
export const serviceArt = {
  label: "01 / Digital experiences",
  image: images.connections,
};

export const processSteps = [
  {
    phase: "Discovery",
    title: "Get close to the problem.",
    body: "We look at your business, your customers and the work that gets in the way. Together, we decide what is worth solving.",
    outcome: "You leave with: a clear brief.",
  },
  {
    phase: "Design",
    title: "Make the idea tangible.",
    body: "Map the experience. Sketch the flow. Put a prototype in front of you so we can make useful decisions before the build.",
    outcome: "You see: the direction, before the commitment.",
  },
  {
    phase: "Build",
    title: "Build it in the open.",
    body: "Design and development move together. You see progress, try the work and give feedback while changes are still easy.",
    outcome: "You get: working software to review.",
  },
  {
    phase: "Launch & learn",
    title: "Launch. Learn. Improve.",
    body: "Test the details, hand over the tools and look at what happens in use. The next improvement comes from real behaviour.",
    outcome: "You keep: the code, accounts and knowledge.",
  },
];

export const notes = [
  {
    kicker: "01 / Search",
    title: ["What to check before", "rebuilding your website."],
    cta: "Read the SEO audit notes ↗",
    href: "https://nlogn.online/blog/technical-seo-audit-before-any-code",
  },
  {
    kicker: "02 / Engineering",
    title: ["A faster site starts", "with the right decisions."],
    cta: "Read the rendering guide ↗",
    href: "https://nlogn.online/blog/nextjs-rendering-strategy-by-page-type",
  },
];

export const faqs = [
  {
    q: "Do I need to know exactly what I want?",
    a: "No. Start with the problem, the repetitive task or the opportunity you see. We can work out what the right solution looks like together.",
  },
  {
    q: "Can you work with our existing tools?",
    a: "Integration is part of our work. We review your current website, software and data before recommending what to keep, connect or replace.",
  },
  {
    q: "How do pricing and timelines work?",
    a: "We scope the work first. Your proposal sets out the deliverables, cost and schedule so you can review them before the project begins.",
  },
  {
    q: "Who owns the finished work?",
    a: "You own the code, accounts and design files. The handover should leave your team able to use and manage what we build.",
  },
  {
    q: "Can we work together from another country?",
    a: "Yes. We work remotely, with written updates, shared previews and agreed meeting times.",
  },
];
