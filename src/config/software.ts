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

  /* ── Chatboq ──────────────────────────────────────────────────────────── */
  {
    slug: "chatboq",
    name: "Chatboq",
    tagline: "AI customer communication in one workspace",
    sector: "Customer communication",
    status: "live",
    summary:
      "An AI-powered customer communication platform that combines live chat, AI conversations, CRM, ticketing and omnichannel messaging in one workspace, so a team engages visitors, automates support and keeps every conversation in one place.",
    intro: [
      "Chatboq is an all-in-one AI customer communication platform that combines live chat, AI-powered conversations, CRM, ticketing and omnichannel messaging in a single workspace.",
      "It helps businesses engage website visitors, automate customer support, manage conversations across channels, and turn one-off interactions into ongoing customer relationships.",
      "We helped build and scale Chatboq. The platform lets businesses engage visitors through live chat and AI, automate support, manage tickets and customer data, and connect multiple communication channels through one unified workspace.",
    ],
    thumbnail: "/software/chatboq.png",
    monogram: "Cq",
    accent: "#0ea5e9",
    stack: ["FastAPI", "Python", "Next.js", "TypeScript", "Redis", "PostgreSQL", "WebSockets"],
    audience: ["Support teams", "Sales teams", "Customer success", "Founders"],
    highlights: [
      { label: "Product type", value: "AI customer communication platform" },
      { label: "Industry", value: "SaaS / customer support" },
      { label: "Primary users", value: "Support and sales teams" },
      { label: "Core focus", value: "Live chat, AI, ticketing & CRM" },
    ],
    problem: {
      body: "Customer conversations get spread across a website chat widget, an email inbox, a couple of social channels and a spreadsheet of customer details. An agent answering a question cannot see what the customer asked last week, repetitive questions eat the team's day, and anything that needs follow-up is tracked from memory.",
      pains: [
        "Conversations split across chat, email and social",
        "No shared history when a customer comes back",
        "Repetitive questions handled manually every time",
        "Follow-ups tracked outside any system of record",
        "Customer details disconnected from the conversation",
        "No view of response times or conversation volume",
      ],
    },
    vision: {
      headline: "Every customer conversation in one place.",
      body: [
        "Chatboq is built around a single conversation record that follows the customer across every channel, so whoever picks it up has the full history in front of them.",
        "AI sits on top of that record. It answers what it can on its own, drafts replies for what it cannot, and hands the agent a conversation that is already halfway done.",
      ],
    },
    modules: [
      {
        title: "Live chat",
        body: "A website widget that lets the team talk to visitors in real time, with routing, canned replies and visitor context attached to every conversation.",
      },
      {
        title: "AI conversations",
        body: "An AI assistant that handles common questions on its own, using the business's own content, and escalates to a human the moment a conversation needs one.",
      },
      {
        title: "Shared inbox and ticketing",
        body: "Conversations that need follow-up become tickets with an owner, a status and a history, so nothing that was promised gets lost after the chat window closes.",
      },
      {
        title: "Customer profiles and CRM",
        body: "Every contact carries their details, past conversations and notes, so an agent opens a chat already knowing who they are talking to.",
      },
      {
        title: "Omnichannel messaging",
        body: "Website chat, email and messaging channels land in the same workspace, so the team works from one queue rather than switching between apps.",
      },
      {
        title: "Team workspace",
        body: "Assignment, internal notes, collaboration on a conversation and visibility of who is handling what, so a growing team stays coordinated.",
      },
      {
        title: "Insights",
        body: "Volume, response and resolution times, and where conversations come from, so the team can see whether service is keeping up with growth.",
      },
    ],
    closing:
      "We helped build and scale Chatboq into an AI customer communication platform that centralises live chat, AI conversations, ticketing and customer data in one workspace — so a growing team keeps every customer conversation in one place instead of five.",
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
    thumbnail: "/software/Docket.png",
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
];

export function getProduct(slug: string) {
  return softwareProducts.find((p) => p.slug === slug);
}

/** Shipped products first, so the tab does not open on a roadmap. */
export const productsByReadiness = () => {
  const rank: Record<SoftwareStatus, number> = { live: 0, beta: 1, development: 2 };
  return [...softwareProducts].sort((a, b) => rank[a.status] - rank[b.status]);
};
