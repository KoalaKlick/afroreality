import { transporter, mailFromName, mailFromEmail } from "@/lib/mail/transport";
import { getOrgImageUrl } from "@/lib/image-url-utils";

const ACCENT_PRIMARY = "#53967a";
const ACCENT_SECONDARY = "#e88722";
const ACCENT_TERTIARY = "#ca0808";
const TEXT_PRIMARY = "#111827";
const TEXT_BODY = "#374151";
const TEXT_MUTED = "#6b7280";
const TEXT_FOOTER = "#9ca3af";
const SURFACE = "#ffffff";
const PAGE_BG = "#f4f4f5";
const DIVIDER = "#e5e7eb";
const BORDER_RADIUS = "12px";
const FONT_STACK =
	'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif';

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

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
		? `<img src="${bannerUrl}" alt="Event banner" style="display:block;width:100%;height:160px;object-fit:cover;" />`
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
                <!-- Tri-color brand accent bar -->
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
                ${bannerSection ? `<tr><td style="padding:0;">${bannerSection}</td></tr>` : ""}
                <tr>
                  <td style="padding:32px 36px;">
                    ${body}
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

export interface SendNominationConfirmationEmailInput {
	email: string;
	recipientName?: string;
	nomineeName: string;
	categoryName: string;
	eventName: string;
	status?: string | null;
	confirmationCode?: string | null;
	deletionCode?: string | null;
	organizationName?: string;
	bannerUrl?: string | null;
	eventUrl?: string | null;
}

