/**
 * How a business gets from a stuck number to a system that compounds.
 *
 * Each step is shown through four lenses, one per group of disciplines, so the
 * same method reads concretely whether someone came for SEO or for software.
 * This is the *thinking*; `processSteps` in `site.ts` is the engagement
 * mechanics — weeks, deliverables and handover.
 */

export type GrowthVisualKey = "diagnose" | "audit" | "model" | "build" | "compound";

export type GrowthLens = {
  /** The discipline group this line speaks to. */
  area: string;
  /** One word for what is being read in this stage. Shown as a chip. */
  focus: string;
  detail: string;
};

export type GrowthStep = {
  n: string;
  title: string;
  visual: GrowthVisualKey;
  /** Eyebrow beside the number, e.g. "01 / DISCOVERY". */
  label: string;
  claim: string;
  body: string;
  /** What the client is left holding at the end of the stage. */
  outcome: string;
  /** Live status shown on the system panel while this stage is active. */
  status: string;
  lenses: GrowthLens[];
};

export const growthPath: GrowthStep[] = [
  {
    n: "01",
    label: "DISCOVERY",
    visual: "diagnose",
    title: "Diagnose",
    claim: "Find the problem before building the solution.",
    body: "We first identify what is holding your business back and what needs to improve. If your requested solution won't solve the problem, we'll tell you and recommend a better approach.",
    outcome:
      "Clarity on the real problem, the opportunities around it, and where to focus first.",
    status: "ANALYZING",
    lenses: [
      {
        area: "Marketing & creative",
        focus: "ATTENTION",
        detail: "Whether attention is the problem, or what happens after it",
      },
      {
        area: "Search & paid",
        focus: "VISIBILITY",
        detail: "Which demand you are absent from, and what showing up costs",
      },
      {
        area: "Websites & product",
        focus: "CONVERSION",
        detail: "Where the funnel leaks between landing and enquiry",
      },
      {
        area: "Software & automation",
        focus: "EFFICIENCY",
        detail: "Which manual step is capping how much work can move",
      },
    ],
  },
  {
    n: "02",
    label: "BASELINE",
    visual: "audit",
    title: "Audit",
    claim: "Establish the baseline first.",
    body: "Before we build anything, we record where things stand — analytics, website performance, ads, server data, and customer feedback. Without a baseline, we can't prove what changed.",
    outcome:
      "A written before — the numbers every later claim gets measured against.",
    status: "MEASURING",
    lenses: [
      {
        area: "Marketing & creative",
        focus: "CADENCE",
        detail: "Channel mix, publishing cadence, what actually performed",
      },
      {
        area: "Search & paid",
        focus: "COVERAGE",
        detail: "Crawl, index and schema health; account structure and attribution",
      },
      {
        area: "Websites & product",
        focus: "VITALS",
        detail: "Core Web Vitals in the field, drop-off measured step by step",
      },
      {
        area: "Software & automation",
        focus: "THROUGHPUT",
        detail: "Systems map, data flows, hours lost to re-keying the same record",
      },
    ],
  },
  {
    n: "03",
    label: "MODELLING",
    visual: "model",
    title: "Model",
    claim: "Know what the opportunity is worth before choosing the work.",
    body: "We measure the value and cost of each fix. That makes it clear what to do first and why.",
    outcome:
      "A ranked list of work, each item carrying what it is worth and what it costs.",
    status: "MODELLING",
    lenses: [
      {
        area: "Marketing & creative",
        focus: "REACH",
        detail: "Reach and conversion assumptions, tested cheaply before they scale",
      },
      {
        area: "Search & paid",
        focus: "VALUE",
        detail: "Traffic value by keyword cluster, and a CAC ceiling per channel",
      },
      {
        area: "Websites & product",
        focus: "LIFT",
        detail: "Conversion lift modelled against the volume you already have",
      },
      {
        area: "Software & automation",
        focus: "HOURS",
        detail: "Hours returned, errors removed, cost per transaction",
      },
    ],
  },
  {
    n: "04",
    label: "DELIVERY",
    visual: "build",
    title: "Build",
    claim: "Ship a system, not a campaign.",
    body: "Design, code, content and campaigns come out of one plan and land in two-week cycles, on a staging URL you can watch from the first day. Whatever we build, you own outright.",
    outcome:
      "A working system your team owns, shipped in cycles you can watch.",
    status: "BUILDING",
    lenses: [
      {
        area: "Marketing & creative",
        focus: "SYSTEMS",
        detail: "Content and creative systems your team can extend without us",
      },
      {
        area: "Search & paid",
        focus: "CHANNELS",
        detail: "Technical fixes, topic clusters, campaigns and the pages they land on",
      },
      {
        area: "Websites & product",
        focus: "PLATFORM",
        detail: "Next.js front end and a CMS your team runs on its own",
      },
      {
        area: "Software & automation",
        focus: "SERVICES",
        detail: "Node.js services, integrations and workflows, documented and tested",
      },
    ],
  },
  {
    n: "05",
    label: "COMPOUNDING",
    visual: "compound",
    title: "Compound",
    claim: "Run it, measure it, re-invest in what works.",
    body: "Launch is where measurement starts. Experiments run against a single metric on a fortnightly cycle, reported on the dashboard your leadership already reads — including the experiments that failed.",
    outcome:
      "A repeatable growth loop that keeps returning more than it costs.",
    status: "SCALING",
    lenses: [
      {
        area: "Marketing & creative",
        focus: "TESTING",
        detail: "Creative tested weekly rather than reviewed quarterly",
      },
      {
        area: "Search & paid",
        focus: "BUDGET",
        detail: "Publishing cadence and budget follow the data, not the calendar",
      },
      {
        area: "Websites & product",
        focus: "EXPERIMENTS",
        detail: "Tests run against the one metric the quarter is judged on",
      },
      {
        area: "Software & automation",
        focus: "AUTOMATION",
        detail: "Automation extended each time manual work creeps back in",
      },
    ],
  },
];
