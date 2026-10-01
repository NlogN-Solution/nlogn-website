import { prisma } from "@/server/db";
import {
  adminNotification,
  enquiryAcknowledgement,
  sendMail,
} from "@/server/integrations/email";
import { getSettings } from "@/server/services/settings.service";
import type { EnquiryInput } from "@/server/schemas/messages";
import type { MessageStatus, Prisma } from "@/generated/prisma";
import { siteConfig } from "@/config/site";

/**
 * Inbound enquiries — the general contact form, package enquiries and the
 * custom-quote flow all land here.
 *
 * The record is written before either email is attempted, so a temperamental
 * SMTP server can never lose a lead. Delivery is then recorded on the row, and
 * the admin list shows which ones failed to notify.
 */

export async function recordEnquiry(
  input: EnquiryInput,
  meta: { ip?: string | null; userAgent?: string | null; referer?: string | null },
) {
  const settings = await getSettings();

  const message = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      company: input.company || null,
      phone: input.phone || null,
      service: input.service || null,
      budget: input.budget || null,
      message: input.message,
      source: input.source,
      context:
        input.packageName || input.planSummary
          ? ({ packageName: input.packageName || null, planSummary: input.planSummary || null } as Prisma.InputJsonValue)
          : undefined,
      ip: meta.ip ?? undefined,
      userAgent: meta.userAgent?.slice(0, 400) ?? undefined,
      referer: meta.referer?.slice(0, 400) ?? undefined,
    },
  });

  const payload = {
    name: input.name,
    email: input.email,
    company: input.company,
    phone: input.phone,
    service: input.service,
    budget: input.budget,
    message: input.message,
    packageName: input.packageName,
    planSummary: input.planSummary,
    source: input.source.replace(/_/g, " ").toLowerCase(),
  };

  // Recipients come from settings so the team can reroute without a deploy.
  const recipients =
    settings.notificationRecipients
      .split(/[,;\s]+/)
      .map((r) => r.trim())
      .filter((r) => r.includes("@")) ;
  const to = recipients.length ? recipients.join(", ") : (process.env.CONTACT_TO ?? siteConfig.email);

  const notification = adminNotification(payload);
  const adminResult = await sendMail({
    to,
    subject: notification.subject,
    html: notification.html,
    text: notification.text,
    replyTo: input.email,
  });

  if (settings.sendAcknowledgement) {
    const ack = enquiryAcknowledgement(payload);
    await sendMail({
      to: input.email,
      subject: ack.subject,
      html: ack.html,
      text: ack.text,
      replyTo: to.split(",")[0]?.trim(),
    });
  }

  if (adminResult.delivered) {
    await prisma.contactMessage
      .update({ where: { id: message.id }, data: { emailDelivered: true } })
      .catch(() => undefined);
  }

  return { message, delivered: adminResult.delivered };
}

export async function listMessages(filters: {
  q?: string;
  status?: string;
  source?: string;
  skip: number;
  take: number;
}) {
  const where: Prisma.ContactMessageWhereInput = {};
  if (filters.status && filters.status !== "all") where.status = filters.status as MessageStatus;
  if (filters.source && filters.source !== "all") {
    where.source = filters.source as Prisma.ContactMessageWhereInput["source"];
  }
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
      { message: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [items, total, unread] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  return { items, total, unread };
}

export function getMessage(id: string) {
  return prisma.contactMessage.findUnique({ where: { id } });
}

export function updateMessage(
  id: string,
  data: { status?: MessageStatus; isRead?: boolean; notes?: string | null },
) {
  return prisma.contactMessage.update({ where: { id }, data });
}

export function deleteMessage(id: string) {
  return prisma.contactMessage.delete({ where: { id } });
}
