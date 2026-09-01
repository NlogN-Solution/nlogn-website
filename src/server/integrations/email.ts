import nodemailer, { type Transporter } from "nodemailer";
import { siteConfig } from "@/config/site";

/**
 * Transactional email.
 *
 * Templates live here as functions rather than as strings scattered through the
 * API, so the wording of an enquiry acknowledgement is edited in one file. Every
 * message goes out as HTML with a plain-text alternative — a text/plain part is
 * what keeps an agency's mail out of the spam folder.
 *
 * Without SMTP credentials nothing throws: the payload is logged and the caller
 * is told it was not delivered, so a form submission is never lost to a missing
 * secret.
 */

export const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
);

let transport: Transporter | null = null;

function getTransport() {
  if (!smtpConfigured) return null;
  if (transport) return transport;

  const port = Number(process.env.SMTP_PORT ?? 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendMail(input: MailInput) {
  const t = getTransport();
  if (!t) {
    console.info("[mail] SMTP not configured — not sent:", input.subject, "→", input.to);
    return { delivered: false as const };
  }

  try {
    await t.sendMail({
      from: `"${siteConfig.name}" <${process.env.SMTP_USER}>`,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { delivered: true as const };
  } catch (error) {
    console.error("[mail] delivery failed:", error);
    return { delivered: false as const };
  }
}

/** Verifies the SMTP connection without sending anything. Used by System status. */
export async function verifySmtp() {
  const t = getTransport();
  if (!t) return { ok: false as const, reason: "SMTP is not configured." };
  try {
    await t.verify();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, reason: error instanceof Error ? error.message : "Unknown error" };
  }
}

/* ── templates ───────────────────────────────────────────────────────────── */

const BRAND = "#6c47ff";
const INK = "#0b0b0f";
const MUTED = "#74747f";
const LINE = "#e8e4f2";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Shell used by every template. Table-based and inline-styled on purpose —
 * Outlook and Gmail still ignore most of a <style> block.
 */
function shell(opts: { heading: string; preheader: string; body: string }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;">
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND};font-weight:600;">${escapeHtml(siteConfig.name)}</p>
          <h1 style="margin:14px 0 0;font-size:22px;line-height:1.25;color:${INK};font-weight:800;letter-spacing:-0.02em;">${escapeHtml(opts.heading)}</h1>
        </td></tr>
        <tr><td style="padding:20px 32px 32px;">${opts.body}</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${LINE};background:#faf9fe;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
            ${escapeHtml(siteConfig.legalName)} · ${escapeHtml(siteConfig.address.city)}, ${escapeHtml(siteConfig.address.countryName)}<br>
            <a href="mailto:${siteConfig.email}" style="color:${BRAND};text-decoration:none;">${siteConfig.email}</a> · ${escapeHtml(siteConfig.phoneDisplay)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function rows(pairs: [string, string | null | undefined][]) {
  return pairs
    .filter(([, v]) => v && String(v).trim() !== "")
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid ${LINE};font-size:13px;color:${MUTED};width:38%;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:9px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};font-weight:500;">${escapeHtml(String(value))}</td>
      </tr>`,
    )
    .join("");
}

export type EnquiryPayload = {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  service?: string | null;
  budget?: string | null;
  message: string;
  /** Package name or built growth stack, when the enquiry came from pricing. */
  packageName?: string | null;
  planSummary?: string | null;
  source: string;
};

/** What lands in the studio's inbox. Built to be answerable without opening the CMS. */
export function adminNotification(payload: EnquiryPayload) {
  const heading =
    payload.packageName || payload.planSummary
      ? "New pricing enquiry"
      : "New website enquiry";

  const body = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#3f3f4a;">
      ${escapeHtml(payload.name)} got in touch through the website. Reply straight to this email
      and it goes back to them.
    </p>
    ${
      payload.packageName || payload.planSummary
        ? `<div style="margin:0 0 20px;padding:14px 16px;background:#f1edff;border:1px solid #ddd3ff;border-radius:12px;">
            <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND};font-weight:600;">Interested in</p>
            <p style="margin:6px 0 0;font-size:15px;color:${INK};font-weight:600;">${escapeHtml(payload.packageName ?? payload.planSummary ?? "")}</p>
          </div>`
        : ""
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows([
        ["Name", payload.name],
        ["Email", payload.email],
        ["Company", payload.company],
        ["Phone", payload.phone],
        ["Service", payload.service],
        ["Budget", payload.budget],
        ["Source", payload.source],
      ])}
    </table>
    <p style="margin:22px 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};font-weight:600;">Message</p>
    <div style="padding:16px;background:#faf9fe;border:1px solid ${LINE};border-radius:12px;font-size:14px;line-height:1.7;color:${INK};white-space:pre-wrap;">${escapeHtml(payload.message)}</div>
    <p style="margin:24px 0 0;">
      <a href="${siteConfig.url}/admin/messages" style="display:inline-block;background:${INK};color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:12px;">Open in the dashboard</a>
    </p>`;

  const text = [
    heading,
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.company ? `Company: ${payload.company}` : "",
    payload.phone ? `Phone: ${payload.phone}` : "",
    payload.service ? `Service: ${payload.service}` : "",
    payload.budget ? `Budget: ${payload.budget}` : "",
    payload.packageName ? `Package: ${payload.packageName}` : "",
    payload.planSummary ? `Stack: ${payload.planSummary}` : "",
    `Source: ${payload.source}`,
    "",
    "Message:",
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `${heading}: ${payload.name}${payload.company ? ` (${payload.company})` : ""}`,
    html: shell({ heading, preheader: `${payload.name} — ${payload.message.slice(0, 90)}`, body }),
    text,
  };
}

/** The visitor's acknowledgement. Sets the reply expectation, promises nothing else. */
export function enquiryAcknowledgement(payload: EnquiryPayload) {
  const interest = payload.packageName ?? payload.planSummary;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3f3f4a;">
      Hi ${escapeHtml(payload.name.split(" ")[0] ?? payload.name)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3f3f4a;">
      Thanks for getting in touch. Your message reached us and a person — not an autoresponder —
      will read it. We reply to every enquiry within one working day, usually with a question or
      two before we send anything that looks like a proposal.
    </p>
    ${
      interest
        ? `<div style="margin:0 0 18px;padding:14px 16px;background:#f1edff;border:1px solid #ddd3ff;border-radius:12px;">
            <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND};font-weight:600;">You asked about</p>
            <p style="margin:6px 0 0;font-size:15px;color:${INK};font-weight:600;">${escapeHtml(interest)}</p>
          </div>`
        : ""
    }
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};font-weight:600;">What you sent us</p>
    <div style="padding:16px;background:#faf9fe;border:1px solid ${LINE};border-radius:12px;font-size:14px;line-height:1.7;color:${INK};white-space:pre-wrap;">${escapeHtml(payload.message)}</div>
    <p style="margin:22px 0 0;font-size:15px;line-height:1.65;color:#3f3f4a;">
      If it is urgent, reply to this email or message us on WhatsApp at ${escapeHtml(siteConfig.phoneDisplay)}.
    </p>`;

  return {
    subject: `We have your message — ${siteConfig.name}`,
    html: shell({
      heading: "Thanks — we have your message",
      preheader: "A person will read this and reply within one working day.",
      body,
    }),
    text: [
      `Hi ${payload.name.split(" ")[0] ?? payload.name},`,
      "",
      "Thanks for getting in touch. Your message reached us and a person will read it.",
      "We reply to every enquiry within one working day.",
      interest ? `\nYou asked about: ${interest}` : "",
      "",
      "What you sent us:",
      payload.message,
      "",
      `If it is urgent, reply to this email or message us on WhatsApp at ${siteConfig.phoneDisplay}.`,
      "",
      `— ${siteConfig.name}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/** Newsletter double-opt-in style welcome. */
export function newsletterWelcome(email: string) {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3f3f4a;">
      You are on the list for The Growth Brief — one practical essay a month on web performance,
      SEO and growth. No pitch, and no more than one email a month.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.65;color:${MUTED};">
      If this was not you, ignore this email and you will hear nothing further.
    </p>`;

  return {
    subject: "You're on the list — The Growth Brief",
    html: shell({ heading: "Welcome to The Growth Brief", preheader: "One essay a month. No pitch.", body }),
    text: `You are on the list for The Growth Brief — one practical essay a month.\n\nIf this was not you (${email}), ignore this email.`,
  };
}
