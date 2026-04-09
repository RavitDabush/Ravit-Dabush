import 'server-only';

import { FlattenedSeat, LessinSeatStatusResponse, LessinSeatplanResponse, ParsedSeatAvailability } from './types';

const PREFERRED_ROWS = new Set(['1', '2', '3', '4', '5', '6', '7']);
const MAIN_HALL_SECTION_TOKENS = ['אולם', 'hall', 'orchestra'];
const NON_HALL_SECTION_TOKENS = ['גלריה', 'gallery', 'balcony', 'upper', 'mezzanine'];

function normalizeSectionLabel(sectionLabel: string | undefined, sectionId: string): string {
	const normalizedLabel = (sectionLabel ?? '')
		.replace(/[\u200e\u200f\u202a-\u202e]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	return normalizedLabel || `section-${sectionId}`;
}

function isMainHallSection(sectionLabel: string): boolean {
	const normalizedLabel = sectionLabel.toLocaleLowerCase();
	const isHall = MAIN_HALL_SECTION_TOKENS.some(token => normalizedLabel.includes(token.toLocaleLowerCase()));
	const isNonHall = NON_HALL_SECTION_TOKENS.some(token => normalizedLabel.includes(token.toLocaleLowerCase()));

	return isHall && !isNonHall;
}

function flattenSeatplan(seatplan: LessinSeatplanResponse): FlattenedSeat[] {
	const flattenedSeats: FlattenedSeat[] = [];

	for (const [sectionId, section] of Object.entries(seatplan.S ?? {})) {
		const sectionLabel = normalizeSectionLabel(section.n, sectionId);

		for (const [groupId, group] of Object.entries(section.G ?? {})) {
			for (const [rowId, row] of Object.entries(group.R ?? {})) {
				const rowLabel = `${row.n ?? rowId}`.trim();

				for (const [seatId, seat] of Object.entries(row.S ?? {})) {
					flattenedSeats.push({
						key: `${sectionId}_${seatId}_${rowId}`,
						sectionId,
						sectionLabel,
						groupId,
						rowId,
						rowLabel,
						seatId,
						seatLabel: `${seat.n ?? seatId}`.trim()
					});
				}
			}
		}
	}

	return flattenedSeats;
}

export function parseSeatAvailability(
	seatplan: LessinSeatplanResponse,
	seatStatus: LessinSeatStatusResponse
): ParsedSeatAvailability {
	const flattenedSeats = flattenSeatplan(seatplan);
	const availableSeats = flattenedSeats.filter(seat => seat.key in (seatStatus.seats ?? {}));
	const availablePreferredRowSeats = availableSeats.filter(seat => PREFERRED_ROWS.has(seat.rowLabel));
	const hasStructuredSectionLabels = Object.values(seatplan.S ?? {}).some(section => Boolean(section.n?.trim()));
	const preferredHallSeats = availablePreferredRowSeats.filter(seat => isMainHallSection(seat.sectionLabel));
	const matchedRows = Array.from(new Set(preferredHallSeats.map(seat => seat.rowLabel))).sort(
		(left, right) => Number(left) - Number(right)
	);
	const matchedSections = Array.from(new Set(preferredHallSeats.map(seat => seat.sectionLabel))).sort();
	const nonHallSectionsWithPreferredRows = Array.from(
		new Set(
			availablePreferredRowSeats.filter(seat => !isMainHallSection(seat.sectionLabel)).map(seat => seat.sectionLabel)
		)
	);

	let sectionDebugStatus: ParsedSeatAvailability['sectionDebugStatus'] = 'unknown';

	if (preferredHallSeats.length > 0) {
		sectionDebugStatus = 'main-hall';
	} else if (nonHallSectionsWithPreferredRows.length > 0 && hasStructuredSectionLabels) {
		sectionDebugStatus = 'non-hall-only';
	} else if (!hasStructuredSectionLabels && availablePreferredRowSeats.length > 0) {
		sectionDebugStatus = 'ambiguous';
	}

	return {
		availableInPreferredRows: preferredHallSeats.length > 0,
		matchedRows,
		matchedSections,
		availableSeatCount: preferredHallSeats.length,
		sectionDebugStatus,
		hasStructuredSectionLabels
	};
}
