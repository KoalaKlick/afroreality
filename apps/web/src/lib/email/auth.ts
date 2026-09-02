import { transporter, mailFromName, mailFromEmail } from "@/lib/mail/transport";
import { getOrgImageUrl } from "@/lib/image-url-utils";

// Shared design tokens matching the AfroReality email system, derived from
// the 3 brand colors in logo.svg:
//   primary   = #53967a (green/teal)
//   secondary = #e88722 (orange/amber)
//   tertiary  = #ca0808 (red)

const ACCENT_PRIMARY = "#53967a";
const ACCENT_SECONDARY = "#e88722";
const ACCENT_TERTIARY = "#ca0808";
const TEXT_PRIMARY = "#111827";
const TEXT_BODY = "#374151";
const TEXT_MUTED = "#6b7280";
const TEXT_FOOTER = "#9ca3af";
const SURFACE = "#ffffff";
const PAGE_BG = "#f4f4f5";
const FOOTER_BG = "#f9fafb";
const DIVIDER = "#e5e7eb";
const BORDER_RADIUS = "12px";
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif';

function emailShell({
  preview,
  bannerUrl,
  body,
}: {
  preview: string;
  bannerUrl?: string | null;
  body: string;
}): string {
  const bannerSection = bannerUrl
    ? `<img src="${bannerUrl}" alt="Organization banner" style="display:block;width:100%;height:160px;object-fit:cover;" />`
    : "";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(preview)}</title>
      </head>
      <body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT_STACK};">
        <span style="display:none;visibility:hidden;mso-hide:all;font-size:1px;color:${PAGE_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preview)}</span>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAGE_BG};">
          <tr>
            <td align="center" style="padding:40px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background-color:${SURFACE};border-radius:${BORDER_RADIUS};overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Tri-color accent bar -->
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="height:4px;width:33.33%;background-color:${ACCENT_TERTIARY};font-size:0;line-height:0;">&nbsp;</td>
                        <td style="height:4px;width:33.33%;background-color:${ACCENT_SECONDARY};font-size:0;line-height:0;">&nbsp;</td>
                        <td style="height:4px;width:33.33%;background-color:${ACCENT_PRIMARY};font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${bannerUrl ? `<tr><td style="padding:0;">${bannerSection}</td></tr>` : ""}

                <!-- Brand header -->
                <tr>
                  <td style="padding:24px 40px 16px;text-align:center;">
                    <p style="margin:0;font-size:24px;font-weight:900;color:${TEXT_PRIMARY};letter-spacing:-0.5px;text-transform:uppercase;">fextiva</p>
                    <p style="margin:4px 0 0;font-size:11px;color:${TEXT_MUTED};letter-spacing:0.04em;">Empowering African Events</p>
                  </td>
                </tr>

                <tr><td style="border-top:1px solid ${DIVIDER};font-size:0;line-height:0;">&nbsp;</td></tr>

                <!-- Body -->
                <tr>
                  <td style="padding:28px 40px;">
                    ${body}
                  </td>
                </tr>

                <tr><td style="border-top:1px solid ${DIVIDER};font-size:0;line-height:0;">&nbsp;</td></tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:16px 40px 24px;background-color:${FOOTER_BG};">
                    <p style="margin:0;font-size:12px;color:${TEXT_FOOTER};text-align:center;">
                      &copy; ${new Date().getFullYear()} fextiva. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function otpBox({
  label,
  code,
  accentBg,
  accentBorder,
  accentText,
  expiry,
}: {
  label: string;
  code: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  expiry?: string;
}): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background-color:${accentBg};border:2px dashed ${accentBorder};border-radius:12px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:${accentText};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(label)}</p>
          <p style="margin:0;font-size:34px;font-weight:800;letter-spacing:10px;color:${accentText};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(code)}</p>
          ${expiry ? `<p style="margin:8px 0 0;font-size:12px;color:${accentText};">${escapeHtml(expiry)}</p>` : ""}
        </td>
      </tr>
    </table>
  `;
}

function primaryButton({ label, href, color }: { label: string; href: string; color: string }): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px auto;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:${color};">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:${color};">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `;
}

function paragraphs(...lines: string[]): string {
  return lines
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:24px;color:${TEXT_BODY};">${line}</p>`,
    )
    .join("");
}

function muted(text: string): string {
  return `<p style="margin:20px 0 0;font-size:13px;color:${TEXT_FOOTER};">${text}</p>`;
}

function greeting(name: string | undefined): string {
  return `<p style="margin:0 0 14px;font-size:17px;font-weight:700;color:${TEXT_PRIMARY};">Hello ${escapeHtml(name || "there")},</p>`;
}

