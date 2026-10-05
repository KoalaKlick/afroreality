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
	/** All attendee names in booking (for multi-ticket orders) */
	attendeeNames?: string[];
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
			attendeeNames,
		} = params;

		const isMulti = totalTickets > 1;
		const subject = isPrimaryBuyer
			? isMulti
				? `Booking Confirmed: ${eventName} (${totalTickets} Tickets) ✓`
				: `Your Ticket — ${eventName} ✓`
			: `Your Ticket — ${eventName} ✓`;

		const previewText = isPrimaryBuyer
			? isMulti
				? `Your booking for ${eventName} (${totalTickets} tickets) is confirmed`
				: `Your ticket for ${eventName} is confirmed`
			: `Your ticket for ${eventName} is confirmed`;

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
			? isMulti
				? `Hi <strong>${escapeHtml(attendeeName)}</strong>, your booking for <strong>${escapeHtml(eventName)}</strong> is confirmed. You can view, download, or share your tickets below.`
				: `Hi <strong>${escapeHtml(attendeeName)}</strong>, your ticket for <strong>${escapeHtml(eventName)}</strong> is confirmed. You can view or download your ticket below.`
			: `Hi <strong>${escapeHtml(attendeeName)}</strong>, your ticket for <strong>${escapeHtml(eventName)}</strong> is confirmed. You can view or download your ticket below.`;

		const body = `
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
          ${headerTitle}
        </p>
        <h1 style="margin:0;font-size:24px;font-weight:900;color:#111827;line-height:1.25;">
          You're going to ${escapeHtml(eventName)}!
        </h1>
      </div>

      <p style="margin:0 0 24px;font-size:15px;color:${TEXT_BODY};line-height:1.6;">
        ${introGreeting}
      </p>

      <!-- Ticket Details (Flush left with text above, no card border/background) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td style="padding-bottom:12px;">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
              Ticket Tier
            </p>
            <p style="margin:0;font-size:16px;font-weight:800;color:#111827;">
              ${isMulti ? `${totalTickets} &times; ${escapeHtml(ticketTypeName)}` : escapeHtml(ticketTypeName)}
            </p>
          </td>
          <td align="right" valign="top" style="padding-bottom:12px;">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
              ${isPrimaryBuyer ? "Total Paid" : "Amount"}
            </p>
            <p style="margin:0;font-size:16px;font-weight:800;color:${ACCENT_PRIMARY};">
              ${escapeHtml(amountDisplay)}
            </p>
          </td>
        </tr>
        ${orderNumber ? `
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
              Order ID
            </p>
            <p style="margin:0;font-size:14px;font-weight:700;font-family:monospace;color:#111827;">
              #${escapeHtml(orderNumber)}
            </p>
          </td>
        </tr>
        ` : ""}
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
              ${isMulti ? "Ticket Codes" : "Ticket Code"}
            </p>
            <p style="margin:0;font-size:14px;font-weight:800;font-family:monospace;color:#111827;line-height:1.4;">
              ${allTicketCodes && allTicketCodes.length > 0 ? escapeHtml(allTicketCodes.join(", ")) : escapeHtml(ticketCode)}
            </p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
              ${isPrimaryBuyer ? "Buyer Name" : "Attendee"}
            </p>
            <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">
              ${escapeHtml(attendeeName)}
            </p>
          </td>
        </tr>
        ${attendeeNames && attendeeNames.length > 1 ? `
        <tr>
          <td colspan="2" style="padding:10px 0;border-top:1px solid ${DIVIDER};">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${TEXT_MUTED};">
              Attendees
            </p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;line-height:1.5;">
              ${attendeeNames.map(n => escapeHtml(n)).join('<br />')}
            </p>
          </td>
        </tr>
        ` : ""}
      </table>

      <!-- View Ticket CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${ACCENT_PRIMARY}" style="border-radius:8px;background-color:${ACCENT_PRIMARY};">
                  <a href="${viewUrl}" target="_blank"
                    style="display:inline-block;padding:14px 36px;background-color:${ACCENT_PRIMARY};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;border-radius:8px;">
                    ${isMulti ? "View Your Tickets" : "View Your Ticket"}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Simple Entry Note -->
      <p style="margin:16px 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.5;text-align:center;">
        ${isMulti
          ? `Each ticket has a unique QR code for entry. Click the button above to view and download your tickets.`
          : `Your ticket has a unique QR code for gate admission. Present it on your phone or print it for entry.`}
      </p>

      <p style="margin:12px 0 0;font-size:12px;color:${TEXT_MUTED};line-height:1.5;text-align:center;">
        Trouble clicking? Copy and open: <a href="${viewUrl}" target="_blank" style="color:${ACCENT_PRIMARY};text-decoration:underline;word-break:break-all;">${viewUrl}</a>
      </p>

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


