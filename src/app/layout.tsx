import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Search indexing stays off until the site is approved for launch.
// Set SITE_INDEXABLE=true in the deployment environment to allow it.
const indexable = process.env.SITE_INDEXABLE === "true";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? site.mainSite),
  title: site.title,
  description: site.description,
  robots: { index: indexable, follow: indexable },
  openGraph: {
    title: site.title,
    description: site.description,
    siteName: site.name,
    type: "website",
    images: [{ url: "/images/hero.png", width: 1536, height: 1024 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${spaceGrotesk.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
