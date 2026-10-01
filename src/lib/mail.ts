import nodemailer from "nodemailer";
import { siteConfig } from "@/config/site";

/**
 * Sends transactional mail when SMTP credentials are present. Without them the
 * payload is logged instead, so local development and previews never fail a
 * form submission over missing secrets.
 */
export async function sendMail(opts: { subject: string; text: string; replyTo?: string }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.info("[mail] SMTP not configured — message logged only:\n", opts.subject, "\n", opts.text);
    return { delivered: false as const };
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transport.sendMail({
    from: `"${siteConfig.name} website" <${SMTP_USER}>`,
    to: CONTACT_TO ?? siteConfig.email,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
  });

  return { delivered: true as const };
}
