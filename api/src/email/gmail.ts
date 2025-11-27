import nodemailer from "nodemailer";
import type { EmailPayload, EmailService } from "./index";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const GmailService: EmailService = {
  async send(payload: EmailPayload): Promise<void> {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  },
};

