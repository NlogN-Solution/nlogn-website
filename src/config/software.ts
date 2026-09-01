/**
 * Software products — the platforms we build and run, as opposed to the client
 * sites in `config/clients.ts`.
 *
 * Each entry powers three things with no component changes: a card in the
 * Software tab of the clients section, the `/software` index, and a full
 * write-up at `/software/<slug>`. Add a product by appending an object.
 *
 * `status` is what the card badge says and what the write-up leads with:
 *   live        — running in production today
 *   beta        — in the hands of early users, still moving fast
 *   development — being built now, not yet released
 *
 * A product with no `thumbnail` renders a generated poster instead of a
 * screenshot, so an unreleased build never needs a mocked-up UI shot.
 */

export type SoftwareStatus = "live" | "beta" | "development";

export type SoftwareProduct = {
  slug: string;
  name: string;
  /** One line under the name, on the card and in the write-up header. */
  tagline: string;
  /** Sector tag. Keep it to one or two words. */
  sector: string;
  status: SoftwareStatus;
  /** Card blurb — two sentences at most. */
  summary: string;
  /** Opening paragraphs of the write-up. */
  intro: string[];
  /** Path under /public. Left out, the card draws a poster from `monogram`. */
  thumbnail?: string;
  /** Extra shots for the write-up. The thumbnail is prepended automatically. */
  screenshots?: { src: string; caption: string }[];
  /** Two letters, used by the generated poster. */
  monogram: string;
  /** Hex accent for the poster and the write-up header wash. */
  accent: string;
  /** Public marketing site or demo, when there is one. */
  projectUrl?: string;
  stack: string[];
  /** Who the product is built for. Shown in the sidebar. */
  audience: string[];
  /** The `Project Highlights` block — descriptive, never a performance claim. */
  highlights: { label: string; value: string }[];
  problem: { body: string; pains: string[] };
  vision: { headline: string; body: string[] };
  /** The numbered feature walk-through — the bulk of the write-up. */
  modules: { title: string; body: string; bullets?: string[] }[];
  /** Layer diagram. Omitted on smaller products. */
  architecture?: { layer: string; body: string; items: string[] }[];
  /** Only meaningful while `status` is "development" or "beta". */
  roadmap?: { stage: string; detail: string; done: boolean }[];
  /** Closing line of the write-up. */
  closing: string;
};

export const STATUS_LABEL: Record<SoftwareStatus, string> = {
  live: "In production",
  beta: "Private beta",
  development: "In development",
};

