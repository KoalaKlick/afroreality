/**
 * Settlement and Business Day Calculator (T+1)
 *
 * Implements Paystack's T+1 settlement cycle for Ghana banking:
 * - Excludes weekends (Saturday & Sunday)
 * - Excludes official Ghana statutory public holidays
 * - Calculates cleared funds eligible for withdrawal vs funds in clearance
 */

/**
 * Check if a date falls on a weekend
 */
export function isWeekend(date: Date): boolean {
	const day = date.getDay();
	return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Standard fixed Ghana Public Holidays (month is 1-indexed, day)
 */
const GHANA_PUBLIC_HOLIDAYS = [
	{ month: 1, day: 1, name: "New Year's Day" },
	{ month: 1, day: 7, name: "Constitution Day" },
	{ month: 3, day: 6, name: "Independence Day" },
	{ month: 5, day: 1, name: "Worker's Day" },
	{ month: 5, day: 25, name: "Africa Day" },
	{ month: 8, day: 4, name: "Founders' Day" },
	{ month: 9, day: 21, name: "Kwame Nkrumah Memorial Day" },
	{ month: 12, day: 25, name: "Christmas Day" },
	{ month: 12, day: 26, name: "Boxing Day" },
];

/**
 * Check if a date is an official statutory public holiday
 */
export function isPublicHoliday(date: Date): boolean {
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return GHANA_PUBLIC_HOLIDAYS.some((h) => h.month === month && h.day === day);
}

/**
 * Check if a date is a standard banking business day
 */
export function isBusinessDay(date: Date): boolean {
	return !isWeekend(date) && !isPublicHoliday(date);
}

/**
 * Calculates the exact settlement date for a transaction under T+1
 * A transaction on Friday settles on Monday (next working business day).
 * A transaction on a holiday settles on the day following the next business day.
 */
export function getSettlementDate(transactionDate: Date | string): Date {
	const date = new Date(transactionDate);
	const settlement = new Date(date.getTime());

	let businessDaysAdded = 0;
	while (businessDaysAdded < 1) {
		settlement.setDate(settlement.getDate() + 1);
		if (isBusinessDay(settlement)) {
			businessDaysAdded++;
		}
	}

	// Paystack settlements disburse during banking hours (~08:00 AM)
	settlement.setHours(8, 0, 0, 0);
	return settlement;
}

/**
 * Determines whether a transaction has completed its T+1 clearance window
 */
export function isTPlusOneSettled(
	transactionDate: Date | string,
	asOfDate: Date = new Date(),
): boolean {
	const settlementDate = getSettlementDate(transactionDate);
	return asOfDate.getTime() >= settlementDate.getTime();
}

/**
 * Finds the earliest upcoming settlement date for a collection of transactions
 */
export function getNextUpcomingSettlementDate(
	transactionDates: Array<Date | string>,
	asOfDate: Date = new Date(),
): Date | null {
	let earliest: Date | null = null;

	for (const d of transactionDates) {
		const st = getSettlementDate(d);
		if (st.getTime() > asOfDate.getTime()) {
			if (!earliest || st.getTime() < earliest.getTime()) {
				earliest = st;
			}
		}
	}

	return earliest;
}
