import { transporter, mailFromEmail } from "@/lib/mail/transport";

const ACCENT_PRIMARY = "#53967a";
const ACCENT_SECONDARY = "#e88722";
const ACCENT_TERTIARY = "#ca0808";
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
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background-color:${SURFACE};overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
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

export interface SendTicketConfirmationEmailInput {
	/** Recipient email address */
	email: string;
	/** Attendee or Buyer's full name */
	attendeeName: string;
	/** Event name */
	eventName: string;
	/** Organization/promoter name */
	organizationName?: string;
	/** Ticket tier name (e.g. VIP, General Admission) */
	ticketTypeName: string;
	/** The short human-readable ticket code */
	ticketCode: string;
	/** Full URL to the passbook view page (includes token) */
	viewUrl: string;
	/** Optional event banner / flier image */
	bannerUrl?: string | null;
	/** Whether this is a free ticket */
	isFree?: boolean;
	/** Total amount paid (for display on paid tickets) */
	amountPaid?: number;
	/** Currency code e.g. GHS */
	currency?: string;
	/** Whether this email is for the primary buyer / booking owner */
	isPrimaryBuyer?: boolean;
	/** Order number if available */
	orderNumber?: string;
	/** Total passes in booking */
	totalTickets?: number;
	/** All ticket codes in booking */
	allTicketCodes?: string[];
}

