import { z } from "zod";

/**
 * Public form input. Everything here crosses a trust boundary, so the limits
 * are deliberately tight — a 4000-character message is generous for an enquiry
 * and cheap to store, a 40,000-character one is someone probing.
 */

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(120),
  email: z.string().trim().email("That email address does not look right.").max(200),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  service: z.string().trim().max(120).optional().or(z.literal("")),
  budget: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().min(20, "A sentence or two more, please.").max(4000),
  /** Package or built stack carried over from the pricing pages. */
  packageName: z.string().trim().max(200).optional().or(z.literal("")),
  planSummary: z.string().trim().max(1200).optional().or(z.literal("")),
  source: z
    .enum(["CONTACT_FORM", "PACKAGE_ENQUIRY", "CUSTOM_QUOTE", "GROWTH_STACK", "CHAT_WIDGET"])
    .default("CONTACT_FORM"),
  /**
   * Honeypot. Bots fill it; people never see it.
   *
   * Deliberately permissive here: rejecting it at validation would tell the bot
   * exactly which field gave it away. The route accepts the submission with a
   * normal success response and quietly drops it instead.
   */
  company_website: z.string().max(200).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email("That email address does not look right.").max(200),
  source: z.string().trim().max(60).optional(),
});

export const messageUpdateSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED", "SPAM"]).optional(),
  isRead: z.boolean().optional(),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});
