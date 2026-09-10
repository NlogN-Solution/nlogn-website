import { cookies } from "next/headers";
import { prisma, databaseConfigured } from "@/server/db";
import { errors, ok, readBody } from "@/server/http";
import { publicRoute } from "@/server/middleware/guard";
import { unlockSchema } from "@/server/schemas/resources";
import { issueGrant, isDisposableEmail, recordLead } from "@/server/services/resource-access.service";
import { resourceDelivery, sendMail } from "@/server/integrations/email";
import { CAMPAIGN_COOKIE, RESOURCE_TYPE_LABELS, resourceDestination } from "@/config/resources";
import { absoluteUrl } from "@/lib/utils";

/**
 * Opening the gate on a resource.
 *
 * The visitor is on a phone, in Instagram's in-app browser, with one field in
 * front of them — so this route is written to succeed. The download is returned
 * in the response and unlocked in place; the email is a copy, not the delivery,
 * and a failure to send it never fails the request. Somebody who typed their
 * address correctly and got nothing back would be the one unforgivable outcome
 * here, and SMTP is the least reliable thing in the chain.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = publicRoute(
  "resource-unlock",
  // Ten in fifteen minutes. A person unlocking three or four things in a
  // sitting is the behaviour this library is built to encourage; a script
  // harvesting the whole catalogue is not.
  { max: 10, windowMs: 15 * 60_000 },
  async (request, { ip }) => {
    if (!databaseConfigured) {
      return errors.badRequest("Downloads are not available right now.");
    }

    const body = await readBody(request, unlockSchema);
    if (body.response) return body.response;

    const { slug, email, name, marketingConsent } = body.data;

    if (isDisposableEmail(email)) {
      return errors.badRequest(
        "That looks like a disposable address, and the link would expire before you saw it. Use one you can actually open.",
      );
    }

    const resource = await prisma.resource.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    if (!resource) return errors.notFound("That resource");

    if (resource.gate === "ACCOUNT") {
      // Declared in the schema, not yet implemented anywhere. Refuse clearly
      // rather than issuing a grant for a door that does not exist.
      return errors.badRequest("That resource is not available for download yet.");
    }

    if (resource.gate === "FREE") {
      // Nothing to unlock: the page already renders the destination. Answering
      // 400 rather than issuing a grant keeps one story about where a free
      // resource comes from.
      return errors.badRequest("That resource is open — no email needed.");
    }

    /*
     * Attribution comes from the cookie `/r/<code>` set, with the posted value
     * as the fallback. The cookie is the better answer because it survives the
     * visitor browsing the site for ten minutes before converting; the body is
     * what is left when cookies were blocked, which in an in-app browser is
     * often enough to matter.
     */
    const jar = await cookies();
    const campaign = jar.get(CAMPAIGN_COOKIE)?.value || body.data.campaign || null;

    await recordLead({
      resourceId: resource.id,
      email,
      name: name || null,
      campaign,
      source: campaign ? "short-link" : "direct",
      referer: request.headers.get("referer"),
      marketingConsent,
      ip,
      userAgent: request.headers.get("user-agent"),
    });

    const grant = await issueGrant(resource.id, email);
    const downloadPath = `/api/resources/download/${grant.token}`;

    /*
     * What the email promises, decided by the same function as the button on
     * the page. A resource with a repository URL sends them to GitHub, and the
     * mail has to say so — an email headed "your download" that opens a repo is
     * the same broken promise as the button that used to say it.
     */
    const destination = resourceDestination({
      repo: Boolean(resource.repoUrl),
      external: Boolean(resource.externalUrl),
      file: Boolean(resource.fileMediaId),
    });
    const what =
      resource.fileLabel ||
      (destination === "repo"
        ? "Public repository"
        : destination === "external"
          ? "Opens in a new tab"
          : RESOURCE_TYPE_LABELS[resource.type]);
    const cta =
      destination === "repo"
        ? "Download source code"
        : destination === "external"
          ? "Open it"
          : "Download it now";

    /*
     * Not awaited on the critical path. The page needs its link now; the email
     * is a copy for tomorrow, and making the visitor wait on an SMTP handshake
     * — or fail because of one — would be the wrong trade in both directions.
     */
    sendMail({
      to: email,
      ...resourceDelivery({
        title: resource.title,
        url: absoluteUrl(downloadPath),
        expiresAt: grant.expiresAt,
        what,
        cta,
        licence: resource.licence,
      }),
    }).catch((error) => console.error("[resources] delivery email failed:", error));

    return ok({
      downloadUrl: downloadPath,
      expiresAt: grant.expiresAt.toISOString(),
      emailed: email,
      title: resource.title,
    });
  },
);
