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
  detail: string;
};

export type GrowthStep = {
  n: string;
  title: string;
  visual: GrowthVisualKey;
  claim: string;
  body: string;
  lenses: GrowthLens[];
};

export const growthPath: GrowthStep[] = [
  {
    n: "01",
    visual: "diagnose",
    title: "Diagnose",
    claim: "Find the problem before building the solution.",
    body: "We first identify what is holding your business back and what needs to improve. If your requested solution won't solve the problem, we'll tell you and recommend a better approach.",
    lenses: [
      {
        area: "Marketing & creative",
        detail: "Whether attention is the problem, or what happens after it",
      },
      {
        area: "Search & paid",
        detail: "Which demand you are absent from, and what showing up costs",
      },
      {
        area: "Websites & product",
        detail: "Where the funnel leaks between landing and enquiry",
      },
      {
        area: "Software & automation",
        detail: "Which manual step is capping how much work can move",
      },
    ],
  },
  {
    n: "02",
    visual: "audit",
    title: "Audit",
    claim: "Establish the baseline first.",
    body: "Before we build anything, we record where things stand — analytics, website performance, ads, server data, and customer feedback. Without a baseline, we can't prove what changed.",
    lenses: [
      {
        area: "Marketing & creative",
        detail: "Channel mix, publishing cadence, what actually performed",
      },
      {
        area: "Search & paid",
        detail: "Crawl, index and schema health; account structure and attribution",
      },
      {
        area: "Websites & product",
        detail: "Core Web Vitals in the field, drop-off measured step by step",
      },
      {
        area: "Software & automation",
        detail: "Systems map, data flows, hours lost to re-keying the same record",
      },
    ],
  },
  {
    n: "03",
    visual: "model",
    title: "Model",
    claim: "Know what the opportunity is worth before choosing the work.",
    body: "We measure the value and cost of each fix. That makes it clear what to do first and why.",
    lenses: [
      {
        area: "Marketing & creative",
        detail: "Reach and conversion assumptions, tested cheaply before they scale",
      },
      {
        area: "Search & paid",
        detail: "Traffic value by keyword cluster, and a CAC ceiling per channel",
      },
      {
        area: "Websites & product",
        detail: "Conversion lift modelled against the volume you already have",
      },
      {
        area: "Software & automation",
        detail: "Hours returned, errors removed, cost per transaction",
      },
    ],
  },
  {
    n: "04",
    visual: "build",
    title: "Build",
    claim: "Ship a system, not a campaign.",
    body: "Design, code, content and campaigns come out of one plan and land in two-week cycles, on a staging URL you can watch from the first day. Whatever we build, you own outright.",
    lenses: [
      {
        area: "Marketing & creative",
        detail: "Content and creative systems your team can extend without us",
      },
      {
        area: "Search & paid",
        detail: "Technical fixes, topic clusters, campaigns and the pages they land on",
      },
      {
        area: "Websites & product",
        detail: "Next.js front end and a CMS your team runs on its own",
      },
      {
        area: "Software & automation",
        detail: "Node.js services, integrations and workflows, documented and tested",
      },
    ],
  },
  {
    n: "05",
    visual: "compound",
    title: "Compound",
    claim: "Run it, measure it, re-invest in what works.",
    body: "Launch is where measurement starts. Experiments run against a single metric on a fortnightly cycle, reported on the dashboard your leadership already reads — including the experiments that failed.",
    lenses: [
      {
        area: "Marketing & creative",
        detail: "Creative tested weekly rather than reviewed quarterly",
      },
      {
        area: "Search & paid",
        detail: "Publishing cadence and budget follow the data, not the calendar",
      },
      {
        area: "Websites & product",
        detail: "Tests run against the one metric the quarter is judged on",
      },
      {
        area: "Software & automation",
        detail: "Automation extended each time manual work creeps back in",
      },
    ],
  },
];
