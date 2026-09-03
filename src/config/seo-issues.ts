import type { IssueSeverity } from "@/generated/prisma";

/**
 * The technical-SEO issue catalogue.
 *
 * Every finding the crawler can raise is declared here once, in the words a
 * client should read. The crawler emits a `code`; the UI never writes copy of
 * its own. That keeps "canonical URL mismatch detected" out of a dashboard
 * somebody's client is looking at, and means improving an explanation is an
 * edit to one line rather than a hunt through components.
 *
 * Severity follows the brief:
 *   CRITICAL  can stop Google crawling or indexing the page at all
 *   HIGH      likely to measurably cost search visibility
 *   MEDIUM    should be fixed, but nothing is broken
 *   LOW       an optimisation, not a fault
 */

export type IssueDefinition = {
  code: string;
  severity: IssueSeverity;
  /** Plain-language heading. No jargon, no acronyms. */
  title: string;
  /** "What happened", given the number of affected pages. */
  what: (count: number) => string;
  /** "Why it matters" — the business consequence, not the specification. */
  why: string;
  /** "What to do" — one concrete action. */
  fix: string;
};

export const ISSUE_CATALOGUE: Record<string, IssueDefinition> = {
  /* ── crawling and indexing ─────────────────────────────────────────────── */

  BLOCKED_BY_ROBOTS: {
    code: "BLOCKED_BY_ROBOTS",
    severity: "CRITICAL",
    title: "Pages Google is not allowed to visit",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "is" : "are"} blocked by your robots.txt file.`,
    why: "Google cannot read these pages, so they will not appear in search results at all — however good the content on them is.",
    fix: "Check whether these pages were meant to be hidden. If they were not, remove the rule blocking them from robots.txt.",
  },
  NOINDEX: {
    code: "NOINDEX",
    severity: "CRITICAL",
    title: "Pages asking Google not to list them",
    what: (n) => `${n} ${pages(n)} tell Google explicitly not to include ${n === 1 ? "it" : "them"} in search results.`,
    why: "This is usually left over from a staging site or a template. Any page in this state earns no search traffic, no matter how well it ranks otherwise.",
    fix: "Remove the 'noindex' instruction from any page you want people to find through Google.",
  },
  BROKEN_LINK: {
    code: "BROKEN_LINK",
    severity: "HIGH",
    title: "Links that lead nowhere",
    what: (n) => `${n} ${n === 1 ? "link goes" : "links go"} to a page that no longer exists.`,
    why: "Visitors who click them hit an error page and often leave. Google also treats a site full of dead links as less well maintained.",
    fix: "Point each link at the correct page, or remove it if the destination is genuinely gone.",
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    severity: "HIGH",
    title: "Missing pages",
    what: (n) => `${n} ${pages(n)} returned a 'not found' error.`,
    why: "If these URLs are linked from elsewhere or already listed on Google, anyone following them reaches a dead end.",
    fix: "Restore the page, or set up a redirect from the old address to the closest replacement.",
  },
  SERVER_ERROR: {
    code: "SERVER_ERROR",
    severity: "CRITICAL",
    title: "Pages returning an error",
    what: (n) => `${n} ${pages(n)} failed to load with a server error.`,
    why: "Neither visitors nor Google can see these pages. If it persists, Google eventually removes them from search results.",
    fix: "Ask your developer to check the server logs for these addresses.",
  },
  REDIRECT_CHAIN: {
    code: "REDIRECT_CHAIN",
    severity: "MEDIUM",
    title: "Addresses that redirect more than once",
    what: (n) => `${n} ${n === 1 ? "address passes" : "addresses pass"} through two or more redirects before arriving.`,
    why: "Each extra hop slows the page down and loses a little of the ranking value the original link was passing on.",
    fix: "Update these links to point straight at the final address.",
  },

  /* ── canonical and duplication ─────────────────────────────────────────── */

  MISSING_CANONICAL: {
    code: "MISSING_CANONICAL",
    severity: "MEDIUM",
    title: "Pages not stating their preferred address",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "does" : "do"} not say which address is the official one.`,
    why: "When the same content is reachable at more than one address, Google has to guess which to show. It sometimes picks the wrong one.",
    fix: "Add a canonical tag to each page naming its preferred address.",
  },
  CANONICAL_MISMATCH: {
    code: "CANONICAL_MISMATCH",
    severity: "MEDIUM",
    title: "Pages pointing Google at a different address",
    what: (n) => `${n} ${pages(n)} tell Google that a different URL should be listed instead.`,
    why: "That is correct for a duplicate, but wrong on a page you want found — Google will list the other address and this one earns nothing.",
    fix: "Review these pages. If each is meant to be found on its own, point the canonical tag at itself.",
  },

  /* ── titles and descriptions ───────────────────────────────────────────── */

  MISSING_TITLE: {
    code: "MISSING_TITLE",
    severity: "HIGH",
    title: "Pages with no title",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "has" : "have"} no title.`,
    why: "The title is the blue headline in Google's results and the words in the browser tab. Without one, Google invents something from the page, which rarely reads well.",
    fix: "Give each page a clear title of roughly 50–60 characters, describing what the page is about.",
  },
  DUPLICATE_TITLE: {
    code: "DUPLICATE_TITLE",
    severity: "MEDIUM",
    title: "Pages sharing the same title",
    what: (n) => `${n} ${pages(n)} use a title that also appears on another page.`,
    why: "Identical titles make it hard for people to tell your results apart, and harder for Google to work out which page answers which search.",
    fix: "Give every page a title unique to what is on it.",
  },
  TITLE_TOO_LONG: {
    code: "TITLE_TOO_LONG",
    severity: "LOW",
    title: "Titles that get cut off",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "has a title" : "have titles"} long enough that Google will truncate ${n === 1 ? "it" : "them"}.`,
    why: "The end of the title is replaced by an ellipsis in search results, so anything important there is never read.",
    fix: "Shorten these to about 60 characters, with the important words first.",
  },
  TITLE_TOO_SHORT: {
    code: "TITLE_TOO_SHORT",
    severity: "LOW",
    title: "Very short titles",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "has a title" : "have titles"} of under 25 characters.`,
    why: "A short title wastes space you are given in search results and usually leaves out words people actually search for.",
    fix: "Expand these to describe the page more fully.",
  },
  MISSING_META_DESCRIPTION: {
    code: "MISSING_META_DESCRIPTION",
    severity: "MEDIUM",
    title: "Pages missing a search description",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "is" : "are"} missing the short description shown in search results.`,
    why: "Google writes its own snippet by pulling a sentence off the page, which may not explain the page clearly or invite a click.",
    fix: "Add a short, relevant description of roughly 150 characters to each page.",
  },
  DUPLICATE_META_DESCRIPTION: {
    code: "DUPLICATE_META_DESCRIPTION",
    severity: "LOW",
    title: "Pages sharing the same description",
    what: (n) => `${n} ${pages(n)} share a search description with another page.`,
    why: "Repeated descriptions make several of your results look identical, so none of them stands out.",
    fix: "Write a description specific to each page.",
  },

  /* ── content and structure ─────────────────────────────────────────────── */

  MISSING_H1: {
    code: "MISSING_H1",
    severity: "MEDIUM",
    title: "Pages with no main heading",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "has" : "have"} no main heading.`,
    why: "The main heading tells both readers and Google what the page is about before anything else is read.",
    fix: "Add one clear main heading to each page.",
  },
  MULTIPLE_H1: {
    code: "MULTIPLE_H1",
    severity: "LOW",
    title: "Pages with several main headings",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "has" : "have"} more than one main heading.`,
    why: "Several competing headings blur what the page is primarily about.",
    fix: "Keep one main heading per page and make the rest sub-headings.",
  },
  THIN_CONTENT: {
    code: "THIN_CONTENT",
    severity: "MEDIUM",
    title: "Pages with very little text",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "contains" : "contain"} fewer than 250 words.`,
    why: "Short pages give Google little to work with, and usually answer fewer of the questions people are searching for.",
    fix: "Expand these pages, or combine them into a fuller one where that makes more sense.",
  },
  MISSING_ALT_TEXT: {
    code: "MISSING_ALT_TEXT",
    severity: "LOW",
    title: "Images with no description",
    what: (n) => `${n} ${n === 1 ? "image has" : "images have"} no alternative text.`,
    why: "Alt text is what screen readers announce to visitors who cannot see the image, and it is how the image can appear in Google Images.",
    fix: "Describe each image in a few plain words. Purely decorative images can be left with empty alt text on purpose.",
  },
  MISSING_STRUCTURED_DATA: {
    code: "MISSING_STRUCTURED_DATA",
    severity: "LOW",
    title: "Pages without structured data",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "carries" : "carry"} no structured data.`,
    why: "Structured data is how Google recognises a review, an article or an FAQ, and it is what earns the richer-looking results with stars and extra links.",
    fix: "Add the schema markup that matches each page type.",
  },

  /* ── delivery ──────────────────────────────────────────────────────────── */

  INSECURE_URL: {
    code: "INSECURE_URL",
    severity: "CRITICAL",
    title: "Pages served without encryption",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "is" : "are"} served over http rather than https.`,
    why: "Browsers mark these as 'Not secure', which visibly costs trust, and Google prefers secure pages.",
    fix: "Serve the whole site over https and redirect the insecure addresses to it.",
  },
  MIXED_CONTENT: {
    code: "MIXED_CONTENT",
    severity: "HIGH",
    title: "Secure pages loading insecure files",
    what: (n) => `${n} ${pages(n)} load an image, script or stylesheet over an insecure connection.`,
    why: "Browsers block or warn about these, so parts of the page may simply not appear for some visitors.",
    fix: "Update these references to https.",
  },
  LARGE_PAGE: {
    code: "LARGE_PAGE",
    severity: "MEDIUM",
    title: "Very large pages",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "is" : "are"} unusually large to download.`,
    why: "Large pages are slow on mobile connections, and visitors leave before slow pages finish loading.",
    fix: "Compress the images and remove any code the page does not use.",
  },
  SLOW_RESPONSE: {
    code: "SLOW_RESPONSE",
    severity: "MEDIUM",
    title: "Slow pages",
    what: (n) => `${n} ${pages(n)} took longer than 1.5 seconds for the server to begin responding.`,
    why: "The wait happens before anything at all is visible, so it delays every part of the page equally.",
    fix: "Ask your developer to look at server response time and caching for these pages.",
  },
  MISSING_VIEWPORT: {
    code: "MISSING_VIEWPORT",
    severity: "HIGH",
    title: "Pages that do not adapt to phones",
    what: (n) => `${n} ${pages(n)} ${n === 1 ? "is" : "are"} missing the setting that makes a page fit a phone screen.`,
    why: "The page will show desktop-width on a phone, forcing people to pinch and zoom. Most of your visitors are on phones.",
    fix: "Add the mobile viewport setting to these pages.",
  },

  /* ── site-level ────────────────────────────────────────────────────────── */

  ROBOTS_MISSING: {
    code: "ROBOTS_MISSING",
    severity: "LOW",
    title: "No robots.txt file",
    what: () => "Your site has no robots.txt file.",
    why: "Everything still gets crawled, so nothing is broken — but you have no way to steer search engines away from pages that do not need indexing.",
    fix: "Add a robots.txt file listing your sitemap.",
  },
  SITEMAP_MISSING: {
    code: "SITEMAP_MISSING",
    severity: "HIGH",
    title: "No XML sitemap found",
    what: () => "No sitemap could be found for your site.",
    why: "A sitemap is how you hand Google a complete list of your pages. Without one, newer or less-linked pages can take much longer to be discovered.",
    fix: "Publish a sitemap.xml and reference it from robots.txt and Search Console.",
  },
  SITEMAP_NOT_IN_ROBOTS: {
    code: "SITEMAP_NOT_IN_ROBOTS",
    severity: "LOW",
    title: "Sitemap not listed in robots.txt",
    what: () => "Your sitemap exists but is not mentioned in robots.txt.",
    why: "Search engines other than Google often look there first, so they may never find it.",
    fix: "Add a 'Sitemap:' line to robots.txt pointing at it.",
  },
};

function pages(n: number) {
  return n === 1 ? "page" : "pages";
}

export const SEVERITY_ORDER: IssueSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const SEVERITY_BLURB: Record<IssueSeverity, string> = {
  CRITICAL: "Can stop Google showing these pages at all. Fix first.",
  HIGH: "Likely to be costing you search traffic right now.",
  MEDIUM: "Worth fixing, but nothing is broken.",
  LOW: "Small improvements, when there is time.",
};

export function issueDefinition(code: string): IssueDefinition | null {
  return ISSUE_CATALOGUE[code] ?? null;
}
