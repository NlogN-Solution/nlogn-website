import { NextResponse } from "next/server";
import { z } from "zod";
import { sendMail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Runs on the Node.js runtime: nodemailer and the SMTP transport need it.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(120),
  email: z.string().trim().email("That email address does not look right."),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  service: z.string().trim().max(120).optional().or(z.literal("")),
  budget: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().min(20, "A sentence or two more, please.").max(4000),
  company_website: z.string().max(0).optional(), // honeypot
});

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`contact:${ip}`, 5, 10 * 60_000);

  if (!limit.ok) {
    return NextResponse.json(
      { error: "That is a few too many messages. Try again in a few minutes, or email us directly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "We could not read that submission." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Silently accept honeypot hits so bots do not learn anything.
  if (data.company_website) {
    return NextResponse.json({ message: "Thanks — we have it." });
  }

  await sendMail({
    subject: `New enquiry — ${data.name}${data.company ? ` (${data.company})` : ""}`,
    replyTo: data.email,
    text: [
      `Name:    ${data.name}`,
      `Email:   ${data.email}`,
      `Company: ${data.company || "—"}`,
      `Service: ${data.service || "Not specified"}`,
      `Budget:  ${data.budget || "Not specified"}`,
      "",
      data.message,
      "",
      `— sent from the nlogn website (${ip})`,
    ].join("\n"),
  });

  return NextResponse.json({ message: "Thanks — we have it." });
}
