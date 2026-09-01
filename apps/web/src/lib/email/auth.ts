import { transporter, mailFromName, mailFromEmail } from "@/lib/mail/transport";
import { getOrgImageUrl } from "@/lib/image-url-utils";

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
        <h2 style="color: #10b981; margin-bottom: 16px;">Welcome to fextiva!</h2>
        <p style="color: #333; font-size: 15px;">Hello ${name || 'there'},</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Thank you for joining fextiva. Please use the verification code below to verify your email address:
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
      subject: "Your fextiva verification code",
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
          We received a request to reset your fextiva password. Use the verification code below:
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
      subject: "Reset your fextiva password",
      html,
    });

    console.log("[EMAIL] Password reset email sent to", email, "messageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[EMAIL] Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendOrganizationInvitationEmail({
  email,
  organizationName,
  inviterName,
  role,
  inviteUrl,
}: {
  email: string;
  organizationName: string;
  inviterName?: string;
  role?: string;
  inviteUrl: string;
}) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #10b981; margin-bottom: 16px;">You've Been Invited to Join ${organizationName}!</h2>
        <p style="color: #333; font-size: 15px;">Hello,</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          ${inviterName ? `<strong>${inviterName}</strong>` : "An administrator"} has invited you to join <strong>${organizationName}</strong> as a <strong>${role || "member"}</strong> on fextiva.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${inviteUrl}" style="background: #10b981; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 12px;">Or copy and paste this link in your browser:<br/><a href="${inviteUrl}" style="color: #10b981;">${inviteUrl}</a></p>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">This invitation will expire in 7 days.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${mailFromName}" <${mailFromEmail}>`,
      to: email,
      subject: `Invitation to join ${organizationName} on fextiva`,
      html,
    });

    console.log("[EMAIL] Invitation email sent to", email, "messageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[EMAIL] Failed to send invitation email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendEventVotingKeyEmail({
  email,
  name,
  eventName,
  organizationName,
  organizationBannerUrl,
  organizationLogoUrl,
  votingKey,
  votingUrl,
}: {
  email: string;
  name: string;
  eventName: string;
  organizationName: string;
  organizationBannerUrl?: string | null;
  organizationLogoUrl?: string | null;
  votingKey: string;
  votingUrl?: string | null;
}) {
  try {
    const bannerUrlResolved = getOrgImageUrl(organizationBannerUrl);
    const logoUrlResolved = getOrgImageUrl(organizationLogoUrl);

    const bannerHtml = bannerUrlResolved
      ? `<div style="width: 100%; height: 160px; overflow: hidden; background-color: #1f2937; border-radius: 12px 12px 0 0;">
          <img src="${bannerUrlResolved}" alt="${organizationName}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>`
      : `<div style="width: 100%; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;"></div>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff;">
        ${bannerHtml}
        <div style="padding: 28px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            ${logoUrlResolved ? `<img src="${logoUrlResolved}" alt="${organizationName}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; margin-right: 12px;" />` : ''}
            <div>
              <p style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #10b981; letter-spacing: 0.05em;">${organizationName}</p>
              <h2 style="margin: 2px 0 0; font-size: 20px; color: #111827;">Official Voting Key</h2>
            </div>
          </div>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            You have been registered as a verified voter for <strong>${eventName}</strong>. Below is your confidential voting key required to cast your ballot:
          </p>

          <div style="background: #f3f4f6; border: 2px dashed #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
            <p style="margin: 0 0 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #6b7280; letter-spacing: 0.1em;">Your Private Voting Key</p>
            <span style="font-size: 28px; font-family: monospace; font-weight: 800; letter-spacing: 4px; color: #111827;">${votingKey}</span>
          </div>

          <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #854d0e; line-height: 1.5;">
              🔒 <strong>Ballot Secrecy:</strong> This key is strictly private and belongs to you. Organization administrators and organizers cannot see this key.
            </p>
          </div>

          ${votingUrl ? `<div style="text-align: center; margin: 28px 0;"><a href="${votingUrl}" style="background: #10b981; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Go to Voting Portal</a></div>` : ''}

          <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center;">
            © ${new Date().getFullYear()} ${organizationName} · Powered by fextiva
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${organizationName} via fextiva" <${mailFromEmail}>`,
      to: email,
      subject: `Your Voting Key for ${eventName} - ${organizationName}`,
      html,
    });

    console.log("[EMAIL] Voting key email sent to", email, "messageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[EMAIL] Failed to send voting key email:", error);
    return { success: false, error: error.message };
  }
}
