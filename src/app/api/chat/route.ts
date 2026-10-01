import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/config/site";
import { capabilities } from "@/config/capabilities";
import { services } from "@/config/site";
import { softwareProducts } from "@/config/software";

/**
 * The AI assistant behind the floating chat widget.
 *
 * Streams plain UTF-8 text chunks — the widget appends them as they arrive, so
 * an answer starts rendering in a few hundred milliseconds rather than after
 * the whole completion. Without ANTHROPIC_API_KEY the route stays up and
 * answers with a hand-off to WhatsApp instead of failing, so a missing key
 * degrades the widget rather than breaking it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TURNS = 24;

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(MAX_TURNS),
});

/** Grounds the assistant in what the site actually offers. */
function systemPrompt() {
  const areas = capabilities.map((c) => `- ${c.label}: ${c.description}`).join("\n");
  const offers = services
    .map((s) => `- ${s.title} (from ${s.startingAt}, ${s.timeline}): ${s.short}`)
    .join("\n");
  const products = softwareProducts
    .map((p) => `- ${p.name} (${p.status}): ${p.tagline}`)
    .join("\n");

  return `You are the assistant on ${siteConfig.name}'s website (${siteConfig.legalName}), a digital growth studio in ${siteConfig.address.city}, ${siteConfig.address.countryName}.

You help visitors understand what the studio does and point them to the right page or the right next step. Be brief: two or three sentences unless asked for detail. Write plainly, no marketing language, no emoji, no bullet lists unless the visitor asks for a list.

What the studio does:
${areas}

Services and indicative pricing:
${offers}

Software products the studio builds and runs:
${products}

Useful links you can offer: /works, /services (pricing), /case-studies, /software, /process, /blog, /contact.
Contact: ${siteConfig.email}, ${siteConfig.phoneDisplay}.

Rules:
- Only state facts given above. If you do not know something — a specific quote, a timeline for their project, availability — say so and suggest they book a call at /contact or message the team on WhatsApp.
- Never invent client names, results, prices, or case studies.
- Do not ask for payment details, passwords, or personal data beyond a name and email if they volunteer it.
- If the visitor wants a person, point them to WhatsApp or /contact rather than trying to handle it.`;
}

const NO_KEY_REPLY =
  "The assistant is not connected right now, so I cannot answer here. The quickest route is WhatsApp — the button is in this same panel — or the contact form at /contact, which reaches the team directly.";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`chat:${ip}`, 20, 60_000);

  if (!limit.ok) {
    return NextResponse.json(
      { error: "That is a lot of questions at once. Give it a minute, or message us on WhatsApp." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "We could not read that message." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That message could not be sent." }, { status: 422 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(NO_KEY_REPLY, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const client = new Anthropic();

  try {
    const stream = client.messages.stream({
      model: "claude-opus-5",
      max_tokens: 1024,
      // A website FAQ answer is not a reasoning problem; low effort keeps the
      // widget responsive and the cost per conversation sensible.
      output_config: { effort: "low" },
      system: systemPrompt(),
      messages: parsed.data.messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta" &&
              chunk.delta.text
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch {
          controller.enqueue(
            encoder.encode(
              "\n\nSomething went wrong mid-answer. Try again, or message us on WhatsApp.",
            ),
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "The assistant is not configured. Message us on WhatsApp instead." },
        { status: 503 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "The assistant is busy. Try again shortly, or message us on WhatsApp." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "The assistant could not answer that. Try WhatsApp or the contact form." },
      { status: 502 },
    );
  }
}
