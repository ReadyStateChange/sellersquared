import nodemailer from "nodemailer";
import type { EmailPayload, EmailService } from "./index";

// Log config at startup (mask sensitive data)
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;
console.log("[Gmail] Config check:", {
  GMAIL_USER: gmailUser ? `${gmailUser.slice(0, 3)}***` : "NOT SET",
  GMAIL_APP_PASSWORD: gmailPass ? `${gmailPass.slice(0, 3)}***` : "NOT SET",
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
  debug: true,
  logger: true,
});

// Export for debug endpoint
export async function verifyTransporter() {
  const startTime = Date.now();
  await transporter.verify();
  return {
    verified: true,
    duration: `${Date.now() - startTime}ms`,
    user: gmailUser ? `${gmailUser.slice(0, 3)}***` : "NOT SET",
  };
}

export const GmailService: EmailService = {
  async send(payload: EmailPayload): Promise<void> {
    const startTime = Date.now();
    console.log("[Gmail] Attempting to send email:", {
      to: payload.to,
      subject: payload.subject,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verify transporter config first
      console.log("[Gmail] Verifying transporter...");
      await transporter.verify();
      console.log("[Gmail] Transporter verified OK");

      const result = await transporter.sendMail({
        from: gmailUser,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      console.log("[Gmail] Email sent successfully:", {
        messageId: result.messageId,
        response: result.response,
        duration: `${Date.now() - startTime}ms`,
      });
    } catch (error: any) {
      console.error("[Gmail] FAILED to send email:", {
        errorName: error?.name,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorCommand: error?.command,
        errorResponseCode: error?.responseCode,
        stack: error?.stack,
        duration: `${Date.now() - startTime}ms`,
      });
      throw error;
    }
  },
};
