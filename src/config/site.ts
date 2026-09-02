export const siteConfig = {
  name: "nlogn",
  legalName: "nlogn Digital Pvt. Ltd.",
  tagline: "Digital Growth",
  domain: "nlogn.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nlogn.com",
  description:
    "nlogn helps businesses grow with smart websites, powerful software, and data-driven digital strategies that convert visitors into loyal customers.",
  founded: "2019",
  email: "nlognweb@gmail.com",
  salesEmail: "nlognweb@gmail.com",
  phone: "+977-9747745188",
  phoneDisplay: "+977-9747745188",
  address: {
    street: "Koteswor, Kathmandu",
    city: "Kathmandu",
    region: "Bagmati",
    postalCode: "44700",
    country: "NP",
    countryName: "Nepal",
  },
  geo: { lat: 27.6795, lng: 85.3096 },
  hours: "Mo-Fr 09:00-18:00",
  socials: {
    linkedin: "https://www.linkedin.com/company/nlogn",
    x: "https://x.com/nlogn",
    github: "https://github.com/nlogn",
    instagram: "https://instagram.com/nlogn",
    dribbble: "https://dribbble.com/nlogn",
  },
  twitterHandle: "@nlogn",
  /**
   * GA4 measurement ID. Public by design — it ships in the page source either
   * way — so it lives here rather than only in the deploy environment, and the
   * site is tagged the moment it is built. NEXT_PUBLIC_GA_ID overrides it.
   */
  gaId: "G-2H6500B256",
  // Optional: point this at a hosted MP4 to replace the built-in process reel.
  videoUrl: process.env.NEXT_PUBLIC_SHOWREEL_URL ?? "",
} as const;

export type NavItem = {
  label: string;
  href: string;
  /** Renders as a dropdown in the header and a nested list on mobile. */
  children?: { label: string; href: string; description: string }[];
};

export const nav: NavItem[] = [
  { label: "Work", href: "/works" },
  { label: "Pricing", href: "/services" },
  { label: "About", href: "/about" },
  {
    label: "Resources",
    href: "/resources",
    children: [
      {
        label: "Insights",
        href: "/insights",
        description: "Long-form pieces on what actually moves a number",
      },
      {
        label: "Blog",
        href: "/blog",
        description: "Practical field notes from the build",
      },
      {
        label: "Case studies",
        href: "/case-studies",
        description: "Client work with the baseline and the result",
      },
      {
        label: "Software",
        href: "/software",
        description: "The platforms we build and run, written up in full",
      },
    ],
  },
];

