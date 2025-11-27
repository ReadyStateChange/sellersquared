import { Resend } from "resend";
import type { EmailPayload, EmailService } from "./index";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

console.log("[Resend] Config check:", {
  RESEND_API_KEY: apiKey ? `${apiKey.slice(0, 6)}***` : "NOT SET",
  RESEND_FROM_EMAIL: fromEmail,
});

const resend = new Resend(apiKey);

export async function verifyResend(): Promise<{
  verified: boolean;
  duration: string;
}> {
  const startTime = Date.now();

  // Resend doesn't have a verify method, but we can check domains
  try {
    await resend.domains.list();
    return {
      verified: true,
      duration: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    return {
      verified: false,
      duration: `${Date.now() - startTime}ms`,
    };
  }
}

export const ResendService: EmailService = {
  async send(payload: EmailPayload): Promise<void> {
    const startTime = Date.now();
    console.log("[Resend] Attempting to send email:", {
      to: payload.to,
      subject: payload.subject,
      from: fromEmail,
      timestamp: new Date().toISOString(),
    });

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      if (error) {
        console.error("[Resend] API error:", {
          error,
          duration: `${Date.now() - startTime}ms`,
        });
        throw new Error(error.message);
      }

      console.log("[Resend] Email sent successfully:", {
        emailId: data?.id,
        duration: `${Date.now() - startTime}ms`,
      });
    } catch (error: any) {
      console.error("[Resend] FAILED to send email:", {
        errorName: error?.name,
        errorMessage: error?.message,
        stack: error?.stack,
        duration: `${Date.now() - startTime}ms`,
      });
      throw error;
    }
  },
};

