import { DM_Sans, Space_Grotesk } from "next/font/google";

// The home page's type pair, shared by every public route so the whole site
// reads as one design (see `.nlh` in (home)/landing.css and `.site-theme` in
// globals.css).
export const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});