export type Service = {
  slug: string;
  title: string;
  short: string;
  summary: string;
  icon: "code" | "megaphone" | "layers" | "search" | "palette" | "gauge";
  outcomes: string[];
  deliverables: string[];
  stack: string[];
  startingAt: string;
  timeline: string;
  faq: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "web-development",
    title: "Web Development",
    short: "Sites that load fast and sell hard.",
    summary:
      "We design and build marketing sites, e-commerce storefronts, and web apps on Next.js and Node.js — engineered for Core Web Vitals, accessibility, and the kind of speed search engines reward.",
    icon: "code",
    outcomes: [
      "Sub-second loads on 4G, verified in the field",
      "Green Core Web Vitals on every template",
      "A CMS your team can actually use",
    ],
    deliverables: [
      "UX architecture and wireframes",
      "Design system in Figma, built to code",
      "Next.js front end, Node.js APIs",
      "Headless CMS with editorial workflow",
      "Analytics, consent, and event tracking",
      "30 days of post-launch support",
    ],
    stack: ["Next.js", "React", "Node.js", "TypeScript", "PostgreSQL", "Vercel"],
    startingAt: "$4,500",
    timeline: "5-8 weeks",
    faq: [
      {
        q: "Will I be able to edit the site myself?",
        a: "Yes. Every page is composed from blocks you can rearrange in the CMS, and we run a 90-minute handover session with your team plus a recorded walkthrough.",
      },
      {
        q: "Do you migrate from WordPress or Wix?",
        a: "Regularly. We map every existing URL, carry over the content, and ship 301 redirects so rankings survive the move. Most migrations keep or improve organic traffic within six weeks.",
      },
    ],
  },
  {
    slug: "seo-and-content",
    title: "SEO & Content",
    short: "Compounding traffic, not one-off spikes.",
    summary:
      "Technical SEO, topical authority, and content that answers the questions your buyers actually type. We fix the crawl, build the clusters, and publish on a cadence you can sustain.",
    icon: "search",
    outcomes: [
      "Technical debt cleared: indexation, schema, speed",
      "A keyword map tied to revenue, not vanity volume",
      "Content that ranks and still sounds human",
    ],
    deliverables: [
      "Full technical audit and fix list",
      "Keyword and SERP-intent research",
      "Topic clusters with internal-link plan",
      "Structured data implementation",
      "Monthly content production",
      "Rank, traffic, and conversion reporting",
    ],
    stack: ["Search Console", "Ahrefs", "GA4", "Looker Studio", "Schema.org"],
    startingAt: "$1,200/mo",
    timeline: "Ongoing, 6-month minimum",
    faq: [
      {
        q: "How long before I see results?",
        a: "Technical fixes can move impressions within two to four weeks. Content-led ranking gains typically compound from month three, which is why we ask for a six-month runway.",
      },
      {
        q: "Do you guarantee first-page rankings?",
        a: "No one honestly can. We commit to leading indicators we control — crawl health, publishing cadence, coverage of your priority keyword set — and report them monthly.",
      },
    ],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    short: "Paid, social, and email that pay for themselves.",
    summary:
      "Campaigns built around a single question: what does one customer cost, and what are they worth? We run acquisition end to end, from creative to attribution.",
    icon: "megaphone",
    outcomes: [
      "A CAC number you can trust and defend",
      "Creative tested weekly, not quarterly",
      "Landing pages built for the ad, not reused",
    ],
    deliverables: [
      "Channel strategy and budget model",
      "Google, Meta, and LinkedIn campaign builds",
      "Ad creative and copy production",
      "Conversion-tracking and server-side events",
      "Landing pages and A/B tests",
      "Weekly performance reviews",
    ],
    stack: ["Google Ads", "Meta Ads", "GA4", "HubSpot", "Klaviyo"],
    startingAt: "$900/mo + ad spend",
    timeline: "Ongoing, 3-month minimum",
    faq: [
      {
        q: "Do you require a minimum ad budget?",
        a: "We ask for at least $1,000 per month in media so tests reach significance. Below that, we would rather point you at SEO and email first.",
      },
      {
        q: "Who owns the ad accounts?",
        a: "You do, always. We work inside your accounts and hand back full admin access the day an engagement ends.",
      },
    ],
  },
  {
    slug: "it-solutions",
    title: "IT Solutions",
    short: "Internal tools that remove the spreadsheet.",
    summary:
      "Custom dashboards, integrations, and automation that connect the systems your business already runs on — built on Node.js, documented, and handed over with tests.",
    icon: "layers",
    outcomes: [
      "Manual reporting hours cut, measurably",
      "One source of truth across tools",
      "Code you own, documented for the next developer",
    ],
    deliverables: [
      "Systems and data-flow audit",
      "Custom dashboards and admin panels",
      "Third-party API integrations",
      "Workflow automation and scheduled jobs",
      "Role-based access and audit logs",
      "Runbooks and handover documentation",
    ],
    stack: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker", "AWS"],
    startingAt: "$6,000",
    timeline: "6-12 weeks",
    faq: [
      {
        q: "Can you work with our legacy system?",
        a: "Usually. We start with a two-week discovery to map what exists and what it can expose. If a clean integration is not possible, we say so before you commit to a build.",
      },
      {
        q: "What happens after handover?",
        a: "You get the repository, infrastructure-as-code, and runbooks. Support retainers are available but never required to keep the system running.",
      },
    ],
  },
  {
    slug: "brand-and-design",
    title: "Brand & Design",
    short: "An identity that survives contact with reality.",
    summary:
      "Positioning, visual identity, and a design system that holds up across a website, an app, a deck, and a shopfront window — not just a logo on a moodboard.",
    icon: "palette",
    outcomes: [
      "A clear position your team can repeat",
      "One system across every surface",
      "Assets your designers can extend without us",
    ],
    deliverables: [
      "Positioning and messaging framework",
      "Logo, type, and colour system",
      "Component library in Figma",
      "Brand guidelines document",
      "Social and collateral templates",
      "Photography and illustration direction",
    ],
    stack: ["Figma", "Adobe CC", "Blender", "Framer"],
    startingAt: "$3,200",
    timeline: "4-6 weeks",
    faq: [
      {
        q: "We already have a logo. Can you work with it?",
        a: "Often the logo is the one asset worth keeping. We can build the wider system around it and only recommend a redraw if it is actively costing you clarity.",
      },
      {
        q: "Do we get the source files?",
        a: "Yes — editable Figma libraries and vector originals, licensed to you outright.",
      },
    ],
  },
  {
    slug: "growth-retainers",
    title: "Growth Retainers",
    short: "A team on the number, month after month.",
    summary:
      "One cross-functional squad — strategy, build, content, and analytics — working a single growth metric on a two-week cycle. For companies past the launch stage.",
    icon: "gauge",
    outcomes: [
      "A prioritised experiment backlog, always visible",
      "Two-week cycles with shipped work at the end",
      "One dashboard the whole company reads",
    ],
    deliverables: [
      "Quarterly growth model and targets",
      "Experiment backlog with impact scoring",
      "Design and development capacity",
      "Content and campaign production",
      "Analytics and attribution upkeep",
      "Fortnightly review with your leadership",
    ],
    stack: ["Next.js", "Node.js", "GA4", "Metabase", "Linear"],
    startingAt: "$3,500/mo",
    timeline: "Rolling, 90-day cycles",
    faq: [
      {
        q: "How is this different from hiring in-house?",
        a: "You get five specialisms for less than one senior salary, starting in a week rather than a quarter. When the work stabilises, we help you hire and hand it over.",
      },
      {
        q: "Can we pause a cycle?",
        a: "Yes, with 30 days' notice between cycles. We would rather you pause than pay for capacity you cannot use.",
      },
    ],
  },
];

