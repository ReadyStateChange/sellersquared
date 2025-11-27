export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailService {
  send(payload: EmailPayload): Promise<void>;
}

// Re-export active provider
export { GmailService as EmailService } from "./gmail";

