import nodemailer from "nodemailer";

export function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const secure = port === 465;
  const user = process.env.SMTP_USER?.trim();
  // Strip whitespace from Gmail app passwords (Google displays them as 4-character chunks)
  const rawPass = process.env.SMTP_PASS?.trim();
  const pass = host.includes("gmail.com") ? rawPass?.replace(/\s+/g, "") : rawPass;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export function getMailSender() {
  const name = process.env.SMTP_FROM_NAME || "Fextiva";
  const user = process.env.SMTP_USER?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();

  // For Gmail SMTP, the envelope 'from' must be the authenticated user address to avoid delivery rejection
  const address = fromEmail || user || "noreply@fextiva.com";

  return {
    name,
    address,
    formatted: `"${name}" <${address}>`,
  };
}

// Backward-compatible exports
export const transporter = new Proxy({} as nodemailer.Transporter, {
  get(_target, prop) {
    const instance = getTransporter() as any;
    const value = instance[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export const mailFromName = process.env.SMTP_FROM_NAME || "Fextiva";
export const mailFromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@fextiva.com";