export type Work = {
  slug: string;
  client: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  challenge: string;
  approach: string[];
  outcome: string;
  metrics: { value: string; label: string }[];
  services: string[];
  stack: string[];
  duration: string;
  accent: string;
  testimonial?: { quote: string; name: string; role: string };
};

export const works: Work[] = [
  {
    slug: "himalayan-cafe",
    client: "Himalayan Café",
    title: "From one queue-out-the-door location to five",
    category: "Hospitality",
    year: "2025",
    summary:
      "A single-location café with no online ordering became a five-branch group with a direct channel that outsells the delivery aggregators.",
    challenge:
      "Himalayan Café was paying 28% commission to delivery platforms for orders placed by customers who already knew the brand. There was no website, no order history, and no way to reach past customers.",
    approach: [
      "Built a Next.js storefront with branch-aware menus and 90-second checkout",
      "Wired Khalti and card payments to a Node.js order service with kitchen printing",
      "Ranked the local pack for 40 neighbourhood queries with proper LocalBusiness schema",
      "Launched a loyalty flow that turns a first order into an email subscriber",
    ],
    outcome:
      "Direct orders overtook aggregator volume in month five. The commission saved paid for the build twice over in the first year, and the customer list is now the group's cheapest growth channel.",
    metrics: [
      { value: "+240%", label: "Direct online orders" },
      { value: "-28%", label: "Commission per order" },
      { value: "5", label: "Branches launched" },
      { value: "0.9s", label: "Largest Contentful Paint" },
    ],
    services: ["Web Development", "SEO & Content", "Brand & Design"],
    stack: ["Next.js", "Node.js", "PostgreSQL", "Khalti"],
    duration: "7 weeks build, 12 months growth",
    accent: "#6c47ff",
    testimonial: {
      quote:
        "We stopped renting our customers from delivery apps. That single change funded two new branches.",
      name: "Anjana Shrestha",
      role: "Founder, Himalayan Café",
    },
  },
  {
    slug: "edubridge",
    client: "EduBridge",
    title: "A learning platform that stopped losing students at signup",
    category: "Education",
    year: "2025",
    summary:
      "Rebuilt an eight-step enrolment flow into three, and gave the academic team a CMS they no longer needed a developer to use.",
    challenge:
      "EduBridge spent well on ads but converted under 1% of visitors. Enrolment ran through eight screens, course pages took nine seconds to load, and every content change sat in a developer queue.",
    approach: [
      "Rebuilt the front end in Next.js with static course pages and incremental revalidation",
      "Collapsed enrolment to three steps with saved progress and one-tap resume",
      "Modelled courses as structured data so listings surface in Google's course results",
      "Gave the academic team a block-based CMS with preview and scheduled publishing",
    ],
    outcome:
      "Conversion rate more than tripled on the same ad spend. Course pages now publish in minutes, and organic enrolments cover a third of intake.",
    metrics: [
      { value: "3.4x", label: "Signup conversion" },
      { value: "-71%", label: "Page load time" },
      { value: "+180%", label: "Organic sessions" },
      { value: "12k", label: "Students enrolled" },
    ],
    services: ["Web Development", "SEO & Content", "IT Solutions"],
    stack: ["Next.js", "Node.js", "Redis", "Stripe"],
    duration: "9 weeks",
    accent: "#4526c9",
    testimonial: {
      quote:
        "The same traffic, three times the students. Nothing else about our marketing changed.",
      name: "Rabin Karki",
      role: "Co-founder, EduBridge",
    },
  },
  {
    slug: "urban-space",
    client: "Urban Space",
    title: "Property listings that finally load on a phone",
    category: "Real Estate",
    year: "2024",
    summary:
      "A property portal with 4,000 listings and a mobile experience that drove buyers to competitors — rebuilt around search speed.",
    challenge:
      "Search results took eleven seconds on mobile. Google had indexed only a fifth of the listings, and agents were fielding calls for properties that had sold months earlier.",
    approach: [
      "Moved search to a Node.js service with geo-indexed queries and instant filters",
      "Generated listing pages statically with per-property structured data",
      "Automated sold-status sync from the agents' CRM",
      "Rebuilt map browse as a progressive experience that works before the map loads",
    ],
    outcome:
      "Full index coverage within two months and a mobile experience that keeps buyers on the portal. Enquiries per listing nearly doubled.",
    metrics: [
      { value: "11s → 1.2s", label: "Search response" },
      { value: "98%", label: "Listings indexed" },
      { value: "+96%", label: "Enquiries per listing" },
      { value: "4,000+", label: "Live properties" },
    ],
    services: ["Web Development", "IT Solutions", "SEO & Content"],
    stack: ["Next.js", "Node.js", "PostGIS", "Algolia"],
    duration: "11 weeks",
    accent: "#a78bfa",
  },
  {
    slug: "greenpath",
    client: "GreenPath",
    title: "Turning a sustainability report into a lead engine",
    category: "Clean Energy",
    year: "2025",
    summary:
      "A solar installer's annual PDF became an interactive savings calculator that now generates a third of all qualified leads.",
    challenge:
      "GreenPath's best asset — real installation data — sat inside a PDF nobody downloaded. Sales calls opened with the same three questions about cost and payback every time.",
    approach: [
      "Built a savings calculator that estimates payback from roof size and usage",
      "Published a data-backed content cluster around solar cost in Nepal",
      "Piped calculator results into HubSpot as scored, pre-qualified leads",
      "Instrumented the funnel so marketing could see which content closed",
    ],
    outcome:
      "Sales calls now start after the pricing question is answered. Qualified leads tripled and the sales cycle shortened by nearly three weeks.",
    metrics: [
      { value: "3.1x", label: "Qualified leads" },
      { value: "-19 days", label: "Sales cycle" },
      { value: "#1", label: "For 'solar cost Nepal'" },
      { value: "34%", label: "Of pipeline from content" },
    ],
    services: ["SEO & Content", "Digital Marketing", "Web Development"],
    stack: ["Next.js", "Node.js", "HubSpot", "GA4"],
    duration: "6 weeks build, ongoing",
    accent: "#6c47ff",
    testimonial: {
      quote:
        "The calculator does the first sales call for us. Our team now spends its time on people who are ready to buy.",
      name: "Sujata Thapa",
      role: "Head of Growth, GreenPath",
    },
  },
  {
    slug: "craft-studio",
    client: "Craft Studio",
    title: "An artisan marketplace that ships worldwide",
    category: "E-commerce",
    year: "2024",
    summary:
      "Forty independent makers, one storefront, and a checkout that handles international shipping without a spreadsheet.",
    challenge:
      "Craft Studio sold through Instagram DMs. Orders were lost, shipping was quoted by hand, and there was no way for a buyer in Berlin to know what delivery would cost.",
    approach: [
      "Built a multi-vendor storefront with per-maker inventory and payouts",
      "Integrated live international shipping rates and duty estimates",
      "Photographed and structured 400 products with rich product schema",
      "Set up an abandoned-cart flow in the makers' own voice",
    ],
    outcome:
      "The DM backlog is gone. Two-thirds of revenue now comes from outside Nepal, and makers see their own sales dashboard.",
    metrics: [
      { value: "+310%", label: "Revenue year on year" },
      { value: "67%", label: "International orders" },
      { value: "40", label: "Makers onboarded" },
      { value: "22%", label: "Cart recovery rate" },
    ],
    services: ["Web Development", "Brand & Design", "Digital Marketing"],
    stack: ["Next.js", "Node.js", "Stripe Connect", "Sanity"],
    duration: "10 weeks",
    accent: "#4526c9",
  },
];