// ─── Public email senders ──────────────────────────────────────────────────

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
    const body = `
      ${greeting(name)}
      ${paragraphs("Use the code below to verify your fextiva account:")}
      ${otp ? otpBox({ label: "Verification Code", code: otp, accentBg: "#f3f7f5", accentBorder: ACCENT_PRIMARY, accentText: "#3e705b" }) : ""}
      ${url ? `${paragraphs("Or click below to verify directly:")}${primaryButton({ label: "Verify Email", href: url, color: ACCENT_PRIMARY })}` : ""}
      ${muted("If you didn't sign up, ignore this email.")}
    `;

    const html = emailShell({ preview: "Verify your fextiva account", body });

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
    const body = `
      ${greeting(name)}
      ${paragraphs("We received a request to reset the password for your fextiva account.")}
      ${otp ? otpBox({ label: "Your Password Reset Code", code: otp, accentBg: "#f9f1f1", accentBorder: ACCENT_TERTIARY, accentText: "#a70707", expiry: "Valid for 15 minutes" }) : ""}
      ${resetUrl ? `${paragraphs("You can also click the button below to reset your password directly:")}${primaryButton({ label: "Reset Password", href: resetUrl, color: ACCENT_TERTIARY })}` : ""}
      ${muted("If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.")}
    `;

    const html = emailShell({ preview: "Reset your fextiva password", body });

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
    const inviter = inviterName
      ? `<strong>${escapeHtml(inviterName)}</strong>`
      : "An administrator";
    const roleBadge = `<span style="background-color:#fef3c7;color:#92400e;border-radius:4px;padding:2px 8px;font-size:13px;font-weight:600;text-transform:capitalize;">${escapeHtml(role || "member")}</span>`;

    const body = `
      ${greeting(undefined)}
      ${paragraphs(`${inviter} has invited you to join <strong>${escapeHtml(organizationName)}</strong> as ${roleBadge} on fextiva.`)}
      ${primaryButton({ label: "Accept Invitation", href: inviteUrl, color: ACCENT_TERTIARY })}
      <p style="margin:16px 0 0;font-size:11px;color:${TEXT_MUTED};">Or copy this URL: <a href="${escapeHtml(inviteUrl)}" style="color:${ACCENT_TERTIARY};word-break:break-all;">${escapeHtml(inviteUrl)}</a></p>
      <p style="margin:16px 0 0;font-size:13px;line-height:20px;color:${TEXT_FOOTER};">This invitation will expire in 7 days. If you weren't expecting this, ignore this email.</p>
    `;

    const html = emailShell({
      preview: `${inviterName ?? "Someone"} invited you to join ${organizationName}`,
      body,
    });

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
    const bannerUrlResolved = organizationBannerUrl
      ? getOrgImageUrl(organizationBannerUrl)
      : null;
    const logoUrlResolved = organizationLogoUrl
      ? getOrgImageUrl(organizationLogoUrl)
      : null;

    const body = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
        <tr>
          ${logoUrlResolved ? `<td style="padding-right:12px;vertical-align:middle;"><img src="${escapeHtml(logoUrlResolved)}" alt="${escapeHtml(organizationName)}" width="44" height="44" style="width:44px;height:44px;border-radius:8px;object-fit:cover;display:block;" /></td>` : ""}
          <td style="vertical-align:middle;">
            <p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;color:${ACCENT_PRIMARY};letter-spacing:0.05em;">${escapeHtml(organizationName)}</p>
            <p style="margin:2px 0 0;font-size:20px;font-weight:700;color:${TEXT_PRIMARY};">Official Voting Key</p>
          </td>
        </tr>
      </table>
      ${paragraphs(`Hello <strong>${escapeHtml(name)}</strong>,`, `You have been registered as a verified voter for <strong>${escapeHtml(eventName)}</strong>. Below is your confidential voting key required to cast your ballot:`)}
      ${otpBox({ label: "Your Private Voting Key", code: votingKey, accentBg: "#f3f4f6", accentBorder: ACCENT_PRIMARY, accentText: "#111827" })}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;background-color:#f8f5f1;border:1px solid #f3c390;border-radius:8px;">
        <tr><td style="padding:12px 16px;font-size:12px;color:#78430c;line-height:1.5;">&#128274; <strong>Ballot Secrecy:</strong> This key is strictly private and belongs to you. Organization administrators and organizers cannot see this key.</td></tr>
      </table>
      ${votingUrl ? primaryButton({ label: "Go to Voting Portal", href: votingUrl, color: ACCENT_PRIMARY }) : ""}
      <p style="margin:24px 0 0;font-size:12px;color:${TEXT_FOOTER};border-top:1px solid ${DIVIDER};padding-top:16px;text-align:center;">&copy; ${new Date().getFullYear()} ${escapeHtml(organizationName)} &middot; Powered by fextiva</p>
    `;

    const html = emailShell({
      preview: `Your voting key for ${eventName}`,
      bannerUrl: bannerUrlResolved,
      body,
    });

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
