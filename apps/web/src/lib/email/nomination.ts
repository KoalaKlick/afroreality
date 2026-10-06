import { transporter, mailFromEmail } from "@/lib/mail/transport";
import { getFrontendBaseUrl } from "@/lib/utils";

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
	orgColors,
}: {
	preview: string;
	bannerUrl?: string | null;
	body: string;
	orgColors?: { primary?: string; secondary?: string; tertiary?: string };
}): string {
	const bar1 = orgColors?.tertiary || ACCENT_TERTIARY;
	const bar2 = orgColors?.secondary || ACCENT_SECONDARY;
	const bar3 = orgColors?.primary || ACCENT_PRIMARY;
	const fextivaLogoUrl = `${getFrontendBaseUrl()}/android-chrome-192x192.png`;

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
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background-color:${SURFACE};overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="height:4px;width:33.33%;background-color:${bar1};font-size:0;line-height:0;">&nbsp;</td>
                        <td style="height:4px;width:33.33%;background-color:${bar2};font-size:0;line-height:0;">&nbsp;</td>
                        <td style="height:4px;width:33.33%;background-color:${bar3};font-size:0;line-height:0;">&nbsp;</td>
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
                <!-- Footer -->
                <tr>
                  <td style="padding:14px 36px 20px;border-top:1px solid ${DIVIDER};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-size:11px;color:${TEXT_FOOTER};">
                          &copy; ${new Date().getFullYear()} Powered by Fextiva
                        </td>
                        <td align="right">
                          <img src="${fextivaLogoUrl}" alt="Fextiva" width="20" height="20" style="width:20px;height:20px;border-radius:4px;display:block;" />
                        </td>
                      </tr>
                    </table>
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
	/** Optional organization theme colors */
	orgColors?: { primary?: string; secondary?: string; tertiary?: string };
}

export async function sendNominationConfirmationEmail(
	params: SendNominationConfirmationEmailInput,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	try {
		const {
			email,
			recipientName,
			nomineeName,
			categoryName,
			eventName,
			status,
			confirmationCode,
			deletionCode,
			organizationName = "Fextiva",
			bannerUrl,
			eventUrl,
			orgColors,
		} = params;

		const btnColor = orgColors?.primary || ACCENT_PRIMARY;

		const codeToUse = confirmationCode || deletionCode;
		const isLive = status ? status === "approved" : Boolean(codeToUse);
		const previewText = isLive
			? `Nomination confirmed — ${nomineeName}, ${eventName}`
			: `Nomination received — ${nomineeName}, ${eventName}`;

		const greeting = recipientName ? `Hi ${escapeHtml(recipientName)},` : "Hi,";
		const statusLine = isLive
			? `The nomination of <strong>${escapeHtml(nomineeName)}</strong> for <strong>${escapeHtml(categoryName)}</strong> at <strong>${escapeHtml(eventName)}</strong> is confirmed and now live on the voting list.`
			: `The nomination of <strong>${escapeHtml(nomineeName)}</strong> for <strong>${escapeHtml(categoryName)}</strong> at <strong>${escapeHtml(eventName)}</strong> has been received and is pending organizer review.`;

		const body = `
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
          ${isLive ? "Nomination Confirmed" : "Nomination Received"}
        </p>
        <h1 style="margin:0;font-size:24px;font-weight:900;color:${TEXT_PRIMARY};line-height:1.25;">
          ${escapeHtml(nomineeName)}
        </h1>
      </div>

      <p style="margin:0 0 24px;font-size:15px;color:${TEXT_BODY};line-height:1.6;">
        ${greeting}<br />${statusLine}
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">Category</p>
            <p style="margin:0;font-size:15px;font-weight:700;color:${TEXT_PRIMARY};">${escapeHtml(categoryName)}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">Event</p>
            <p style="margin:0;font-size:15px;font-weight:700;color:${TEXT_PRIMARY};">${escapeHtml(eventName)}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">Status</p>
            <p style="margin:0;font-size:15px;font-weight:700;color:${isLive ? "#059669" : "#d97706"};">${isLive ? "Live" : "Pending Review"}</p>
          </td>
        </tr>
        ${codeToUse ? `
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">Withdrawal Code</p>
            <p style="margin:0;font-size:18px;font-weight:800;font-family:monospace;color:${TEXT_PRIMARY};letter-spacing:3px;">${escapeHtml(codeToUse)}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${TEXT_MUTED};">Keep this private. Required to withdraw or make changes to this nomination.</p>
          </td>
        </tr>
        ` : ""}
      </table>

      ${eventUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${btnColor}" style="border-radius:8px;background-color:${btnColor};">
                  <a href="${escapeHtml(eventUrl)}" target="_blank"
                    style="display:inline-block;padding:14px 36px;background-color:${btnColor};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;border-radius:8px;">
                    View Event &amp; Standings
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ` : ""}
    `;

		const html = emailShell({ preview: previewText, bannerUrl, body, orgColors });

		const info = await transporter.sendMail({
			from: `"${organizationName} via Fextiva" <${mailFromEmail}>`,
			to: email,
			subject: `${isLive ? "Nomination Confirmed" : "Nomination Received"}: ${nomineeName} (${categoryName})`,
			html,
		});

		console.log("[EMAIL] Nomination confirmation sent to", email, "messageId:", info.messageId);
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
	/** Optional organization theme colors */
	orgColors?: { primary?: string; secondary?: string; tertiary?: string };
}

export async function sendNomineeChangeRequestEmail(
	params: SendNomineeChangeRequestEmailInput,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	try {
		const {
			email,
			recipientName,
			nomineeName,
			categoryName,
			eventName,
			organizationName = "Fextiva",
			requestType,
			changesSummaryHtml,
			confirmUrl,
			bannerUrl,
			orgColors,
		} = params;

		const btnColor = orgColors?.primary || ACCENT_PRIMARY;

		const isDelete = requestType === "DELETE";
		const previewText = isDelete
			? `Action required: Deletion request for ${nomineeName}`
			: `Action required: Profile update for ${nomineeName}`;

		const greeting = recipientName ? `Hi ${escapeHtml(recipientName)},` : "Hi,";
		const actionLine = isDelete
			? `The organizer for <strong>${escapeHtml(eventName)}</strong> has requested the removal of the nominee profile <strong>${escapeHtml(nomineeName)}</strong> from the <strong>${escapeHtml(categoryName)}</strong> category.`
			: `The organizer for <strong>${escapeHtml(eventName)}</strong> has submitted an update request for <strong>${escapeHtml(nomineeName)}</strong> in the <strong>${escapeHtml(categoryName)}</strong> category.`;

		const body = `
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
          Action Required
        </p>
        <h1 style="margin:0;font-size:24px;font-weight:900;color:${TEXT_PRIMARY};line-height:1.25;">
          ${isDelete ? "Nominee Deletion Request" : "Nominee Update Request"}
        </h1>
      </div>

      <p style="margin:0 0 24px;font-size:15px;color:${TEXT_BODY};line-height:1.6;">
        ${greeting}<br />${actionLine}
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">${isDelete ? "Proposed Action" : "Proposed Changes"}</p>
            ${changesSummaryHtml}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.5;">
              Click the button below to review this request in-platform. You will be prompted for your 6-digit code to approve or decline.
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${isDelete ? "#dc2626" : btnColor}" style="border-radius:8px;">
                  <a href="${escapeHtml(confirmUrl)}" target="_blank"
                    style="display:inline-block;padding:14px 36px;background-color:${isDelete ? "#dc2626" : btnColor};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;border-radius:8px;">
                    ${isDelete ? "Review &amp; Confirm Deletion" : "Review &amp; Confirm Changes"}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

		const html = emailShell({ preview: previewText, bannerUrl, body, orgColors });

		const info = await transporter.sendMail({
			from: `"${organizationName} via Fextiva" <${mailFromEmail}>`,
			to: email,
			subject: `Action Required: ${isDelete ? "Nominee Deletion" : "Nominee Update"} — ${nomineeName}`,
			html,
		});

		console.log("[EMAIL] Nominee change request sent to", email, "messageId:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error: any) {
		console.error("[EMAIL] Failed to send nominee change request email:", error);
		return { success: false, error: error.message };
	}
}

