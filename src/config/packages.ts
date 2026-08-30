/**
 * NLOGN packages.
 *
 * Each family sells a *system* (the outcome), with the deliverables listed
 * underneath rather than as the headline. Prices are deliberately "from"
 * figures — the real number comes out of a scoping call, so there is one place
 * to edit them here rather than across the site.
 *
 * TODO(pricing): replace the `from` values with your agreed rate card.
 */

export type Tier = {
  name: string;
  badge?: string;
  /** The outcome, in one line. */
  tagline: string;
  summary: string;
  from: string;
  bestFor: string;
  /** 5–7 lines shown on the card without expanding. */
  highlights: string[];
  /** Full deliverables, revealed on demand so the card stays readable. */
  groups: { title: string; items: string[] }[];
};

export type PackageFamily = {
  slug: string;
  n: string;
  name: string;
  system: string;
  pillar: "Digital Growth" | "Search" | "Digital Products" | "AI & Automation" | "Brand";
  model: "Monthly retainer" | "Project" | "System build";
  intro: string;
  from: string;
  icon: "megaphone" | "search" | "code" | "server" | "bot" | "message" | "video" | "target" | "palette";
  tiers: Tier[];
};

export const packageFamilies: PackageFamily[] = [
  {
    slug: "digital-marketing",
    n: "01",
    name: "Digital Marketing",
    system: "Monthly Growth Engine",
    pillar: "Digital Growth",
    model: "Monthly retainer",
    icon: "megaphone",
    from: "$650/mo",
    intro:
      "A complete content and acquisition system designed to turn attention into qualified leads — content, paid media, and the analytics that tell you which of it worked.",
    tiers: [
      {
        name: "Growth Starter",
        tagline: "Show up consistently, and start measuring.",
        summary:
          "For small businesses running serious digital marketing for the first time. Enough output to build a habit, with one paid campaign to test demand.",
        from: "$650/mo",
        bestFor: "Cafés, restaurants, clinics, local businesses",
        highlights: [
          "6 short-form videos and 4 carousels a month",
          "Instagram and Facebook managed end to end",
          "1 Meta Ads campaign, built and optimised",
          "Monthly content calendar and strategy",
          "Performance report with next-month actions",
        ],
        groups: [
          {
            title: "Content",
            items: [
              "6 short-form videos / Reels",
              "4 carousel posts",
              "4 static / promotional posts",
              "8–12 stories",
              "Content calendar",
              "Caption writing",
              "Hashtag and keyword research",
              "Basic creative design",
            ],
          },
          {
            title: "Social media management",
            items: [
              "Instagram management",
              "Facebook management",
              "Content scheduling",
              "Profile optimisation",
              "Community and comment monitoring",
            ],
          },
          {
            title: "Strategy",
            items: [
              "Monthly content strategy",
              "Competitor analysis",
              "Monthly performance report",
              "Next-month recommendations",
            ],
          },
          {
            title: "Paid ads",
            items: [
              "1 Meta Ads campaign",
              "Campaign setup and audience research",
              "Creative selection",
              "Ongoing optimisation",
            ],
          },
        ],
      },
      {
        name: "Growth Pro",
        badge: "Most chosen",
        tagline: "A content engine that generates leads every week.",
        summary:
          "Our main package. Enough volume to compound, a real paid-media programme behind it, and reporting that ties spend to leads.",
        from: "$1,400/mo",
        bestFor: "Businesses ready for consistent lead generation",
        highlights: [
          "10 Reels a month, scripted, shot-directed and edited",
          "6 carousels, 6 statics, 15–20 stories",
          "Instagram, Facebook and TikTok managed",
          "2–4 live Meta campaigns with retargeting",
          "Weekly optimisation and A/B testing",
          "Cost-per-lead reported every month",
        ],
        groups: [
          {
            title: "Content",
            items: [
              "10 Reels / short videos: 3 educational, 2 promotional, 2 problem–solution, 1 behind-the-scenes, 1 testimonial, 1 trend concept",
              "6 carousel posts",
              "6 static posts",
              "15–20 stories",
              "2 promotional campaigns per month",
              "Caption writing, hashtag strategy, content calendar",
            ],
          },
          {
            title: "Video production (per Reel)",
            items: [
              "Concept and hook",
              "Script and shot direction",
              "Editing and subtitles",
              "Motion graphics",
              "Call to action",
              "Platform optimisation",
            ],
          },
          {
            title: "Social management",
            items: [
              "Instagram, Facebook and TikTok",
              "Scheduling",
              "Community, comment and DM monitoring",
              "Profile optimisation",
            ],
          },
          {
            title: "Paid advertising",
            items: [
              "Meta Ads, 2–4 active campaigns",
              "Audience research and retargeting",
              "Creative testing and A/B testing",
              "Weekly optimisation",
            ],
          },
          {
            title: "Analytics",
            items: [
              "Reach, engagement and follower growth",
              "Leads and cost per lead",
              "Ad performance",
              "Top-performing content",
              "Recommendations",
            ],
          },
        ],
      },
      {
        name: "Growth Elite",
        tagline: "Your external growth team.",
        summary:
          "For established businesses that want NLOGN to own acquisition: full-funnel strategy, multi-channel media, and a lead pipeline wired into your CRM.",
        from: "$2,900/mo",
        bestFor: "Established businesses scaling acquisition",
        highlights: [
          "15 Reels, 8 carousels, 8 statics, 20–30 stories",
          "Meta and Google Ads run together",
          "Full funnel: ad → landing page → CRM → follow-up",
          "Persona research and offer positioning",
          "Weekly snapshots, monthly strategy meeting",
          "ROI and ROAS analysis",
        ],
        groups: [
          {
            title: "Content",
            items: [
              "15 Reels / videos",
              "8 carousels",
              "8 static creatives",
              "20–30 stories",
              "2–4 promotional campaigns",
              "Testimonials and UGC-style content",
              "Founder / personal-brand content",
            ],
          },
          {
            title: "Strategy",
            items: [
              "Full competitor analysis",
              "Customer persona research",
              "Monthly growth strategy",
              "Content pillars and campaign strategy",
              "Offer positioning and conversion strategy",
            ],
          },
          {
            title: "Advertising",
            items: [
              "Meta Ads and Google Ads",
              "Retargeting and lookalike audiences",
              "Multiple campaign funnels",
              "Creative testing",
              "Landing-page optimisation",
              "Weekly optimisation",
            ],
          },
          {
            title: "Lead generation",
            items: ["Ad → landing page → form / WhatsApp → CRM → follow-up, built and monitored"],
          },
          {
            title: "Reporting",
            items: [
              "Weekly performance snapshot",
              "Monthly strategy meeting",
              "Detailed analytics",
              "ROI / ROAS analysis",
              "Growth recommendations",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "seo",
    n: "02",
    name: "SEO",
    system: "Organic Growth System",
    pillar: "Search",
    model: "Monthly retainer",
    icon: "search",
    from: "$700/mo",
    intro:
      "Sold as a 6–12 month growth system, not a ranking promise. We fix the crawl, build the topic clusters, and publish on a cadence you can sustain.",
    tiers: [
      {
        name: "SEO Foundation",
        tagline: "Fix what is broken, then start publishing.",
        summary:
          "One-time technical setup plus monthly management. The right starting point for any site that has never had SEO done properly.",
        from: "$700/mo",
        bestFor: "Sites with technical debt and no content engine",
        highlights: [
          "Full technical audit and fix list",
          "50–100 keywords mapped to search intent",
          "On-page optimisation across the site",
          "4 SEO articles a month, 1,500–2,000 words",
          "Schema implementation",
          "Monthly SEO report",
        ],
        groups: [
          {
            title: "Technical SEO",
            items: [
              "Website audit",
              "Crawl and indexing analysis",
              "Sitemap optimisation",
              "Robots.txt and canonical setup",
              "Broken-link analysis",
              "Page-speed recommendations",
              "Core Web Vitals review",
              "Schema implementation",
            ],
          },
          {
            title: "Keyword research",
            items: [
              "50–100 keywords",
              "Search-intent mapping",
              "Competitor keyword analysis",
              "Keyword clustering",
            ],
          },
          {
            title: "On-page SEO",
            items: [
              "Title optimisation",
              "Meta descriptions",
              "Heading structure",
              "Internal linking",
              "Image ALT optimisation",
              "URL optimisation",
            ],
          },
          {
            title: "Content",
            items: [
              "4 SEO articles per month",
              "1,500–2,000 words each",
              "Search-intent focused",
              "Internal links and on-page optimisation",
            ],
          },
        ],
      },
      {
        name: "SEO Growth",
        badge: "Most chosen",
        tagline: "Compete properly in search.",
        summary:
          "Everything in Foundation, plus the publishing volume, off-page work and local presence needed to move competitive terms.",
        from: "$1,500/mo",
        bestFor: "Businesses competing on commercial keywords",
        highlights: [
          "8 SEO articles and 2 landing pages a month",
          "Topic clusters and pillar content",
          "Backlink research and link-building campaigns",
          "Google Business Profile and local SEO",
          "Continuous technical monitoring",
          "Keyword, traffic and conversion reporting",
        ],
        groups: [
          {
            title: "Content",
            items: [
              "8 SEO articles per month",
              "2 landing pages per month",
              "Topic clusters",
              "Pillar content",
              "FAQ content",
            ],
          },
          {
            title: "Technical SEO",
            items: [
              "Continuous technical monitoring",
              "Core Web Vitals",
              "Indexation monitoring",
              "Structured data",
              "Internal-link optimisation",
            ],
          },
          {
            title: "Off-page",
            items: [
              "Backlink research",
              "Digital PR opportunities",
              "Link-building campaigns",
              "Competitor backlink analysis",
              "Local citations",
            ],
          },
          {
            title: "Local SEO",
            items: [
              "Google Business Profile optimisation",
              "Local keyword targeting",
              "Local landing pages",
              "Citation management",
              "Review strategy",
            ],
          },
          {
            title: "Reporting",
            items: [
              "Keyword movement",
              "Organic traffic",
              "Search Console health",
              "Conversions",
              "Backlinks",
            ],
          },
        ],
      },
      {
        name: "SEO Authority",
        tagline: "Own the category in search.",
        summary:
          "For companies building long-term organic dominance — topical authority, digital PR, and visibility inside AI search results.",
        from: "$3,200/mo",
        bestFor: "Companies playing a multi-year organic game",
        highlights: [
          "12–16 articles, 4 landing pages, 2 pillar pages a month",
          "Topical authority and content-gap strategy",
          "Strategic link building and digital PR",
          "Featured snippet and AI-search optimisation",
          "Entity and brand search strategy",
          "Conversion optimisation on organic landing pages",
        ],
        groups: [
          {
            title: "Monthly production",
            items: [
              "12–16 SEO articles",
              "4 landing pages",
              "2 pillar pages",
              "Content refreshes",
            ],
          },
          {
            title: "Advanced strategy",
            items: [
              "Topical authority strategy",
              "Content gap analysis",
              "SERP analysis",
              "Featured snippet optimisation",
              "AI-search visibility optimisation",
              "Entity optimisation",
              "Brand search strategy",
            ],
          },
          {
            title: "Ongoing",
            items: [
              "Advanced technical SEO",
              "Competitor monitoring",
              "Digital PR",
              "Strategic link building",
              "Local SEO",
              "Conversion optimisation",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "websites",
    n: "03",
    name: "Website Development",
    system: "Conversion-Ready Website",
    pillar: "Digital Products",
    model: "Project",
    icon: "code",
    from: "$1,800",
    intro:
      "Project-based builds on Next.js and Node.js — fast, accessible, and structured so your team can run it without a developer on standby.",
    tiers: [
      {
        name: "Website Starter",
        tagline: "A credible site, live in two weeks.",
        summary:
          "Five to seven pages with custom UI, proper SEO foundations and analytics wired up from day one.",
        from: "$1,800",
        bestFor: "New businesses and first proper websites",
        highlights: [
          "5–7 pages with custom UI",
          "Fully responsive and mobile optimised",
          "Contact forms and WhatsApp integration",
          "SEO foundation, Analytics and Search Console",
          "Performance optimisation and deployment",
          "Live in 7–14 days",
        ],
        groups: [
          {
            title: "Pages",
            items: ["Home", "About", "Services", "Contact", "FAQ", "Privacy", "One additional page"],
          },
          {
            title: "Included",
            items: [
              "Custom UI",
              "Responsive design and mobile optimisation",
              "Contact forms",
              "WhatsApp integration",
              "Basic animations",
              "SEO foundation",
              "Google Analytics and Search Console",
              "Performance optimisation",
              "Deployment",
            ],
          },
          { title: "Timeline", items: ["7–14 days"] },
        ],
      },
      {
        name: "Website Pro",
        badge: "Most chosen",
        tagline: "A website that works as a sales channel.",
        summary:
          "Ten to fifteen pages with a CMS your team controls, a blog, booking, and the integrations that turn visits into enquiries.",
        from: "$4,500",
        bestFor: "Businesses that need the site to generate leads",
        highlights: [
          "10–15 pages, custom UI/UX and premium animations",
          "CMS and blog your team can run",
          "Booking system and lead forms",
          "CRM and newsletter integration",
          "Advanced SEO and conversion tracking",
          "30 days post-launch support",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Custom UI/UX",
              "Premium animations",
              "CMS and blog",
              "Advanced SEO",
              "Lead forms",
              "WhatsApp integration",
              "Booking system",
              "Google Maps",
              "Analytics and conversion tracking",
              "Newsletter integration",
              "CRM integration",
              "Speed optimisation",
              "Security configuration",
            ],
          },
          { title: "Bonus", items: ["30 days post-launch support"] },
        ],
      },
      {
        name: "Website Enterprise",
        tagline: "A custom digital platform.",
        summary:
          "UX research, a real design system, authentication, dashboards and payments — a website that behaves like a product.",
        from: "$12,000",
        bestFor: "Companies needing a platform, not a brochure",
        highlights: [
          "UX research and a custom design system",
          "20+ pages with CMS",
          "User authentication and dashboards",
          "Booking, payments and API integrations",
          "Multi-language support",
          "Performance engineering",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "UX research",
              "Custom design system",
              "20+ pages",
              "CMS",
              "User authentication",
              "Dashboard",
              "Booking",
              "Payments",
              "API integrations",
              "CRM",
              "Advanced analytics",
              "Multi-language support",
              "Custom animations",
              "Advanced SEO",
              "Performance engineering",
            ],
          },
          {
            title: "Technology",
            items: ["Next.js", "React", "Node.js", "PostgreSQL", "Supabase", "Chosen per requirement"],
          },
        ],
      },
    ],
  },

  {
    slug: "software",
    n: "04",
    name: "Software Development",
    system: "Software Built Around Your Operation",
    pillar: "Digital Products",
    model: "Project",
    icon: "server",
    from: "$6,000",
    intro:
      "We build software around how your business actually works — not around a template. Discovery first, architecture second, code third.",
    tiers: [
      {
        name: "Software MVP",
        tagline: "The smallest system that proves the model.",
        summary:
          "Requirements, architecture, core functionality and a working product in front of real users.",
        from: "$6,000",
        bestFor: "Startups and first internal systems",
        highlights: [
          "Requirements analysis and database architecture",
          "UI/UX design",
          "Authentication with admin and user dashboards",
          "Core business functionality and API",
          "Deployment and basic analytics",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Requirements analysis",
              "UI/UX design",
              "Database architecture",
              "Authentication",
              "Admin dashboard",
              "User dashboard",
              "Core business functionality",
              "API development",
              "Deployment",
              "Basic analytics",
            ],
          },
          {
            title: "Example",
            items: [
              "A restaurant management system: admin → orders → inventory → staff → reports",
            ],
          },
        ],
      },
      {
        name: "Business Software",
        badge: "Most chosen",
        tagline: "Replace the spreadsheets and the manual handoffs.",
        summary:
          "A full internal platform: staff and customer portals, role-based permissions, integrations, reporting and payments.",
        from: "$18,000",
        bestFor: "Established businesses outgrowing manual process",
        highlights: [
          "Custom web application with admin and staff dashboards",
          "Customer portal and role-based permissions",
          "API integrations and notifications",
          "Reports, analytics and payment integration",
          "CRM integration and cloud deployment",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Custom web application",
              "Admin dashboard",
              "Staff dashboard",
              "Customer portal",
              "Authentication",
              "Role-based permissions",
              "Database",
              "API integrations",
              "Notifications",
              "Reports and analytics",
              "Payment integration",
              "CRM integration",
              "Cloud deployment",
            ],
          },
          {
            title: "Optional modules",
            items: [
              "Mobile application",
              "POS",
              "ERP modules",
              "Inventory",
              "Accounting",
              "HR",
              "Customer portal",
            ],
          },
        ],
      },
      {
        name: "Enterprise Software",
        tagline: "Completely custom, built to be maintained.",
        summary:
          "Discovery through maintenance, with architecture and documentation designed for the team that inherits it.",
        from: "By proposal",
        bestFor: "Multi-team operations and regulated environments",
        highlights: [
          "Discovery → architecture → UX → build → test → deploy → maintain",
          "ERP, CRM, marketplace and SaaS platforms",
          "Booking, logistics, HR and financial systems",
          "Documented handover and runbooks",
        ],
        groups: [
          {
            title: "Process",
            items: [
              "Discovery",
              "Architecture",
              "UX",
              "Development",
              "Testing",
              "Deployment",
              "Maintenance",
            ],
          },
          {
            title: "Systems we build",
            items: [
              "ERP",
              "CRM",
              "Booking platforms",
              "Marketplaces",
              "SaaS",
              "Education platforms",
              "Logistics systems",
              "HR systems",
              "Financial systems",
              "Internal business platforms",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "ai-automation",
    n: "05",
    name: "AI Automation",
    system: "Repetitive Work, Removed",
    pillar: "AI & Automation",
    model: "System build",
    icon: "bot",
    from: "$1,200",
    intro:
      "We do not sell 'AI automation'. We remove repetitive work from your business — then show you the hours it gave back.",
    tiers: [
      {
        name: "Automation Starter",
        tagline: "Three workflows that stop costing you evenings.",
        summary:
          "Pick the three jobs your team repeats most. We automate them, wire them to the tools you already use, and hand over the documentation.",
        from: "$1,200",
        bestFor: "First automation project",
        highlights: [
          "Up to 3 automated workflows",
          "AI chatbot and FAQ assistant",
          "Basic AI lead qualification",
          "Website, WhatsApp, Gmail, Sheets and CRM integrations",
        ],
        groups: [
          {
            title: "Choose up to 3 automations",
            items: [
              "Lead capture",
              "WhatsApp automation",
              "Email automation",
              "Appointment reminders",
              "Lead notifications",
              "Form → CRM",
              "Customer follow-up",
              "Review requests",
              "Invoice notifications",
            ],
          },
          { title: "AI", items: ["AI chatbot", "FAQ assistant", "Basic AI lead qualification"] },
          {
            title: "Integrations",
            items: ["Website", "WhatsApp", "Gmail", "Google Sheets", "CRM"],
          },
        ],
      },
      {
        name: "Automation Pro",
        badge: "Most chosen",
        tagline: "Your lead-to-sale path runs itself.",
        summary:
          "Seven to ten connected workflows covering leads, appointments, support and sales — with reporting on what each one saved.",
        from: "$3,500",
        bestFor: "Teams drowning in inbound admin",
        highlights: [
          "7–10 automated workflows",
          "Facebook lead → CRM → AI qualification → WhatsApp → salesperson",
          "Booking → confirmation → reminder → follow-up",
          "AI support with human escalation",
          "AI lead scoring into your CRM",
          "Automated reporting",
        ],
        groups: [
          {
            title: "Workflow examples",
            items: [
              "Lead automation: Facebook lead → CRM → AI qualification → WhatsApp → salesperson",
              "Appointments: booking → confirmation → reminder → follow-up",
              "Support: customer → AI → knowledge base → answer → human escalation",
              "Sales: lead → AI scoring → CRM → follow-up → sales notification",
            ],
          },
          {
            title: "Included",
            items: [
              "AI chatbot",
              "AI lead qualification",
              "WhatsApp automation",
              "Email automation",
              "CRM integration",
              "Google Workspace and Calendar",
              "Webhooks and API integrations",
              "Automated reporting",
            ],
          },
        ],
      },
      {
        name: "AI Business Automation",
        tagline: "We audit the whole operation, then rebuild it.",
        summary:
          "Our premium engagement. We map lead → sales → operations → customer → retention, find the repetitive work, and build the architecture that removes it.",
        from: "By proposal",
        bestFor: "Businesses handling hundreds of enquiries a month",
        highlights: [
          "Full business process audit",
          "Repetitive-work analysis across every team",
          "Automation architecture designed and documented",
          "Implementation, monitoring and optimisation",
          "Management dashboard over the whole flow",
        ],
        groups: [
          {
            title: "How it runs",
            items: [
              "Step 1 — business process audit: map lead → sales → operations → customer → retention",
              "Step 2 — identify repetitive work",
              "Step 3 — build automation architecture",
              "Step 4 — implement",
              "Step 5 — monitor and optimise",
            ],
          },
          {
            title: "What it looks like in practice",
            items: [
              "Lead arrives → AI responds → AI qualifies → AI detects intent",
              "CRM updated automatically → appointment booked automatically",
              "Sales team notified → follow-up triggered → reminders sent",
              "Management receives a live dashboard",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "ai-chatbots",
    n: "06",
    name: "AI Chatbots & Agents",
    system: "Always-On Front Desk",
    pillar: "AI & Automation",
    model: "System build",
    icon: "message",
    from: "$900",
    intro:
      "An assistant that answers, qualifies and books — trained on your own material and handing over to a human at the right moment.",
    tiers: [
      {
        name: "Chatbot Starter",
        tagline: "Answer the same twenty questions, automatically.",
        summary:
          "A website chatbot trained on your FAQs that captures contacts and hands off cleanly to your team.",
        from: "$900",
        bestFor: "Sites fielding repetitive enquiries",
        highlights: [
          "Website chatbot",
          "FAQ knowledge base",
          "Lead and contact capture",
          "Human handoff",
          "Basic analytics",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Website chatbot",
              "FAQ knowledge base",
              "Lead capture",
              "Contact collection",
              "Human handoff",
              "Basic analytics",
            ],
          },
        ],
      },
      {
        name: "AI Sales Agent",
        badge: "Most chosen",
        tagline: "It qualifies and books while you sleep.",
        summary:
          "Everything in Starter, plus qualification, recommendations, appointment booking and CRM sync.",
        from: "$2,400",
        bestFor: "Businesses where speed to lead decides the sale",
        highlights: [
          "Lead qualification",
          "Product and service recommendations",
          "Appointment booking",
          "CRM integration and follow-up",
          "Email and WhatsApp notifications",
        ],
        groups: [
          {
            title: "Everything in Chatbot Starter, plus",
            items: [
              "Lead qualification",
              "Product / service recommendations",
              "Appointment booking",
              "CRM integration",
              "Follow-up sequences",
              "Email notifications",
              "WhatsApp integration",
            ],
          },
        ],
      },
      {
        name: "AI Business Agent",
        tagline: "Several agents, one operating layer.",
        summary:
          "Multiple knowledge bases and agents working across your internal tools, with document processing and reporting.",
        from: "By proposal",
        bestFor: "Multi-department operations",
        highlights: [
          "Multiple knowledge bases and agents",
          "Advanced workflows",
          "API and internal tool integrations",
          "Document processing",
          "Reporting",
        ],
        groups: [
          {
            title: "Everything in AI Sales Agent, plus",
            items: [
              "Multiple knowledge bases",
              "Advanced workflows",
              "API integrations",
              "CRM and internal tools",
              "Document processing",
              "Reporting",
              "Multiple AI agents",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "content",
    n: "07",
    name: "Social Media Content",
    system: "Content Production Studio",
    pillar: "Digital Growth",
    model: "Monthly retainer",
    icon: "video",
    from: "$450/mo",
    intro:
      "Production only, for teams who run their own channels but cannot keep up with the output. Concept, script, shoot direction and edit.",
    tiers: [
      {
        name: "Content Starter",
        tagline: "Enough output to stay visible.",
        summary: "A steady monthly drop of short-form video and social creative, captioned and scheduled.",
        from: "$450/mo",
        bestFor: "Teams managing their own channels",
        highlights: ["6 Reels", "4 carousels", "4 static posts", "10 stories", "Captions and content calendar"],
        groups: [
          {
            title: "Monthly",
            items: ["6 Reels", "4 carousels", "4 static posts", "10 stories", "Captions", "Content calendar"],
          },
        ],
      },
      {
        name: "Content Pro",
        badge: "Most chosen",
        tagline: "Production volume that actually moves reach.",
        summary: "Double the output, with scripting and creative strategy behind each piece.",
        from: "$900/mo",
        bestFor: "Brands posting daily",
        highlights: [
          "10 Reels",
          "6 carousels",
          "6 static posts",
          "20 stories",
          "Scripts, editing and captions",
          "Creative strategy",
        ],
        groups: [
          {
            title: "Monthly",
            items: [
              "10 Reels",
              "6 carousels",
              "6 static posts",
              "20 stories",
              "Scripts",
              "Editing",
              "Captions",
              "Creative strategy",
              "Content calendar",
            ],
          },
        ],
      },
      {
        name: "Content Studio",
        tagline: "A studio on retainer.",
        summary:
          "Professional scripting, advanced editing, motion graphics and monthly shoot planning.",
        from: "$1,800/mo",
        bestFor: "Brands treating content as a channel",
        highlights: [
          "15 Reels",
          "8 carousels",
          "8 static posts",
          "30 stories",
          "Motion graphics and UGC concepts",
          "Monthly shoot planning",
        ],
        groups: [
          {
            title: "Monthly",
            items: [
              "15 Reels",
              "8 carousels",
              "8 static posts",
              "30 stories",
              "Professional scripts",
              "Advanced editing",
              "Motion graphics",
              "UGC concepts",
              "Campaign creatives",
              "Monthly shoot planning",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "google-ads",
    n: "08",
    name: "Google Ads",
    system: "Intent Capture",
    pillar: "Digital Growth",
    model: "Monthly retainer",
    icon: "target",
    from: "$550/mo",
    intro:
      "Catch demand that already exists. Search first, then the channels that scale it — with conversion tracking you can trust.",
    tiers: [
      {
        name: "Google Ads Starter",
        tagline: "Capture the searches you are already losing.",
        summary: "One search campaign, set up properly, with conversion tracking and monthly optimisation.",
        from: "$550/mo",
        bestFor: "First Google Ads programme",
        highlights: [
          "Account setup and keyword research",
          "Search campaign build",
          "Ad copy",
          "Conversion tracking",
          "Monthly optimisation and report",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Account setup",
              "Keyword research",
              "Search campaign",
              "Ad copy",
              "Conversion tracking",
              "Monthly optimisation",
              "Monthly report",
            ],
          },
        ],
      },
      {
        name: "Google Ads Growth",
        badge: "Most chosen",
        tagline: "Search, display and remarketing working together.",
        summary: "Multiple campaigns with landing-page optimisation and weekly testing.",
        from: "$1,100/mo",
        bestFor: "Businesses ready to scale spend",
        highlights: [
          "Search, display and remarketing",
          "Multiple campaigns",
          "Landing page optimisation",
          "A/B testing",
          "Weekly optimisation",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Search",
              "Display",
              "Remarketing",
              "Multiple campaigns",
              "Landing page optimisation",
              "Conversion tracking",
              "A/B testing",
              "Weekly optimisation",
            ],
          },
        ],
      },
      {
        name: "Google Ads Performance",
        tagline: "Every surface Google sells, managed as one funnel.",
        summary:
          "Search, display, YouTube and Performance Max, optimised against funnel stage rather than channel.",
        from: "$2,200/mo",
        bestFor: "High-spend accounts",
        highlights: [
          "Search, display, YouTube and Performance Max",
          "Remarketing",
          "Conversion optimisation",
          "Advanced analytics",
          "Funnel optimisation",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Search",
              "Display",
              "YouTube",
              "Remarketing",
              "Performance Max",
              "Conversion optimisation",
              "Advanced analytics",
              "Funnel optimisation",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "brand",
    n: "09",
    name: "Brand & Digital Foundation",
    system: "Identity That Scales",
    pillar: "Brand",
    model: "Project",
    icon: "palette",
    from: "$1,400",
    intro:
      "The system every other service draws from: how you look, how you sound, and the templates that keep it consistent when you are not in the room.",
    tiers: [
      {
        name: "Brand Starter",
        tagline: "Tidy up what you have.",
        summary: "Logo refinement, a proper colour and type system, and the templates your team uses daily.",
        from: "$1,400",
        bestFor: "Businesses with a logo but no system",
        highlights: [
          "Logo refinement",
          "Colour system and typography",
          "Brand guidelines",
          "Social media templates",
          "Business card and email signature",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Logo refinement",
              "Colour system",
              "Typography",
              "Brand guidelines",
              "Social media templates",
              "Business card",
              "Email signature",
            ],
          },
        ],
      },
      {
        name: "Brand Pro",
        badge: "Most chosen",
        tagline: "Position first, then design.",
        summary:
          "Strategy, identity and a graphic system that holds up across a website, an app, a deck and a shopfront.",
        from: "$3,600",
        bestFor: "Rebrands and new market positioning",
        highlights: [
          "Brand strategy",
          "Logo and visual identity",
          "Typography and colour system",
          "Graphic system and social templates",
          "Website direction",
          "Brand guidelines",
        ],
        groups: [
          {
            title: "Included",
            items: [
              "Brand strategy",
              "Logo",
              "Visual identity",
              "Typography",
              "Colour system",
              "Graphic system",
              "Social templates",
              "Website direction",
              "Brand guidelines",
            ],
          },
        ],
      },
    ],
  },
];

/** The five pillars, used for the service architecture on /services. */
export const pillars = [
  {
    name: "Digital Growth",
    blurb: "Attention, campaigns and demand.",
    items: ["Social Media", "Content", "Meta Ads", "Google Ads", "Lead Generation"],
  },
  {
    name: "Search",
    blurb: "Compounding organic visibility.",
    items: ["SEO", "Local SEO", "Technical SEO", "AI Search Optimisation"],
  },
  {
    name: "Digital Products",
    blurb: "The things people actually use.",
    items: ["Websites", "Web Applications", "SaaS", "Custom Software"],
  },
  {
    name: "AI & Automation",
    blurb: "Work your team stops doing by hand.",
    items: ["AI Chatbots", "AI Agents", "Business Automation", "CRM Automation", "Workflow Automation"],
  },
  {
    name: "Custom Growth Stack",
    blurb: "Combinations built around one business.",
    items: ["Mixed engagements", "Phased rollouts", "Retainer + project"],
  },
] as const;

/** Worked combinations — more useful to a buyer than a price list. */
export const stackExamples = [
  { who: "Restaurant", stack: ["Website", "Social", "Meta Ads", "WhatsApp Automation"] },
  { who: "Consultancy", stack: ["Website", "SEO", "Content", "Lead Generation", "CRM Automation"] },
  { who: "E-commerce", stack: ["Website", "SEO", "Meta Ads", "Google Ads", "AI Customer Support"] },
  { who: "Established company", stack: ["Custom Software", "AI Automation", "CRM", "Digital Marketing"] },
];

/** Inputs for the Build Your Growth Stack picker. */
export const stackBuilder = {
  needs: [
    "Website",
    "Software",
    "AI Automation",
    "SEO",
    "Social Media",
    "Meta Ads",
    "Google Ads",
    "Branding",
    "AI Chatbot",
  ],
  goals: [
    "Get more leads",
    "Increase sales",
    "Build online presence",
    "Automate operations",
    "Reduce manual work",
    "Launch a product",
    "Improve search visibility",
  ],
  existing: [
    "Website",
    "Social media",
    "CRM",
    "Google Business Profile",
    "Ads",
    "Existing software",
    "Nothing yet",
  ],
} as const;
