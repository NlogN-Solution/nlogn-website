/**
 * Resource-library constants shared by the browser and the server.
 *
 * Outside `server/` for the same reason `config/media.ts` is: the public cards,
 * the gate form and the admin editor all need the labels, and importing them
 * from a service would drag Prisma into the client bundle.
 */

export const RESOURCE_TYPES = [
  "REPO",
  "TEMPLATE",
  "ASSET_PACK",
  "WORKFLOW",
  "SNIPPET",
  "VIDEO",
  "EBOOK",
] as const;

export type ResourceTypeName = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<ResourceTypeName, string> = {
  REPO: "Code repository",
  TEMPLATE: "Template",
  ASSET_PACK: "Asset pack",
  WORKFLOW: "Workflow",
  SNIPPET: "Snippet",
  VIDEO: "Video",
  EBOOK: "Guide",
};

/** The short form, for a card chip where the full label is too long. */
export const RESOURCE_TYPE_CHIPS: Record<ResourceTypeName, string> = {
  REPO: "Repo",
  TEMPLATE: "Template",
  ASSET_PACK: "Assets",
  WORKFLOW: "Workflow",
  SNIPPET: "Snippet",
  VIDEO: "Video",
  EBOOK: "Guide",
};

/**
 * Where a resource actually sends the visitor.
 *
 * One order, used by the button that makes the promise and by the route that
 * keeps it (`server/resource-download.ts`), so a label can never advertise a
 * repository and then deliver a zip.
 *
 * A repository URL wins outright, and it is now the only destination the admin
 * can set: the library is a shelf of public repos, so the thing being offered
 * *is* the GitHub page. `external` and `file` remain only because rows created
 * before that decision still hold them and must keep working — nothing new can
 * be given either one.
 */
export type ResourceDestination = "repo" | "external" | "file";

export function resourceDestination(has: {
  repo: boolean;
  external: boolean;
  file: boolean;
}): ResourceDestination | null {
  if (has.repo) return "repo";
  if (has.external) return "external";
  if (has.file) return "file";
  return null;
}

/**
 * What the button says, given where it goes.
 *
 * The label is the thing a visitor decides on, so it has to name the
 * destination. "Download source code" is the phrase for a repository because it
 * is what the visitor came to do and what GitHub itself calls the button on the
 * other side — while still being honest that the click leaves this site. An
 * explicit button label from the admin always wins.
 */
export function resourceCtaLabel(
  delivery: ResourceDestination | null,
  type: ResourceTypeName,
  fileLabel?: string | null,
): string {
  const custom = fileLabel?.trim();
  if (custom) return custom;
  if (delivery === "repo") return "Download source code";
  if (delivery === "external") return "Open it";
  return `Download the ${RESOURCE_TYPE_CHIPS[type].toLowerCase()}`;
}

export const RESOURCE_GATES = ["FREE", "EMAIL", "ACCOUNT"] as const;

export type ResourceGateName = (typeof RESOURCE_GATES)[number];

export const RESOURCE_GATE_LABELS: Record<ResourceGateName, string> = {
  FREE: "Open — no email",
  EMAIL: "Email required",
  ACCOUNT: "Account required",
};

/**
 * Guidance shown next to the gate selector in the admin, because the wrong
 * choice here is the expensive one and it is not obvious from the label.
 */
export const RESOURCE_GATE_HINTS: Record<ResourceGateName, string> = {
  FREE:
    "The repository URL is shown outright. Honest, and it converts: that URL cannot be gated by anything — the first visitor through re-posts it — so asking for an email only costs clicks.",
  EMAIL:
    "One field in front of the repo link, and the link also goes out by email. Worth it when the resource is the reason somebody came from a reel; not worth it when the repo is already linked from elsewhere.",
  ACCOUNT:
    "Not yet available. There are no visitor accounts on this site; a resource set to this will refuse to unlock.",
};

/**
 * How long a download link stays alive, and how many times it may be used.
 *
 * Short enough that a link pasted into a group chat stops working, generous
 * enough for a phone that lost signal mid-download and a laptop opened later.
 */
export const GRANT_TTL_HOURS = 72;
export const GRANT_MAX_USES = 5;

/**
 * The cookie that remembers which reel sent this visitor.
 *
 * Set by `/r/<code>` and read when they convert, so attribution survives the
 * visitor browsing the site before they fill anything in. It holds a ShortLink
 * code — not an identifier for the person — which is why it needs no consent
 * banner: it carries no information about who they are.
 */
export const CAMPAIGN_COOKIE = "nlogn.src";
export const CAMPAIGN_COOKIE_DAYS = 30;

/** Cloudinary folder for library payloads, kept apart from editorial media. */
export const RESOURCE_MEDIA_FOLDER = "resources";
