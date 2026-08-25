import "server-only";

import nodemailer from "nodemailer";
import { brandConfig } from "@/lib/config";
import type { Lead } from "@/lib/types";

export type MailResult =
  | { status: "sent"; messageId?: string }
  | { status: "failed"; error: string }
  | { status: "skipped"; reason: string };

function smtpConfigured() {
  return Boolean(
    process.env.ZOHO_SMTP_HOST &&
      process.env.ZOHO_SMTP_PORT &&
      process.env.ZOHO_SMTP_USER &&
      process.env.ZOHO_SMTP_PASS
  );
}

function transporter() {
  const port = Number(process.env.ZOHO_SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.ZOHO_SMTP_USER,
      pass: process.env.ZOHO_SMTP_PASS
    }
  });
}

function stableMessageId(kind: string, lead: Lead) {
  const token = lead.id.replace(/[^a-zA-Z0-9.-]/g, "");
  return `<${kind}.${token}@conquistadoroil.com>`;
}

export async function sendLeadReplyEmail({
  lead,
  subject,
  body
}: {
  lead: Lead;
  subject: string;
  body: string;
}): Promise<MailResult> {
  if (!lead.email) return { status: "skipped", reason: "Lead has no email address." };
  if (!smtpConfigured()) return { status: "failed", error: "Zoho SMTP environment variables are not configured." };

  try {
    const fromEmail = process.env.ZOHO_FROM_EMAIL || brandConfig.email;
    const fromName = process.env.ZOHO_FROM_NAME || brandConfig.name;
    const result = await transporter().sendMail({
      messageId: stableMessageId("lead-reply", lead),
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: fromEmail,
      to: lead.email,
      subject,
      text: body
    });

    return { status: "sent", messageId: result.messageId };
  } catch (err) {
    return { status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
}

/** Durable no-database handoff for one compact phone lead. */
export async function sendPhoneLeadNotificationEmail(lead: Lead): Promise<MailResult> {
  if (!smtpConfigured()) {
    return {
      status: "failed",
      error: "Zoho SMTP environment variables are not configured."
    };
  }

  const to =
    process.env.PHONE_LEAD_NOTIFICATION_EMAIL ||
    process.env.ZOHO_FROM_EMAIL ||
    brandConfig.email;
  const fromEmail = process.env.ZOHO_FROM_EMAIL || brandConfig.email;
  const fromName = process.env.ZOHO_FROM_NAME || brandConfig.name;
  const kind = lead.details.inquiryKind || lead.type.replaceAll("_", " ");
  const service = lead.details.serviceType || "Not specified";
  const summary = lead.details.summary || lead.details.issue || "No summary provided.";
  const routing = lead.phoneRouting?.status || "logged_only";

  const body = [
    "New structured Vapi phone inquiry",
    "",
    `Lead ID: ${lead.id}`,
    `Received: ${lead.createdAt}`,
    `Category: ${kind}`,
    `Caller: ${lead.name}`,
    `Callback: ${lead.phone}`,
    `Email: ${lead.email || "Not provided"}`,
    `Service: ${service}`,
    `Address: ${lead.siteAddress || "Not provided"}`,
    `Area: ${lead.zone}`,
    `Urgency: ${lead.details.urgency || "Not specified"}`,
    `Sharing consent: ${lead.details.consentToShare || "false"}`,
    `Routing: ${routing}`,
    `Follow-up target: ${lead.phoneRouting?.nextAttemptAt || "As soon as practical"}`,
    "",
    `Summary: ${summary}`,
    "",
    "No transcript, recording, or raw Vapi artifact is attached."
  ].join("\n");

  try {
    const result = await transporter().sendMail({
      messageId: stableMessageId("phone-lead", lead),
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: lead.email || fromEmail,
      to,
      subject: `[Phone lead] ${kind} — ${lead.name} — ${lead.zone}`,
      text: body
    });
    return { status: "sent", messageId: result.messageId };
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
