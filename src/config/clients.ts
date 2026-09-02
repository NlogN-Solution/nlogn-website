/**
 * Client work shown in the "Recent clients" section.
 *
 * Everything the section renders lives here — add a project by appending an
 * object, and it appears with no component changes. Tabs are derived from
 * `category`, so a new category only needs adding to CLIENT_TABS.
 */

export type ClientCategory = "websites" | "media" | "software";

export type ClientProject = {
  id: string;
  clientName: string;
  projectName: string;
  category: ClientCategory;
  /** Sector tag shown above the name. Keep it to one or two words. */
  sector: string;
  description: string;
  /** Path under /public, or any absolute URL. */
  thumbnail: string;
  /** Live site or public demo. Omitted when there is nothing public to show. */
  projectUrl?: string;
  /** Shown as chips. Most useful on software builds. */
  technologies?: string[];
};

export type ClientVideo = {
  id: string;
  clientName: string;
  projectName: string;
  /** Sector tag, shown the same way as on a project card. */
  sector: string;
  description: string;
  /** Cloudinary delivery URL — streamed, never downloaded into the repo. */
  videoUrl: string;
  /** Optional still. Left out, a frame is pulled from the video itself. */
  videoPoster?: string;
  /**
   * Shape of the source file. Reels are "portrait" (9:16); anything filmed wide
   * is "landscape" (16:9). The card sizes its stage to match, so nothing is
   * cropped or letterboxed.
   */
  aspect: "portrait" | "landscape";
};

/**
 * Order matters — the first tab is the one the section opens on.
 *
 * The `software` tab renders from `config/software.ts` rather than from
 * `clientProjects`, because a product carries a full write-up rather than an
 * outbound link to a live site.
 */
export const CLIENT_TABS: { id: ClientCategory; label: string }[] = [
  { id: "media", label: "Content & Media Production" },
  { id: "software", label: "Software" },
  { id: "websites", label: "Websites" },
];

export const clientProjects: ClientProject[] = [
  {
    id: "ignition",
    clientName: "Ignition",
    projectName: "Study in the UK",
    category: "websites",
    sector: "Education",
    description:
      "A UK study platform covering course and university search, a career quiz that narrows the options, and an application journey that runs from first visit through to enrolment.",
    thumbnail: "/clients/ignition.png",
    projectUrl: "https://ignition-website.vercel.app/",
  },
  {
    id: "ananta-legal",
    clientName: "Ananta Legal",
    projectName: "The Entrepreneur's Lawyers",
    category: "websites",
    sector: "Legal",
    description:
      "A brand-led site for a Kathmandu firm advising founders on company formation, contracts, fundraising and IP — practice areas, flat-fee pricing and a booking flow that turns a reader into an intro call.",
    thumbnail: "/clients/ananta-legal.png",
    projectUrl: "https://ananta-legal.com",
  },
  {
    id: "capital-education",
    clientName: "Capital Education Foundation",
    projectName: "Building Futures",
    category: "websites",
    sector: "Education",
    description:
      "A study-abroad consultancy site built around discovery: destination and university directories, success stories, and a consultation booking flow for students and parents.",
    thumbnail: "/clients/capital-education.png",
    projectUrl: "https://capital-education.onrender.com/",
  },
  {
    id: "dream-high",
    clientName: "Dream High Education Academy",
    projectName: "तयारी · तालिम · सेवा",
    category: "websites",
    sector: "Training",
    description:
      "A Nepali-language academy site for exam preparation and training programmes, with course listings, intake information and enrolment enquiries in the language its students actually search in.",
    thumbnail: "/clients/dream-high.png",
    projectUrl: "https://dream-high-education-academy.onrender.com/",
  },
  // Software products live in `config/software.ts`, not here.
];

/**
 * Four films, streamed straight from Cloudinary's CDN.
 *
 * NOTE: the project names, sectors and descriptions below are placeholder copy
 * written to fill the layout — replace them with the real brief before this
 * goes public, since they describe actual client work.
 *
 * A slot with an empty `videoUrl` is filtered out, so a half-filled entry never
 * reaches the page.
 *
 * Paste the URL exactly as Cloudinary gives it — `.mp4` or `.mov` both work,
 * because `cloudinaryVideo()` adds `f_auto` and Cloudinary transcodes to a
 * format the browser can decode. A raw `.mov` will not play in Chrome or
 * Firefox on its own, so keep the transform.
 *
 * e.g. https://res.cloudinary.com/<cloud>/video/upload/v123456/reel.mp4
 */
export const clientVideos: ClientVideo[] = [
  {
    id: "artevo-studios",
    clientName: "Artevo Studios",
    projectName: "Studio reel",
    sector: "Creative",
    description:
      "A studio reel cut for social — recent work paced tightly enough to hold attention in a feed, and trimmed again for paid placements.",
    videoUrl:
      "https://res.cloudinary.com/iqv7ifzx/video/upload/v1788090068/artevo-studios.mp4",
    aspect: "portrait",
  },
  {
    id: "carzspa",
    clientName: "Carzspa",
    projectName: "Studio reel",
    sector: "Creative",
    description:
      "A studio reel cut for carzspa--edited to sell the service and quality of the work.",
    videoUrl:
      "https://res.cloudinary.com/iqv7ifzx/video/upload/v1788350487/carzspa.mp4",
    aspect: "portrait",
  },
  {
    id: "aayaduya-builders",
    clientName: "Aayaduya Builders",
    projectName: "Project showcase",
    sector: "Construction",
    description:
      "A walkthrough of a completed build, shot and edited to sell the craftsmanship rather than the floor plan.",
    videoUrl:
      "https://res.cloudinary.com/iqv7ifzx/video/upload/v1788090181/Ayaudaya-builders.mp4",
    aspect: "portrait",
  },
  {
    id: "international-brand-film",
    clientName: "International client",
    projectName: "Brand film",
    sector: "Overseas",
    description:
      "A short brand film for an overseas engagement, introducing the business and the people behind it inside a minute.",
    videoUrl:
      "https://res.cloudinary.com/iqv7ifzx/video/upload/v1788089967/foregin-client.mov",
    aspect: "portrait",
  },
  {
    id: "central-park",
    clientName: "Central Park",
    projectName: "Short-form series",
    sector: "Lifestyle",
    description:
      "A series of short cuts built to run as a sequence across a campaign rather than as one-off posts.",
    videoUrl:
      "https://res.cloudinary.com/iqv7ifzx/video/upload/v1788090227/central-park-shorts.mp4",
    aspect: "landscape",
  },
];

/** Only slots with a URL are shown, so empty placeholders never reach the page. */
export const publishedVideos = () => clientVideos.filter((v) => v.videoUrl.trim() !== "");

/** Adds delivery transforms to a Cloudinary URL and leaves anything else alone. */
export function cloudinaryVideo(url: string, transform = "q_auto,f_auto") {
  return url.includes("/video/upload/")
    ? url.replace("/video/upload/", `/video/upload/${transform}/`)
    : url;
}

/** A poster pulled from the video's first frame, so none is needed by hand. */
export function cloudinaryPoster(url: string) {
  if (!url.includes("/video/upload/")) return undefined;
  return url
    .replace("/video/upload/", "/video/upload/so_0,q_auto,f_auto,w_1200/")
    .replace(/\.(mp4|mov|webm|m4v)$/i, ".jpg");
}

export function projectsByCategory(category: ClientCategory) {
  return clientProjects.filter((p) => p.category === category);
}
