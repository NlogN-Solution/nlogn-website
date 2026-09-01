import { NextResponse } from "next/server";
import { prisma, databaseConfigured } from "@/server/db";
import { newsletterSchema } from "@/server/schemas/messages";
import { newsletterWelcome, sendMail } from "@/server/integrations/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/config/site";

/**
 * Newsletter signup. Subscribers are stored so the list is exportable, and the
 * response is deliberately identical for a new address and one already on the
 * list — otherwise the endpoint becomes a way to test whether an address is
 * subscribed.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`newsletter:${ip}`, 5, 10 * 60_000);

  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "We could not read that submission." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    let isNew = true;

    if (databaseConfigured) {
      const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
      isNew = !existing || !existing.isActive;

      await prisma.newsletterSubscriber.upsert({
        where: { email },
        create: { email, source: parsed.data.source ?? "website", confirmedAt: new Date() },
        update: { isActive: true, unsubscribedAt: null },
      });
    }

    if (isNew) {
      const welcome = newsletterWelcome(email);
      await sendMail({
        to: email,
        subject: welcome.subject,
        html: welcome.html,
        text: welcome.text,
      });
      await sendMail({
        to: process.env.CONTACT_TO ?? siteConfig.email,
        subject: "New Growth Brief subscriber",
        html: `<p>${email} subscribed from the website.</p>`,
        text: `${email} subscribed from the website.`,
      });
    }

    return NextResponse.json({ message: "You're on the list. First issue lands next month." });
  } catch (error) {
    console.error("[newsletter] signup failed:", error);
    return NextResponse.json({ error: "We could not sign you up just now." }, { status: 502 });
  }
}
