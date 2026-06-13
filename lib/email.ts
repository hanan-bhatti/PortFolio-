import { Resend } from "resend";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM || "onboarding@resend.dev";
  
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: options.to,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return true;
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
    }
  }

  // Fallback / Development logging
  console.log("=== MOCK EMAIL SENT ===");
  console.log(`From:    ${from}`);
  console.log(`To:      ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Text:    ${options.text}`);
  if (options.html) {
    console.log(`HTML:    [${options.html.length} chars]`);
  }
  console.log("=======================");
  return true;
}