export interface SendNomineeUpdateNotificationEmailInput {
	email: string;
	recipientName?: string;
	nomineeName: string;
	categoryName: string;
	eventName: string;
	organizationName?: string;
	changesSummaryHtml: string;
	bannerUrl?: string | null;
	/** Optional organization theme colors */
	orgColors?: { primary?: string; secondary?: string; tertiary?: string };
}

export async function sendNomineeUpdateNotificationEmail(
	params: SendNomineeUpdateNotificationEmailInput,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	try {
		const {
			email,
			recipientName,
			nomineeName,
			categoryName,
			eventName,
			organizationName = "Fextiva",
			changesSummaryHtml,
			bannerUrl,
			orgColors,
		} = params;

		const previewText = `Nominee profile updated — ${nomineeName}, ${eventName}`;
		const greeting = recipientName ? `Hi ${escapeHtml(recipientName)},` : "Hi,";

		const body = `
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
          Profile Update Notice
        </p>
        <h1 style="margin:0;font-size:24px;font-weight:900;color:${TEXT_PRIMARY};line-height:1.25;">
          ${escapeHtml(nomineeName)}
        </h1>
      </div>

      <p style="margin:0 0 24px;font-size:15px;color:${TEXT_BODY};line-height:1.6;">
        ${greeting}<br />
        The organizer for <strong>${escapeHtml(eventName)}</strong> has updated the nominee profile for <strong>${escapeHtml(nomineeName)}</strong> in the <strong>${escapeHtml(categoryName)}</strong> category.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">Updated Details</p>
            ${changesSummaryHtml}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.5;">
              No action is required. This notice has been recorded for your reference.
            </p>
          </td>
        </tr>
      </table>
    `;

		const html = emailShell({ preview: previewText, bannerUrl, body, orgColors });


		const info = await transporter.sendMail({
			from: `"${organizationName} via Fextiva" <${mailFromEmail}>`,
			to: email,
			subject: `Notice: Nominee Profile Updated — ${nomineeName} (${eventName})`,
			html,
		});

		console.log("[EMAIL] Nominee update notification sent to", email, "messageId:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error: any) {
		console.error("[EMAIL] Failed to send nominee update notification email:", error);
		return { success: false, error: error.message };
	}
}
