export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailService {
  send(payload: EmailPayload): Promise<void>;
}

// Re-export active provider (changed from Gmail to Resend)
export { ResendService as ActiveEmailService } from "./resend";
export { verifyResend } from "./resend";