export async function sendNominationConfirmationEmail(
	params: SendNominationConfirmationEmailInput,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	try {
		const {
			email,
			recipientName = "Valued Candidate",
			nomineeName,
			categoryName,
			eventName,
			status,
			confirmationCode,
			deletionCode,
			organizationName = "Fextiva",
			bannerUrl,
			eventUrl,
		} = params;

		const codeToUse = confirmationCode || deletionCode;
		const isLive = status ? status === "approved" : Boolean(codeToUse);
		const previewText = isLive
			? `Nomination confirmed for ${nomineeName} at ${eventName}`
			: `Nomination received for ${nomineeName} at ${eventName}`;

		const body = `
      <div style="margin-bottom:24px;">
        <p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;color:${ACCENT_PRIMARY};letter-spacing:0.05em;">
          ${escapeHtml(organizationName)} &bull; ${escapeHtml(eventName)}
        </p>
        <h2 style="margin:6px 0 0;font-size:22px;font-weight:800;color:${TEXT_PRIMARY};line-height:1.25;">
          ${isLive ? "Nomination Confirmed &amp; Live" : "Nomination Received"}
        </h2>
      </div>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${TEXT_BODY};">
        Hello <strong>${escapeHtml(recipientName)}</strong>,
      </p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${TEXT_BODY};">
        Your nomination of <strong>${escapeHtml(nomineeName)}</strong> for the <strong>${escapeHtml(categoryName)}</strong> category at <strong>${escapeHtml(eventName)}</strong> has been ${
					isLive
						? "<span style='color:#059669;font-weight:700;'>confirmed and is now live</span> on the official voting list."
						: "<span style='color:#d97706;font-weight:700;'>received and is currently pending review</span> by event organizers."
				}
      </p>

      ${
				codeToUse
					? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;">
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${TEXT_MUTED};">
                Nominee Confirmation Code
              </p>
              <p style="margin:0;font-size:32px;font-weight:900;letter-spacing:6px;color:#1e3a8a;font-family:monospace;">
                ${escapeHtml(codeToUse)}
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
          <tr>
            <td style="padding:14px 16px;font-size:13px;color:#1e40af;line-height:1.5;">
              &#128274; <strong>Keep this Confirmation Code private.</strong> Only enter it in-platform to approve a change or request you agree to (similar to a Mobile Money OTP). Organizers will never ask for your code directly.
            </td>
          </tr>
        </table>
      `
					: `
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">
          You will receive an automated confirmation notice once the organizer completes review of the candidate submission.
        </p>
      `
			}

      ${
				eventUrl
					? `
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(eventUrl)}" style="display:inline-block;padding:12px 28px;background-color:${ACCENT_PRIMARY};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
            View Event &amp; Standings
          </a>
        </div>
      `
					: ""
			}

      <div style="margin-top:32px;padding-top:20px;border-top:1px solid ${DIVIDER};text-align:center;">
        <p style="margin:0;font-size:12px;color:${TEXT_FOOTER};">
          &copy; ${new Date().getFullYear()} ${escapeHtml(organizationName)} &middot; Powered by Fextiva
        </p>
      </div>
    `;

		const html = emailShell({
			preview: previewText,
			bannerUrl,
			body,
		});

		const info = await transporter.sendMail({
			from: `"${organizationName} via Fextiva" <${mailFromEmail}>`,
			to: email,
			subject: `${isLive ? "Nomination Confirmed" : "Nomination Received"}: ${nomineeName} (${categoryName})`,
			html,
		});

		console.log(
			"[EMAIL] Nomination confirmation sent to",
			email,
			"messageId:",
			info.messageId,
		);
		return { success: true, messageId: info.messageId };
	} catch (error: any) {
		console.error("[EMAIL] Failed to send nomination email:", error);
		return { success: false, error: error.message };
	}
}

export interface SendNomineeChangeRequestEmailInput {
	email: string;
	recipientName?: string;
	nomineeName: string;
	categoryName: string;
	eventName: string;
	organizationName?: string;
	requestType: "EDIT" | "DELETE";
	changesSummaryHtml: string;
	confirmUrl: string;
	bannerUrl?: string | null;
}

export async function sendNomineeChangeRequestEmail(
	params: SendNomineeChangeRequestEmailInput,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	try {
		const {
			email,
			recipientName = "Valued Nominee",
			nomineeName,
			categoryName,
			eventName,
			organizationName = "Fextiva",
			requestType,
			changesSummaryHtml,
			confirmUrl,
			bannerUrl,
		} = params;

		const isDelete = requestType === "DELETE";
		const previewText = isDelete
			? `Action required: Profile deletion request for ${nomineeName}`
			: `Action required: Profile update request for ${nomineeName}`;

		const body = `
      <div style="margin-bottom:24px;">
        <p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;color:${ACCENT_PRIMARY};letter-spacing:0.05em;">
          ${escapeHtml(organizationName)} &bull; ${escapeHtml(eventName)}
        </p>
        <h2 style="margin:6px 0 0;font-size:22px;font-weight:800;color:${TEXT_PRIMARY};line-height:1.25;">
          ${isDelete ? "Profile Deletion Request" : "Profile Update Request"}
        </h2>
      </div>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${TEXT_BODY};">
        Hello <strong>${escapeHtml(recipientName)}</strong>,
      </p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${TEXT_BODY};">
        The organizer for <strong>${escapeHtml(eventName)}</strong> has requested ${
					isDelete
						? `to <strong>delete</strong> your nominee profile (<em>${escapeHtml(nomineeName)}</em>) from the <strong>${escapeHtml(categoryName)}</strong> category.`
						: `an update to your nominee profile (<em>${escapeHtml(nomineeName)}</em>) in the <strong>${escapeHtml(categoryName)}</strong> category.`
				}
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;background-color:#f8fafc;border:1px solid ${DIVIDER};border-radius:10px;">
        <tr>
          <td style="padding:18px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;color:${TEXT_MUTED};letter-spacing:0.05em;">
              ${isDelete ? "Proposed Action:" : "Proposed Changes:"}
            </p>
            ${changesSummaryHtml}
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
        <tr>
          <td style="padding:14px 16px;font-size:13px;color:#1e40af;line-height:1.5;">
            &#128274; <strong>How to approve:</strong> Click the button below to review this request in-platform. You will be asked to enter your 6-digit Confirmation Code to approve or decline this change. Do not share your code with anyone.
          </td>
        </tr>
      </table>

      <div style="margin:28px 0;text-align:center;">
        <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;padding:14px 32px;background-color:${isDelete ? "#dc2626" : ACCENT_PRIMARY};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
          ${isDelete ? "Review &amp; Approve Deletion" : "Review &amp; Approve Changes"}
        </a>
      </div>

      <div style="margin-top:32px;padding-top:20px;border-top:1px solid ${DIVIDER};text-align:center;">
        <p style="margin:0;font-size:12px;color:${TEXT_FOOTER};">
          &copy; ${new Date().getFullYear()} ${escapeHtml(organizationName)} &middot; Powered by Fextiva
        </p>
      </div>
    `;

		const html = emailShell({
			preview: previewText,
			bannerUrl,
			body,
		});

		const info = await transporter.sendMail({
			from: `"${organizationName} via Fextiva" <${mailFromEmail}>`,
			to: email,
			subject: `Action Required: ${isDelete ? "Nominee Deletion Request" : "Nominee Update Request"} - ${nomineeName}`,
			html,
		});

		console.log(
			"[EMAIL] Nominee change request sent to",
			email,
			"messageId:",
			info.messageId,
		);
		return { success: true, messageId: info.messageId };
	} catch (error: any) {
		console.error("[EMAIL] Failed to send nominee change request email:", error);
		return { success: false, error: error.message };
	}
}
