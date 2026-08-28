import { transporter, mailFromName, mailFromEmail } from "@/lib/mail/transport";

export async function sendVerificationEmail({
  email,
  name,
  otp,
  url,
}: {
  email: string;
  name?: string;
  otp?: string;
  url?: string;
}) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #10b981; margin-bottom: 16px;">Welcome to AfroReality!</h2>
        <p style="color: #333; font-size: 15px;">Hello ${name || 'there'},</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Thank you for joining AfroReality. Please use the verification code below to verify your email address:
        </p>
        <div style="background: #f4fdf7; border: 2px dashed #10b981; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${otp || '123456'}</span>
        </div>
        ${url ? `<div style="text-align: center; margin: 20px 0;"><a href="${url}" style="background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a></div>` : ''}
        <p style="color: #888; font-size: 12px; margin-top: 32px;">If you did not request this email, please ignore it.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${mailFromName}" <${mailFromEmail}>`,
      to: email,
      subject: "Your AfroReality verification code",
      html,
    });

    console.log("[EMAIL] Verification email sent to", email, "messageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[EMAIL] Failed to send verification email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail({
  email,
  name,
  otp,
  resetUrl,
}: {
  email: string;
  name?: string;
  otp?: string;
  resetUrl?: string;
}) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #ef4444; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #333; font-size: 15px;">Hello ${name || 'there'},</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          We received a request to reset your AfroReality password. Use the verification code below:
        </p>
        <div style="background: #fef2f2; border: 2px dashed #ef4444; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ef4444;">${otp || '123456'}</span>
        </div>
        ${resetUrl ? `<div style="text-align: center; margin: 20px 0;"><a href="${resetUrl}" style="background: #ef4444; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a></div>` : ''}
        <p style="color: #888; font-size: 12px; margin-top: 32px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${mailFromName}" <${mailFromEmail}>`,
      to: email,
      subject: "Reset your AfroReality password",
      html,
    });

    console.log("[EMAIL] Password reset email sent to", email, "messageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[EMAIL] Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}
