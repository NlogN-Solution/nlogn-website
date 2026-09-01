import { NextResponse } from "next/server";
import { enquirySchema } from "@/server/schemas/messages";
import { recordEnquiry } from "@/server/services/message.service";
import { adminNotification, enquiryAcknowledgement, sendMail } from "@/server/integrations/email";
import { databaseConfigured } from "@/server/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/config/site";

/**
 * The public enquiry endpoint: the contact form, package enquiries and the
 * custom-quote flow all post here.
 *
 * The response shape is unchanged from the original handler (`{ message }` on
 * success, `{ error }` on failure) so the existing form component keeps working
 * exactly as it did.
 *
 * Without a database the submission still goes out by email rather than being
 * refused — losing a lead to a missing environment variable would be the worst
 * possible failure mode for this route.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`contact:${ip}`, 5, 10 * 60_000);

  if (!limit.ok) {
    return NextResponse.json(
      {
        error:
          "That is a few too many messages. Try again in a few minutes, or email us directly.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "We could not read that submission." }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 422 },
    );
  }

  // The honeypot is silently accepted rather than rejected — a bot told it
  // failed simply tries again with the field cleared.
  if (parsed.data.company_website) {
    return NextResponse.json({ message: "Message received." });
  }

  const meta = {
    ip,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
  };

  try {
    if (databaseConfigured) {
      await recordEnquiry(parsed.data, meta);
    } else {
      const payload = { ...parsed.data, source: parsed.data.source.replace(/_/g, " ").toLowerCase() };
      const notification = adminNotification(payload);
      await sendMail({
        to: process.env.CONTACT_TO ?? siteConfig.email,
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
        replyTo: parsed.data.email,
      });
      const ack = enquiryAcknowledgement(payload);
      await sendMail({
        to: parsed.data.email,
        subject: ack.subject,
        html: ack.html,
        text: ack.text,
      });
    }

    return NextResponse.json({
      message: "Message received — we will be in touch within one working day.",
    });
  } catch (error) {
    console.error("[contact] submission failed:", error);
    return NextResponse.json(
      { error: "We could not send that just now. Please email us directly." },
      { status: 502 },
    );
  }
}