export const clients = [
  "Himalayan Café",
  "EduBridge",
  "Urban Space",
  "GreenPath",
  "Craft Studio",
] as const;

/** The three figures shown in the hero card. */
export const heroStats = [
  { value: "80%", label: "Avg. Growth\nin 6 Months", icon: "trend" },
  { value: "10+", label: "Happy\nClients", icon: "users" },
  { value: "5+", label: "Projects\nDelivered", icon: "rocket" },
] as const;

export const stats = [
  {
    value: "5+",
    label: "Projects delivered",
    detail: "Across 3 industries",
    icon: "box",
    /** Shape of the mini sparkline beside the figure, as percentages. */
    spark: [30, 44, 52, 70, 100],
  },
  {
    value: "70%",
    label: "Median traffic lift",
    detail: "First 12 months of SEO",
    icon: "trend",
    spark: [18, 30, 48, 72, 100],
  },
  {
    value: "4.8\u00d7",
    label: "Average engagement growth",
    detail: "Across managed campaigns",
    icon: "pulse",
    spark: [26, 38, 46, 78, 100],
  },
  {
    value: "94%",
    label: "Clients who return",
    detail: "Long-term partnerships",
    icon: "users",
    spark: [44, 58, 68, 84, 100],
  },
] as const;

export const processSteps = [
  {
    n: "01",
    title: "Discover",
    duration: "Week 1",
    body: "We audit what you have, interview the people who talk to your customers, and pull the numbers. You get a written diagnosis before anyone opens a design file.",
    deliverables: ["Analytics and technical audit", "Customer and stakeholder interviews", "Opportunity sizing"],
  },
  {
    n: "02",
    title: "Strategy",
    duration: "Week 2",
    body: "We agree on one metric that matters and the shortest route to moving it. Scope, sequence, and success criteria are signed off together — no surprises in week six.",
    deliverables: ["Growth model and target metric", "Scope and roadmap", "Success criteria"],
  },
  {
    n: "03",
    title: "Design",
    duration: "Weeks 3-4",
    body: "Wireframes first, then a design system built from real content. Every screen is reviewed against the metric it is meant to move, not against taste.",
    deliverables: ["Wireframes and user flows", "Design system in Figma", "Content model"],
  },
  {
    n: "04",
    title: "Build",
    duration: "Weeks 5-7",
    body: "Next.js on the front, Node.js behind it. You watch it come together on a staging URL from day one, with weekly demos and a live changelog.",
    deliverables: ["Staging environment from day one", "Weekly demos", "Automated tests and CI"],
  },
  {
    n: "05",
    title: "Launch",
    duration: "Week 8",
    body: "Redirects mapped, schema validated, analytics firing, Core Web Vitals green. We stay on the call through the DNS switch and the first traffic.",
    deliverables: ["Redirect and SEO migration plan", "Performance and accessibility pass", "Team handover session"],
  },
  {
    n: "06",
    title: "Grow",
    duration: "Ongoing",
    body: "Launch is the start of the measurement. We run experiments in two-week cycles and report on the same dashboard your leadership already reads.",
    deliverables: ["Fortnightly experiment cycles", "Monthly performance report", "Quarterly roadmap review"],
  },
];

