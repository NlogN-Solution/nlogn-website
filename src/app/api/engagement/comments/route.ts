import { errors, ok, readBody } from "@/server/http";
import { publicRoute } from "@/server/middleware/guard";
import { commentSchema, engagementTargetSchema } from "@/server/schemas/engagement";
import { createComment, listComments } from "@/server/services/engagement.service";
import { getMergedPost, getMergedWork } from "@/server/public-content";
import { commentNotification, sendMail, smtpConfigured } from "@/server/integrations/email";
import { absoluteUrl } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { ContentKind } from "@/lib/engagement";

/**
 * The comment thread.
 *
 * GET is public and returns names and bodies only — the email address is
 * collected so a real person is behind the comment and so it can be replied to,
 * and it never leaves the server.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Refuses a comment on something that does not exist.
 *
 * Without this the endpoint writes a row for any slug at all, and the table
 * becomes a place to store arbitrary text. Checked against both sources,
 * because the committed posts are as real as the CMS ones.
 */
async function contentExists(kind: ContentKind, slug: string) {
  if (kind === "CASE_STUDY") return Boolean(await getMergedWork(slug));
  return Boolean(await getMergedPost(slug));
}

export const GET = publicRoute("comments-read", { max: 60, windowMs: 60_000 }, async (_request, { url }) => {
  const parsed = engagementTargetSchema.safeParse({
    kind: url.searchParams.get("kind"),
    slug: url.searchParams.get("slug"),
  });
  if (!parsed.success) return errors.badRequest("Which article are these comments for?");

  const comments = await listComments(parsed.data.kind, parsed.data.slug);
  return ok({ comments });
});

/*
 * Deliberately tight. Somebody with something to say writes one comment, not
 * five in a minute, and this is the only unauthenticated write on the site that
 * puts text in front of other readers.
 */
export const POST = publicRoute("comment", { max: 3, windowMs: 10 * 60_000 }, async (request, { ip }) => {
  const { data, response } = await readBody(request, commentSchema);
  if (response) return response;

  if (!(await contentExists(data.kind, data.slug))) {
    return errors.notFound("That article");
  }

  const comment = await createComment(data, {
    ip,
    userAgent: request.headers.get("user-agent"),
  });

  if (!comment) {
    return errors.badRequest("We could not post that just now. Please try again shortly.");
  }

  // Best-effort: the comment is already saved, and a mail server having a bad
  // day must not turn a successful post into an error the visitor sees.
  if (smtpConfigured) {
    const kindLabel = data.kind === "CASE_STUDY" ? "case study" : data.kind.toLowerCase();
    const path = data.kind === "CASE_STUDY" ? "/case-studies" : "/blog";
    const mail = commentNotification({
      name: comment.name,
      email: data.email,
      body: comment.body,
      kindLabel,
      slug: data.slug,
      url: absoluteUrl(`${path}/${data.slug}`),
    });

    void sendMail({ to: process.env.CONTACT_TO ?? siteConfig.email, ...mail }).catch((error) =>
      console.error("[comments] notification failed:", error),
    );
  }

  return ok({
    comment,
    message: "Thank you for your comment — it is truly appreciated.",
  });
});
