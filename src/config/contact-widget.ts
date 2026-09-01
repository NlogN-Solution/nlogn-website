import { siteConfig } from "@/config/site";

/**
 * The floating contact widget's configuration.
 *
 * The WhatsApp number is a plain international number with no `+`, spaces or
 * dashes — that is the only format wa.me accepts. It defaults to the studio's
 * published phone number and can be overridden per deployment with
 * NEXT_PUBLIC_WHATSAPP_NUMBER when sales runs on a different line.
 */

/** Strips everything wa.me will not take: `+977-9747745188` → `9779747745188`. */
function toWaNumber(raw: string) {
  return raw.replace(/\D/g, "");
}

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || toWaNumber(siteConfig.phone);

/** Prefilled so the team can see which channel the conversation came from. */
export const WHATSAPP_GREETING = `Hi ${siteConfig.name} — I came from your website and wanted to ask about`;

/**
 * wa.me hands off to the installed app on a phone and to WhatsApp Web on a
 * desktop, without us having to sniff the platform.
 */
export function whatsappUrl(message = WHATSAPP_GREETING, override?: string) {
  // The dashboard's Settings page wins when it has a value; the env var and
  // then the committed number are the fallbacks.
  const number = override?.replace(/\D/g, "") || WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
