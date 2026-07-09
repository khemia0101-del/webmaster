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
    const port = Number(process.env.ZOHO_SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.ZOHO_SMTP_USER,
        pass: process.env.ZOHO_SMTP_PASS
      }
    });

    const fromEmail = process.env.ZOHO_FROM_EMAIL || brandConfig.email;
    const fromName = process.env.ZOHO_FROM_NAME || brandConfig.name;
    const result = await transporter.sendMail({
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