export const softwareProducts: SoftwareProduct[] = [
  /* ── ED360 ────────────────────────────────────────────────────────────── */
  {
    slug: "ed360",
    name: "ED360",
    tagline: "An intelligent business operating system for consultancy firms",
    sector: "Consultancy",
    status: "live",
    summary:
      "CRM, employee management, payroll, analytics and AI in one platform, built for consultancies that outgrew running the business across a CRM, a spreadsheet and a group chat.",
    intro: [
      "ED360 is an advanced CRM and business management platform designed specifically for consultancy businesses that need more than traditional lead management.",
      "Instead of relying on separate tools for CRM, employee management, payroll, communication, reporting and day-to-day operations, ED360 brings the core functions of a consultancy business into a single intelligent platform.",
      "With automation, AI-powered capabilities, integrations, centralised data and operational dashboards, ED360 helps consultancy teams manage their entire business from one place.",
    ],
    thumbnail: "/software/ed-360.png",
    monogram: "ED",
    accent: "#2563eb",
    stack: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "Redis", "OpenAI"],
    audience: ["Super admins", "Administrators", "Managers", "Employees"],
    highlights: [
      { label: "Product type", value: "Enterprise CRM & business management platform" },
      { label: "Industry", value: "Consultancy / professional services" },
      { label: "Primary users", value: "Admins, managers, employees" },
      { label: "Core focus", value: "CRM, operations, automation & intelligence" },
    ],
    problem: {
      body: "Consultancy businesses often operate across multiple disconnected systems. Leads are tracked in a CRM, employee information lives in spreadsheets, salary calculations are handled manually, and follow-ups depend on individual employees remembering them. Reports require stitching data back together by hand. As the business grows, the seams start to show.",
      pains: [
        "Scattered business data",
        "Manual administrative work",
        "Poor visibility into employee performance",
        "Missed lead follow-ups",
        "Repetitive operational tasks",
        "Difficulty tracking conversions",
        "Complicated salary management",
        "Limited real-time business insight",
      ],
    },
    vision: {
      headline: "One platform. Every operation. Intelligent by default.",
      body: [
        "The goal behind ED360 was to create a centralised digital infrastructure for consultancy businesses. Rather than simply recording customer information like a traditional CRM, ED360 connects different parts of the organisation together.",
        "A lead moves through the sales pipeline. An employee manages that lead. The system tracks the employee's performance. The resulting business activity feeds reports and analytics. Management uses those insights to make better operational decisions.",
        "That creates a connected business ecosystem rather than a collection of isolated tools.",
      ],
    },
    modules: [
      {
        title: "Lead & CRM management",
        body: "The complete lifecycle of a lead, from acquisition through to conversion, with every interaction attached to one centralised profile.",
        bullets: [
          "Lead capture, profiles and categorisation",
          "Assignment, status management and follow-up tracking",
          "Sales pipeline management and activity history",
          "Notes, communication records and conversion tracking",
        ],
      },
      {
        title: "Employee management",
        body: "A centralised view of the team — not only who works in the organisation, but how each person contributes to business performance.",
        bullets: [
          "Employee profiles, departments and organisational structure",
          "Roles, permissions and employee status",
          "Assigned leads, activity and work history",
          "Performance metrics and attendance information",
        ],
      },
      {
        title: "Salary & payroll",
        body: "Payroll sits inside the operational platform rather than in a parallel spreadsheet, so compensation data connects to the employee records it belongs to.",
        bullets: [
          "Salary records, structures and payroll periods",
          "Allowances, deductions and bonuses",
          "Payroll calculations, payment records and history",
          "Payroll reporting for management",
        ],
      },
      {
        title: "AI-powered business intelligence",
        body: "The objective was never to bolt a chatbot onto a CRM — it was to make the business data already in the system useful without someone having to read every row.",
        bullets: [
          "Lead analysis, prioritisation and customer insight",
          "Follow-up recommendations and business summaries",
          "Automated insights and performance analysis",
          "Report generation and intelligent search",
        ],
      },
      {
        title: "Sales pipeline",
        body: "Leads move through stages configured around the organisation's own workflow — new lead, contacted, qualified, consultation, processing, converted — with the whole pipeline visible from one dashboard.",
        bullets: [
          "New opportunities and stalled leads surfaced",
          "High-value prospects flagged",
          "Conversion bottlenecks made visible",
          "Overall sales velocity tracked",
        ],
      },
      {
        title: "Employee performance analytics",
        body: "Because lead activity and employee activity are connected, employee management stops being an administrative function and becomes a data-driven one.",
        bullets: [
          "Leads assigned, contacted and converted",
          "Follow-ups completed and activity volume",
          "Conversion rate and revenue contribution",
          "Pipeline performance per person and per team",
        ],
      },
      {
        title: "Role-specific dashboards",
        body: "Management gets a high-level view of the organisation — total and active leads, conversion rate, revenue, pipeline distribution, payroll overview. Employees get a focused workspace holding only their assigned leads, follow-ups, tasks and notifications.",
      },
      {
        title: "Role-based access control",
        body: "Permissions are structured around super admin, administrator, manager and employee roles, so people see the information and functionality their responsibilities actually call for.",
      },
      {
        title: "Automation",
        body: "Reducing repetitive manual work was a first-class design goal, not an afterthought.",
        bullets: [
          "Lead assignment and follow-up reminders",
          "Notifications, alerts and status updates",
          "Recurring operational and reporting workflows",
          "Data synchronisation between systems",
        ],
      },
      {
        title: "Integrations",
        body: "ED360 is built to operate as part of a larger technology ecosystem rather than to lock a business into one. Communication platforms, email and messaging, payments, accounting, calendars, cloud storage, analytics and external APIs all connect through the same integration layer.",
      },
      {
        title: "Reporting & analytics",
        body: "Operational activity is converted into business-level information: lead sources, volume, conversion rates and pipeline movement; individual and team performance; revenue, growth and overall pipeline health.",
      },
    ],
    architecture: [
      {
        layer: "Experience",
        body: "The interface through which users interact with the platform.",
        items: ["Admin dashboard", "Employee dashboard", "CRM interface", "Analytics", "Payroll", "Settings"],
      },
      {
        layer: "Application",
        body: "Business logic and workflows.",
        items: ["Lead management", "Employee management", "Payroll", "Automation", "Permissions", "Reporting"],
      },
      {
        layer: "Intelligence",
        body: "The AI layer that makes business data actionable.",
        items: ["Analysis", "Recommendations", "Summaries", "Intelligent search", "Business insights"],
      },
      {
        layer: "Integration",
        body: "Connects ED360 with external services and APIs.",
        items: ["Email", "Messaging", "Payments", "Accounting", "Calendars", "Storage"],
      },
      {
        layer: "Data",
        body: "Centralised storage for everything the platform relates together.",
        items: ["Users", "Employees", "Leads", "Activities", "Payroll", "Reports", "Permissions"],
      },
    ],
    closing:
      "Traditional CRM platforms focus on customers and sales. ED360 combines CRM, HR operations, payroll, analytics, automation, AI and integrations into one system — less a CRM, more a business operating system for consultancy companies.",
  },

  /* ── Ignition ─────────────────────────────────────────────────────────── */
  {
    slug: "ignition",
    name: "Ignition",
    tagline: "Run your consultancy like a control tower",
    sector: "Education",
    status: "live",
    summary:
      "An admissions workspace that tracks every student from first call to visa stamp — leads, eligibility, documents, applications, offers and payments in one pipeline the whole team can see.",
    intro: [
      "Ignition is an admissions and operations platform built for international education consultancies — the firms that take a student from a first enquiry through eligibility, university shortlisting, application, offer and enrolment.",
      "That journey touches half a dozen people and generates a stack of paperwork. Before Ignition, most of it lived in spreadsheets, inboxes and a shared drive, which meant nobody could answer the only question that mattered: where is this student right now, and what is stopping them moving forward?",
      "Ignition puts the whole journey in one pipeline, attaches the documents to the student rather than to a folder, and gives counsellors, document officers and management a view of the same file.",
    ],
    thumbnail: "/software/ignition-crm-dashboard.png",
    monogram: "Ig",
    accent: "#2f6bff",
    projectUrl: "https://ignition-website.vercel.app/",
    stack: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "Tailwind CSS"],
    audience: ["Counsellors", "Document officers", "Branch managers", "Directors"],
    highlights: [
      { label: "Product type", value: "Admissions CRM & operations platform" },
      { label: "Industry", value: "International education consultancy" },
      { label: "Primary users", value: "Counsellors, admissions staff, management" },
      { label: "Core focus", value: "Student pipeline, documents, applications" },
    ],
    problem: {
      body: "An education consultancy is a document business wearing a sales business's clothes. Every student generates transcripts, passports, financial evidence, English test results, offer letters and visa paperwork, and each of those has a deadline attached. When that lives across a spreadsheet, a drive and a chat thread, work gets duplicated, files go missing, and a student quietly stalls for three weeks before anyone notices.",
      pains: [
        "No single view of where a student sits in the journey",
        "Documents scattered across drives and inboxes",
        "Eligibility checked manually, and inconsistently",
        "Application deadlines tracked from memory",
        "Counsellor workload invisible to management",
        "Payments and commission reconciled by hand",
      ],
    },
    vision: {
      headline: "One student, one file, one pipeline.",
      body: [
        "Ignition was designed around the file rather than around the sale. Everything the consultancy knows about a student — the enquiry, the eligibility assessment, every document, every application and every payment — attaches to one record that moves through the pipeline.",
        "The dashboard exists so that management never has to ask for a status update. Raw leads, prospects, hot leads and lost leads sit alongside conversion rate, applications submitted and offers received, and each figure drills into the students behind it.",
      ],
    },
    modules: [
      {
        title: "Lead capture and qualification",
        body: "Enquiries arrive from the website, walk-ins, referrals and campaigns, and land in one queue. Each one is categorised, assigned to a counsellor and moved through raw lead, prospect and hot lead as the conversation develops.",
      },
      {
        title: "Eligibility assessment",
        body: "A structured check against academic history, English scores, financial capacity and destination requirements, so two counsellors assessing the same student reach the same answer — and the reasoning stays on the record.",
      },
      {
        title: "Applications",
        body: "Applications are tracked per student, per university and per intake, with status, submitted date and outcome held against the file. Offers received roll straight into the dashboard figures.",
      },
      {
        title: "Documents",
        body: "Every required document is listed against the student with its own state — missing, uploaded, verified or rejected — so the gap between where a file is and where it needs to be is never a guess.",
      },
      {
        title: "Appointments and tasks",
        body: "Counselling sessions, document collection and follow-up calls are booked against the student and appear on the assigned staff member's workspace, with reminders ahead of each one.",
      },
      {
        title: "Payments",
        body: "Service fees, application fees and instalments are recorded against the student in local currency, giving management a running view of collected and outstanding revenue.",
      },
      {
        title: "University directory",
        body: "An internal catalogue of institutions, courses, intakes and entry requirements that counsellors shortlist from, so recommendations come from one maintained source rather than from individual memory.",
      },
      {
        title: "Workspace dashboard",
        body: "Role-aware metric tiles across admissions and operations — raw leads, prospects, hot and lost leads, conversion rate, clients, applications, offers received, revenue and appointments — each with period-on-period movement, and each customisable per user.",
      },
    ],
    closing:
      "Ignition turned a consultancy's admissions process from a set of parallel spreadsheets into one pipeline with an audit trail. The team stopped asking where a file was and started asking what to do next with it.",
  },

  /* ── In development ───────────────────────────────────────────────────── */
  {
    slug: "tapri",
    name: "Tapri",
    tagline: "Front-of-house and back-of-house on one system",
    sector: "Hospitality",
    status: "development",
    summary:
      "A hospitality operations platform for multi-branch cafés and restaurants — orders, kitchen tickets, stock and recipe costing tied together so a menu price is answerable from data.",
    intro: [
      "Tapri is an operations platform for cafés, restaurants and multi-branch food businesses. It is currently in development and not yet available to customers.",
      "Most hospitality software solves the till and stops there. The problems that actually decide whether a branch makes money sit behind the counter: what stock moved, what a dish really costs to plate, which items sell at which hour, and why one branch runs 6% higher wastage than the others.",
      "Tapri connects the order to the recipe, the recipe to the stock, and the stock to the purchase order, so those questions have answers instead of estimates.",
    ],
    monogram: "Tp",
    accent: "#e07a3f",
    stack: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "React Native"],
    audience: ["Café and restaurant owners", "Branch managers", "Kitchen leads", "Floor staff"],
    highlights: [
      { label: "Product type", value: "Hospitality operations & POS platform" },
      { label: "Industry", value: "Food & beverage" },
      { label: "Primary users", value: "Owners, branch managers, kitchen and floor staff" },
      { label: "Status", value: "In development — closed pilot planned" },
    ],
    problem: {
      body: "A growing food business ends up running a till that does not talk to a stock sheet that does not talk to a supplier ledger. Menu prices get set from instinct, wastage is discovered at month end, and the difference between a branch that works and one that does not is invisible until the accounts arrive.",
      pains: [
        "Menu pricing set without knowing plate cost",
        "Stock counted manually, and rarely",
        "Wastage discovered weeks after it happened",
        "No branch-to-branch comparison",
        "Kitchen tickets written by hand at peak",
        "Supplier prices tracked in a notebook",
      ],
    },
    vision: {
      headline: "Every order should update the stock room.",
      body: [
        "Tapri is being built around one relationship: an item sold is a recipe consumed, and a recipe consumed is stock leaving the shelf. Once that link holds, plate cost, wastage and reorder points stop being separate exercises and become consequences of the day's trading.",
        "The design goal is that a manager closing up should not have to do arithmetic. The numbers a branch needs — covers, average spend, top and bottom sellers, stock to reorder — should already be waiting.",
      ],
    },
    modules: [
      {
        title: "Branch-aware ordering",
        body: "Menus, prices and availability are set per branch, so a seasonal item or a local price sits where it belongs without maintaining separate systems.",
      },
      {
        title: "Kitchen display and tickets",
        body: "Orders route to the right station as they are taken, with preparation state visible to the floor, replacing handwritten tickets during service.",
      },
      {
        title: "Recipe and plate costing",
        body: "Every menu item is defined as a recipe of ingredients at their current purchase price, giving a live plate cost and margin that moves when a supplier price does.",
      },
      {
        title: "Stock and wastage",
        body: "Sales deplete stock automatically through the recipe link. Counts, transfers between branches and recorded wastage reconcile against expected consumption, and the variance is the number worth looking at.",
      },
      {
        title: "Purchasing and suppliers",
        body: "Reorder points derived from actual consumption, purchase orders raised against supplier price lists, and a running history of what each ingredient has cost over time.",
      },
      {
        title: "Shift and staff operations",
        body: "Rosters, clock-in and shift-level sales attribution, so labour cost sits next to the revenue it produced rather than in a separate payroll conversation.",
      },
      {
        title: "Branch analytics",
        body: "Covers, average spend, hourly sales curves, item performance and wastage compared across branches, so a manager can see whether a problem is theirs or the group's.",
      },
    ],
    roadmap: [
      { stage: "Ordering and kitchen display", detail: "Core service flow, branch menus, station routing", done: true },
      { stage: "Recipes and plate costing", detail: "Ingredient costing tied to live supplier prices", done: true },
      { stage: "Stock and purchasing", detail: "Consumption-driven depletion, counts and reorder points", done: false },
      { stage: "Closed pilot", detail: "A small group of multi-branch operators running live service", done: false },
      { stage: "General release", detail: "Open onboarding, billing and hardware options", done: false },
    ],
    closing:
      "Tapri is in active development. We are talking to multi-branch operators who want to shape the pilot — if that is you, we would rather hear about your month-end problem now than after the product is finished.",
  },

  {
    slug: "docket",
    name: "Docket",
    tagline: "Matters, documents and deadlines for small law firms",
    sector: "Legal",
    status: "development",
    summary:
      "Practice management built around the matter rather than the invoice — every document, deadline, hearing and note on a case in one file the whole firm can work from.",
    intro: [
      "Docket is a practice management platform for small and mid-sized law firms. It is currently in development and not yet available to customers.",
      "Firms below a certain size rarely have practice management software, because the products aimed at them are billing systems with a case list bolted on. The daily risk in a small firm is not mis-billing — it is a limitation period nobody diarised, or a filing that went out against the previous draft.",
      "Docket is built around the matter file, with the document version history and the deadline calendar as first-class parts of it rather than attachments to it.",
    ],
    monogram: "Dk",
    accent: "#2f7d68",
    stack: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "S3", "OpenAI"],
    audience: ["Partners", "Associates", "Paralegals", "Practice managers"],
    highlights: [
      { label: "Product type", value: "Legal practice management platform" },
      { label: "Industry", value: "Legal services" },
      { label: "Primary users", value: "Partners, associates, paralegals" },
      { label: "Status", value: "In development — design partners being onboarded" },
    ],
    problem: {
      body: "A small firm's case knowledge lives in one person's inbox, a shared drive with sixteen versions of the same agreement, and a wall calendar. It works until someone is on leave, a client asks what was agreed in March, or two people edit the same draft on the same afternoon.",
      pains: [
        "Deadlines tracked outside any system of record",
        "Document versions indistinguishable from one another",
        "Case history locked in individual inboxes",
        "Conflict checks done from memory",
        "Time recorded retrospectively, or not at all",
        "No view of matter profitability",
      ],
    },
    vision: {
      headline: "The matter is the file, and the file is the system.",
      body: [
        "Everything in Docket hangs off the matter: parties, documents, correspondence, deadlines, hearings, notes, time and fees. Opening a matter should tell an associate who has never seen it what has happened and what happens next.",
        "The second design principle is that a deadline is data, not a reminder. Limitation periods, filing dates and hearing dates are computed against the matter type and carried on the calendar with the rule that produced them attached.",
      ],
    },
    modules: [
      {
        title: "Matter management",
        body: "Matters opened against a client with type, parties, responsible fee earner, status and stage, giving the firm one list of what is actually live.",
      },
      {
        title: "Document management and versioning",
        body: "Documents stored against the matter with full version history, so the current draft is unambiguous and every earlier one remains retrievable with its author and date.",
      },
      {
        title: "Deadline and hearing calendar",
        body: "Key dates derived from matter type and jurisdiction, carried on a firm-wide calendar with escalating reminders and the rule that generated each date recorded alongside it.",
      },
      {
        title: "Client and conflict checks",
        body: "A searchable index of clients, parties and related entities checked at matter opening, with the result recorded on the file.",
      },
      {
        title: "Time recording and billing",
        body: "Time captured against the matter as work happens, with fee arrangements — hourly, fixed fee or retainer — reflected in what the client eventually sees.",
      },
      {
        title: "Correspondence log",
        body: "Emails, letters and attendance notes filed to the matter, so case history survives someone leaving the firm.",
      },
      {
        title: "Document assistance",
        body: "Drafting from firm templates with matter data merged in, plus summarisation of long documents and correspondence threads — with a fee earner reviewing every output before it leaves the building.",
      },
      {
        title: "Matter profitability",
        body: "Recorded time and disbursements set against fees billed, so the firm can see which work is worth taking on again.",
      },
    ],
    roadmap: [
      { stage: "Matters and documents", detail: "Matter file, storage, version history and search", done: true },
      { stage: "Deadline engine", detail: "Rule-derived key dates and firm calendar", done: false },
      { stage: "Time and billing", detail: "Capture, fee arrangements and invoicing", done: false },
      { stage: "Design partner rollout", detail: "A small number of firms running live matters", done: false },
      { stage: "General release", detail: "Open onboarding and jurisdiction packs", done: false },
    ],
    closing:
      "Docket is in active development, shaped with firms who deal with these problems daily. If your practice would make a good design partner, we would like to talk before the deadline engine is finalised.",
  },

  {
    slug: "pulseboard",
    name: "Pulseboard",
    tagline: "One weekly scorecard instead of six dashboards",
    sector: "Analytics",
    status: "development",
    summary:
      "A reporting layer that pulls analytics, ad platforms, search and CRM into a single business scorecard — and writes the plain-language summary of what moved and why.",
    intro: [
      "Pulseboard is a marketing and revenue reporting platform for small and mid-sized businesses. It is currently in development and not yet available to customers.",
      "The businesses we work with do not lack data. They have GA4, Meta and Google Ads, Search Console, a CRM and a spreadsheet, and no time to reconcile six numbers that all claim to be conversions.",
      "Pulseboard is being built to collapse that into one weekly scorecard: what happened, how it compares to the period before, and which of it is worth acting on.",
    ],
    monogram: "Pb",
    accent: "#c2410c",
    stack: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "ClickHouse", "OpenAI"],
    audience: ["Business owners", "Marketing managers", "Agencies", "Sales leads"],
    highlights: [
      { label: "Product type", value: "Marketing & revenue reporting platform" },
      { label: "Industry", value: "SMEs and agencies" },
      { label: "Primary users", value: "Owners, marketing managers, account teams" },
      { label: "Status", value: "In development — early access list open" },
    ],
    problem: {
      body: "Reporting for a small business is usually someone's Monday morning: exporting numbers from five platforms into a sheet, formatting it, and having no time left to think about what it means. The report gets produced, gets skimmed, and changes nothing.",
      pains: [
        "The same metric defined differently on every platform",
        "Manual exports and copy-paste reporting",
        "Ad spend disconnected from actual revenue",
        "No period-on-period context on any figure",
        "Reports that describe but never recommend",
        "Nobody notices a drop until the month closes",
      ],
    },
    vision: {
      headline: "A report should end with a decision, not a chart.",
      body: [
        "Pulseboard connects the sources a business already uses, resolves them to one set of definitions, and produces a scorecard on a fixed cadence — the same figures, the same way, every week.",
        "On top of that sits the part that actually saves time: a written summary of what moved, what it cost, and what is worth doing about it, with the underlying numbers one click away for anyone who wants to check the work.",
      ],
    },
    modules: [
      {
        title: "Source connections",
        body: "Read-only connections to GA4, Google and Meta Ads, Search Console, and CRM or ecommerce platforms, refreshed on a schedule rather than pulled by hand.",
      },
      {
        title: "One metric definition",
        body: "Conversions, sessions, leads and revenue resolved to a single definition across sources, so two dashboards stop disagreeing about the same week.",
      },
      {
        title: "The weekly scorecard",
        body: "A fixed set of figures with period-on-period movement and a target where one exists — the same shape every week, so a change stands out rather than being buried in a new layout.",
      },
      {
        title: "Spend-to-revenue attribution",
        body: "Ad spend tied through to recorded revenue and pipeline, giving a channel-level cost per acquisition that survives contact with the accounts.",
      },
      {
        title: "Written summaries",
        body: "A plain-language explanation of what moved and why, generated from the period's data, with the figures behind every statement linked so it can be checked rather than trusted.",
      },
      {
        title: "Alerts",
        body: "Thresholds set on the figures that matter, so a drop in enquiries or a spike in cost per lead surfaces the week it happens instead of at month end.",
      },
      {
        title: "Client reporting for agencies",
        body: "Branded scorecards per client on a shared schedule, so an agency stops rebuilding the same deck for every account.",
      },
    ],
    roadmap: [
      { stage: "Connectors", detail: "GA4, Search Console, Google Ads and Meta Ads ingestion", done: true },
      { stage: "Metric layer", detail: "Unified definitions and period comparison", done: true },
      { stage: "Written summaries", detail: "Generated narrative with linked underlying figures", done: false },
      { stage: "Early access", detail: "A first group of businesses and agencies on real accounts", done: false },
      { stage: "General release", detail: "Open signup, billing and additional connectors", done: false },
    ],
    closing:
      "Pulseboard is in active development. The early access list is open — if reporting is currently someone's Monday morning, we would like to hear how yours works.",
  },
];

export function getProduct(slug: string) {
  return softwareProducts.find((p) => p.slug === slug);
}

/** Shipped products first, so the tab does not open on a roadmap. */
export const productsByReadiness = () => {
  const rank: Record<SoftwareStatus, number> = { live: 0, beta: 1, development: 2 };
  return [...softwareProducts].sort((a, b) => rank[a.status] - rank[b.status]);
};
