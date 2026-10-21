// src/lib/email/organizer-notification.ts
// Branded email renderer for administrative broadcasts & custom notifications to organizers

const ACCENT_PRIMARY = "#53967a"; // green
const ACCENT_SECONDARY = "#e88722"; // amber/orange
const ACCENT_TERTIARY = "#ca0808"; // red
const TEXT_PRIMARY = "#111827";
const TEXT_BODY = "#374151";
const TEXT_MUTED = "#6b7280";
const TEXT_FOOTER = "#9ca3af";
const SURFACE = "#ffffff";
const PAGE_BG = "#f4f4f5";
const DIVIDER = "#e5e7eb";
const FONT_STACK =
	'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif';

function escapeHtml(input: string): string {
	return String(input)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export interface RenderOrganizerNotificationEmailParams {
	subject: string;
	contentHtml: string;
	organizerName: string;
	recipientName?: string;
	previewText?: string;
	actionButton?: {
		label: string;
		url: string;
	};
	adminName?: string;
	adminEmail?: string;
	platformName?: string;
}

/**
 * Normalizes user-supplied rich text HTML to ensure clean styling across email clients.
 */
function sanitizeAndStyleHtml(html: string): string {
	let styled = html || "";

	// Ensure headings have proper inline styles for email clients
	styled = styled.replace(
		/<h2([^>]*)>/gi,
		`<h2 style="margin:24px 0 12px;font-size:20px;font-weight:700;color:${TEXT_PRIMARY};line-height:1.3;"$1>`
	);
	styled = styled.replace(
		/<h3([^>]*)>/gi,
		`<h3 style="margin:20px 0 8px;font-size:16px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.4;"$1>`
	);
	// Style paragraphs
	styled = styled.replace(
		/<p([^>]*)>/gi,
		`<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${TEXT_BODY};"$1>`
	);
	// Style lists
	styled = styled.replace(
		/<ul([^>]*)>/gi,
		`<ul style="margin:0 0 16px;padding-left:24px;color:${TEXT_BODY};font-size:15px;line-height:1.6;"$1>`
	);
	styled = styled.replace(
		/<ol([^>]*)>/gi,
		`<ol style="margin:0 0 16px;padding-left:24px;color:${TEXT_BODY};font-size:15px;line-height:1.6;"$1>`
	);
	styled = styled.replace(
		/<li([^>]*)>/gi,
		`<li style="margin-bottom:6px;color:${TEXT_BODY};"$1>`
	);
	// Style blockquotes
	styled = styled.replace(
		/<blockquote([^>]*)>/gi,
		`<blockquote style="margin:16px 0;padding:12px 18px;border-left:4px solid ${ACCENT_PRIMARY};background-color:#f0fdf4;border-radius:0 6px 6px 0;color:${TEXT_BODY};font-style:italic;"$1>`
	);
	// Style links
	styled = styled.replace(
		/<a([^>]*)>/gi,
		`<a style="color:${ACCENT_PRIMARY};text-decoration:underline;font-weight:500;" target="_blank" rel="noopener noreferrer"$1>`
	);
	// Style hr
	styled = styled.replace(
		/<hr([^>]*)>/gi,
		`<hr style="border:none;border-top:1px solid ${DIVIDER};margin:24px 0;"$1>`
	);

	return styled;
}

/**
 * Builds the complete responsive HTML email for an organizer notification.
 */
export function renderOrganizerNotificationEmailHtml({
	subject,
	contentHtml,
	organizerName,
	recipientName,
	previewText,
	actionButton,
	adminName = "Fextiva Administration",
	adminEmail,
	platformName = "Fextiva",
}: RenderOrganizerNotificationEmailParams): string {
	const preheader = previewText || subject;
	const styledBody = sanitizeAndStyleHtml(contentHtml);

	const greeting = recipientName
		? `Hello ${escapeHtml(recipientName)},`
		: `Hello ${escapeHtml(organizerName)},`;

	const buttonHtml =
		actionButton && actionButton.url && actionButton.label
			? `
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 12px;">
				<tr>
					<td align="center" style="border-radius:6px;background-color:${ACCENT_PRIMARY};">
						<a href="${escapeHtml(actionButton.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;background-color:${ACCENT_PRIMARY};letter-spacing:0.02em;">
							${escapeHtml(actionButton.label)}
						</a>
					</td>
				</tr>
			</table>`
			: "";

	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;">
    <span style="display:none;visibility:hidden;mso-hide:all;font-size:1px;color:${PAGE_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtml(preheader)}
    </span>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAGE_BG};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:${SURFACE};border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid ${DIVIDER};">
            
            <!-- Tri-color Brand Bar -->
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

            <!-- Header with Platform badge & Organization badge -->
            <tr>
              <td style="padding:24px 32px 18px;border-bottom:1px solid ${DIVIDER};background-color:#ffffff;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td>
                      <span style="display:inline-block;padding:3px 8px;font-size:11px;font-weight:700;color:${ACCENT_PRIMARY};background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;text-transform:uppercase;letter-spacing:0.05em;">
                        Official Notification
                      </span>
                    </td>
                    <td align="right">
                      <span style="font-size:12px;color:${TEXT_MUTED};font-weight:500;">
                        ${escapeHtml(organizerName)}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding:28px 32px 32px;">
                <div style="font-size:15px;line-height:1.65;color:${TEXT_BODY};">
                  ${styledBody}
                </div>

                ${buttonHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px;background-color:#fafafa;border-top:1px solid ${DIVIDER};">
                <p style="margin:0 0 6px;font-size:12px;color:${TEXT_FOOTER};line-height:1.5;text-align:center;">
                  You received this email because you are a registered event organizer on ${escapeHtml(platformName)}.
                </p>
                <p style="margin:0;font-size:11px;color:${TEXT_FOOTER};text-align:center;">
                  &copy; ${new Date().getFullYear()} ${escapeHtml(platformName)}. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Strips HTML tags and formats a plain text fallback for email clients.
 */
export function renderOrganizerNotificationEmailText({
	subject,
	contentHtml,
	organizerName,
	recipientName,
	actionButton,
	adminName = "Fextiva Administration",
	platformName = "Fextiva",
}: RenderOrganizerNotificationEmailParams): string {
	// Convert breaks, paragraphs, list items to newlines
	let plain = contentHtml
		.replace(/<br\s*[\/]?>/gi, "\n")
		.replace(/<\/p>/gi, "\n\n")
		.replace(/<\/h[1-6]>/gi, "\n\n")
		.replace(/<li[^>]*>/gi, "• ")
		.replace(/<\/li>/gi, "\n")
		.replace(/<hr[^>]*>/gi, "\n---\n")
		.replace(/<[^>]+>/g, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	let text = `${plain}\n\n`;

	if (actionButton && actionButton.url) {
		text += `${actionButton.label}: ${actionButton.url}\n\n`;
	}

	return text;
}