/** The four things nlogn does, in the order they happen. Shown on /about. */
export const method = [
  {
    n: "01",
    title: "Strategy",
    icon: "target",
    body: "We start by understanding the problem, the opportunity, and what will actually make a difference.",
  },
  {
    n: "02",
    title: "Technology",
    icon: "code",
    body: "We build websites, software, and digital systems designed around real business needs.",
  },
  {
    n: "03",
    title: "Growth",
    icon: "trend",
    body: "We use SEO, digital marketing, content, and performance strategies to turn attention into results.",
  },
  {
    n: "04",
    title: "AI & Automation",
    icon: "flow",
    body: "We automate repetitive work and build smarter systems that help businesses move faster.",
  },
] as const;

export const values = [
  {
    title: "Show the numbers",
    body: "Every engagement opens with a baseline and closes with a comparison. If the work did not move the metric, we say so first.",
  },
  {
    title: "Own what you paid for",
    body: "Code, accounts, domains, design files. All of it is yours from day one, in your repositories and your billing.",
  },
  {
    title: "Speed is a feature",
    body: "A site that loads in under a second outranks and outsells one that does not. We treat performance as scope, not polish.",
  },
  {
    title: "Say the hard thing early",
    body: "If a request will not work, you hear it in week one — with an alternative — rather than in the retrospective.",
  },
];