export async function sendTicketConfirmationEmail(
	params: SendTicketConfirmationEmailInput,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	try {
		const {
			email,
			attendeeName,
			eventName,
			organizationName = "Fextiva",
			ticketTypeName,
			ticketCode,
			viewUrl,
			bannerUrl,
			isFree = false,
			amountPaid,
			currency = "GHS",
			isPrimaryBuyer = false,
			orderNumber,
			totalTickets = 1,
			allTicketCodes,
		} = params;

		const isMulti = totalTickets > 1;
		const subject = isPrimaryBuyer
			? isMulti
				? `Booking Confirmed: ${eventName} (${totalTickets} Passes) ✓`
				: `Your Ticket Pass — ${eventName} ✓`
			: `Your ${ticketTypeName} Pass — ${eventName} ✓`;

		const previewText = isPrimaryBuyer
			? isMulti
				? `Your booking for ${eventName} (${totalTickets} passes) is confirmed`
				: `Your ticket pass for ${eventName} is confirmed`
			: `Your ${ticketTypeName} pass for ${eventName} is confirmed`;

		const amountDisplay =
			isFree || !amountPaid
				? "Free"
				: new Intl.NumberFormat("en-GH", { style: "currency", currency }).format(amountPaid);

		const headerTitle = isPrimaryBuyer
			? isMulti
				? "Booking Confirmed"
				: "Ticket Confirmed"
			: "Ticket Confirmed";

		const introGreeting = isPrimaryBuyer
			? `Hi <strong>${escapeHtml(attendeeName)}</strong>, your booking for <strong>${escapeHtml(eventName)}</strong> is confirmed and ready below.`
			: `Hi <strong>${escapeHtml(attendeeName)}</strong>, your admission pass has been confirmed and is ready below. Please keep this email safe — your QR code is your key to the gate.`;

		const body = `
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
          ${headerTitle}
        </p>
        <h1 style="margin:0;font-size:26px;font-weight:900;color:#111827;line-height:1.2;">
          You're going to ${escapeHtml(eventName)}!
        </h1>
      </div>

      <p style="margin:0 0 20px;font-size:15px;color:${TEXT_BODY};line-height:1.6;">
        ${introGreeting}
      </p>

      <!-- Ticket Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
        style="border:1.5px solid ${DIVIDER};background-color:#f9fafb;margin-bottom:24px;border-radius:8px;">
        <tr>
          <td style="padding:20px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td>
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${TEXT_MUTED};">
                    ${isMulti ? "Tier &amp; Passes" : "Ticket Tier"}
                  </p>
                  <p style="margin:0;font-size:18px;font-weight:900;color:#111827;">
                    ${isMulti ? `${totalTickets} &times; ${escapeHtml(ticketTypeName)}` : escapeHtml(ticketTypeName)}
                  </p>
                </td>
                <td align="right" valign="top">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${TEXT_MUTED};">
                    ${isPrimaryBuyer ? "Total Paid" : "Amount"}
                  </p>
                  <p style="margin:0;font-size:18px;font-weight:900;color:${ACCENT_PRIMARY};">
                    ${escapeHtml(amountDisplay)}
                  </p>
                </td>
              </tr>
              ${orderNumber ? `
              <tr>
                <td colspan="2" style="padding-top:14px;border-top:1px solid ${DIVIDER};">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${TEXT_MUTED};">
                    Order ID
                  </p>
                  <p style="margin:0;font-size:15px;font-weight:800;letter-spacing:0.04em;font-family:monospace;color:#111827;">
                    #${escapeHtml(orderNumber)}
                  </p>
                </td>
              </tr>
              ` : ""}
              <tr>
                <td colspan="2" style="padding-top:12px;${orderNumber ? "" : `border-top:1px solid ${DIVIDER};`}">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${TEXT_MUTED};">
                    ${isMulti ? "Ticket Codes" : "Ticket Code"}
                  </p>
                  <p style="margin:0;font-size:${isMulti ? "13px" : "18px"};font-weight:800;letter-spacing:0.06em;font-family:monospace;color:#111827;line-height:1.4;">
                    ${allTicketCodes && allTicketCodes.length > 0 ? escapeHtml(allTicketCodes.join(", ")) : escapeHtml(ticketCode)}
                  </p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:12px;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${TEXT_MUTED};">
                    ${isPrimaryBuyer ? "Booking Contact" : "Pass Holder"}
                  </p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">
                    ${escapeHtml(attendeeName)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- View Pass CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${ACCENT_PRIMARY}" style="border-radius:8px;background-color:${ACCENT_PRIMARY};">
                  <a href="${viewUrl}" target="_blank"
                    style="display:inline-block;padding:14px 32px;background-color:${ACCENT_PRIMARY};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;border-radius:8px;">
                    ${isPrimaryBuyer && isMulti ? "View &amp; Manage Your Passes" : "View &amp; Download Your Pass"}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Direct Link Box (Visible in all clients) -->
      <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#166534;">
          ${isPrimaryBuyer && isMulti ? "Direct Booking &amp; Passes Link:" : "Direct Pass Link:"}
        </p>
        <a href="${viewUrl}" target="_blank" style="font-size:13px;color:#15803d;font-weight:600;word-break:break-all;text-decoration:underline;line-height:1.4;">
          ${viewUrl}
        </a>
      </div>

      <!-- Security Notice -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
        style="border:1px solid #fde68a;background-color:#fffbeb;margin-bottom:24px;border-radius:8px;">
        <tr>
          <td style="padding:14px 16px;font-size:13px;color:#92400e;line-height:1.5;">
            <strong>&#9888; ${isPrimaryBuyer && isMulti ? "Booking Passes Access" : "Confidential Pass Link"}</strong><br />
            ${isPrimaryBuyer && isMulti
              ? `This link gives you access to all <strong>${totalTickets} passes</strong> in your booking. You can flip each pass, download gate passes, or share individual links with your attendees.`
              : `This pass link and QR code is unique to <strong>${escapeHtml(attendeeName)}</strong> and admits one person at the gate. Do not share this email or QR code publicly.`
            }
          </td>
        </tr>
      </table>

      <div style="margin-top:32px;padding-top:20px;border-top:1px solid ${DIVIDER};text-align:center;">
        <p style="margin:0;font-size:12px;color:${TEXT_FOOTER};">
          &copy; ${new Date().getFullYear()} ${escapeHtml(organizationName)} &middot; Powered by Fextiva
        </p>
      </div>
    `;

		const html = emailShell({ preview: previewText, bannerUrl, body });

		const info = await transporter.sendMail({
			from: `"${organizationName} via Fextiva" <${mailFromEmail}>`,
			to: email,
			subject,
			html,
		});

		console.log(
			"[EMAIL:TICKET] Confirmation sent to",
			email,
			"messageId:",
			info.messageId,
		);
		return { success: true, messageId: info.messageId };
	} catch (error: any) {
		console.error("[EMAIL:TICKET] Failed to send ticket confirmation email:", error);
		return { success: false, error: error.message };
	}
}


