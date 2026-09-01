import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
const secure = port === 465;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass,
  },
});

export const mailFromName = process.env.SMTP_FROM_NAME || "fextiva";
export const mailFromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@fextiva.com";