/**
 * Source photos differ a lot — two studio headshots, two environmental shots —
 * so each carries its own focal point for the 4:5 crop.
 */
export const team = [
  {
    name: "Nischal Katwal",
    role: "Growth & Business",
    initials: "NK",
    photo: "/teams/Nischal-Katwal.jpeg",
    focus: "50% 42%",
  },
  {
    name: "Kabin Ghimire",
    role: "Technology & Systems",
    initials: "KG",
    photo: "/teams/Kabin-Ghimire.jpg",
    focus: "48% 45%",
  },
  {
    name: "Niroj Chamlagain",
    role: "Marketing & Media",
    initials: "NC",
    photo: "/teams/Niroj-Chamlagain.jpeg",
    focus: "50% 22%",
  },
  {
    name: "Richard Pokhrel",
    role: "Creative & Brand",
    initials: "RP",
    photo: "/teams/Richard-Pokhrel.jpeg",
    focus: "56% 45%",
  },
];

export const testimonials = [
  {
    quote:
      "We stopped renting our customers from delivery apps. That single change funded two new branches, and nlogn built the ordering system that made it possible.",
    name: "Anjana Shrestha",
    role: "Founder, Himalayan Café",
    initials: "AS",
  },
  {
    quote:
      "Our cost per enrolled student dropped by half in a quarter. Same budget, sharper funnel, and ad creative nlogn refreshed every week instead of every campaign.",
    name: "Rabin Karki",
    role: "Co-founder, EduBridge",
    initials: "RK",
  },
  {
    quote:
      "We went from page four to the top of the results for the terms that actually bring us buyers. The articles read like a person wrote them, because one did.",
    name: "Pratima Gurung",
    role: "Marketing Lead, Sunrise Homes",
    initials: "PG",
  },
  {
    quote:
      "The launch film they shot and cut for us has run everywhere from cinema screens to Instagram. One shoot, a dozen usable edits, and it still looks like us.",
    name: "Dipesh Rai",
    role: "Brand Manager, Yak Trails",
    initials: "DR",
  },
  {
    quote:
      "They told us in week one that half our brief was a bad idea, showed the data, and proposed something better. That is why we are still working with them.",
    name: "Sujata Thapa",
    role: "Head of Growth, GreenPath",
    initials: "ST",
  },
  {
    quote:
      "Our search went from eleven seconds to just over one. Agents noticed before we announced it.",
    name: "Bikash Adhikari",
    role: "CTO, Urban Space",
    initials: "BA",
  },
];

export const faqs = [
  {
    q: "What does a project cost?",
    a: "Marketing sites start at $4,500 and most land between $6,000 and $15,000 depending on page count and integrations. Custom software starts at $6,000. Retainers begin at $1,200 a month. Every proposal is fixed-scope and fixed-price, so the number you approve is the number you pay.",
  },
  {
    q: "How long does a website take?",
    a: "Five to eight weeks for a marketing site, nine to twelve for a platform or storefront. The single biggest variable is content — projects where copy and photography are ready ship two weeks faster on average.",
  },
  {
    q: "Do you work with businesses outside Nepal?",
    a: "Around half our clients are overseas, mostly in Australia, the UK, and the Gulf. We keep a four-hour overlap with your working day and run every project asynchronously in writing, so timezone is a scheduling detail rather than a risk.",
  },
  {
    q: "Who owns the code and the accounts?",
    a: "You do, without exception. Repositories sit in your organisation, hosting and ad accounts are billed to you, and design files are licensed to you outright. There is no lock-in and nothing to buy back if you leave.",
  },
  {
    q: "Will the new site hurt our existing rankings?",
    a: "Not if the migration is done properly. We crawl the current site, map every URL to its replacement, ship 301 redirects, and monitor Search Console daily for the first month. Most of our migrations gain organic traffic within six weeks.",
  },
  {
    q: "What happens after launch?",
    a: "Thirty days of support are included with every build — bugs, tweaks, and questions. After that you can take a growth retainer, buy support hours as needed, or run it yourself with the documentation we hand over. All three are genuinely fine.",
  },
  {
    q: "Why is the company called nlogn?",
    a: "It is the complexity of an efficient sort — O(n log n). Add more input and the cost grows, but far slower than the output. That is the shape of growth we build for: compounding, not linear.",
  },
];
