import 'server-only';

import { FlattenedSeat, HabimaSeatStatusResponse, HabimaSeatplanResponse, ParsedSeatAvailability } from './types';

const PREFERRED_ROWS = new Set(['1', '2', '3', '4', '5', '6', '7']);
const PREFERRED_SECTION_KEYWORDS = ['אולם', 'orchestra', 'stalls', 'main hall', 'hall'];
const PREFERRED_TABLE_SECTION_KEYWORDS = ['שולחן', 'table'];
const EXCLUDED_SECTION_KEYWORDS = ['עליה', 'גלר', 'balcony', 'gallery', 'mezz', 'upper', 'box', 'תא'];

function normalizeText(value: string | undefined): string {
	return (value ?? '').trim().toLowerCase();
}

function getSectionMatchKind(sectionLabel: string): FlattenedSeat['sectionMatchKind'] {
	const normalizedLabel = normalizeText(sectionLabel);

	if (!normalizedLabel) {
		return 'unknown';
	}

	if (PREFERRED_TABLE_SECTION_KEYWORDS.some(keyword => normalizedLabel.includes(keyword))) {
		return 'preferred_table';
	}

	if (EXCLUDED_SECTION_KEYWORDS.some(keyword => normalizedLabel.includes(keyword))) {
		return 'excluded';
	}

	if (PREFERRED_SECTION_KEYWORDS.some(keyword => normalizedLabel.includes(keyword))) {
		return 'preferred';
	}

	return 'unknown';
}

function flattenSeatplan(seatplan: HabimaSeatplanResponse): FlattenedSeat[] {
	const flattenedSeats: FlattenedSeat[] = [];

	for (const [sectionId, section] of Object.entries(seatplan.S ?? {})) {
		const sectionLabel = `${section.n ?? sectionId}`.trim();
		const sectionMatchKind = getSectionMatchKind(sectionLabel);

		for (const [groupId, group] of Object.entries(section.G ?? {})) {
			for (const [rowId, row] of Object.entries(group.R ?? {})) {
				const rowLabel = `${row.n ?? rowId}`.trim();

				for (const [seatId, seat] of Object.entries(row.S ?? {})) {
					flattenedSeats.push({
						key: `${sectionId}_${seatId}_${rowId}`,
						sectionId,
						sectionLabel,
						sectionMatchKind,
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
	seatplan: HabimaSeatplanResponse,
	seatStatus: HabimaSeatStatusResponse
): ParsedSeatAvailability {
	const flattenedSeats = flattenSeatplan(seatplan);
	const availableSeats = flattenedSeats.filter(seat => seat.key in (seatStatus.seats ?? {}));
	const seatsInPreferredRows = availableSeats.filter(seat => PREFERRED_ROWS.has(seat.rowLabel));
	const preferredHallSeats = seatsInPreferredRows.filter(seat => seat.sectionMatchKind === 'preferred');
	const preferredTableSeats = availableSeats.filter(seat => seat.sectionMatchKind === 'preferred_table');
	const preferredSectionSeats = [...preferredHallSeats, ...preferredTableSeats];
	const excludedSectionSeats = seatsInPreferredRows.filter(seat => seat.sectionMatchKind === 'excluded');
	const unknownSectionSeats = seatsInPreferredRows.filter(seat => seat.sectionMatchKind === 'unknown');
	const matchedRows = Array.from(new Set(preferredHallSeats.map(seat => seat.rowLabel))).sort(
		(left, right) => Number(left) - Number(right)
	);
	const matchedSections = Array.from(new Set(preferredSectionSeats.map(seat => seat.sectionLabel))).sort((left, right) =>
		left.localeCompare(right)
	);

	const hasPreferredSection = flattenedSeats.some(
		seat => seat.sectionMatchKind === 'preferred' || seat.sectionMatchKind === 'preferred_table'
	);
	const sourceConfidence = hasPreferredSection ? 'high' : 'medium';

	let sourceStatus = 'main_hall_preferred_rows_unavailable';

	if (!hasPreferredSection) {
		sourceStatus = unknownSectionSeats.length > 0 ? 'preferred_rows_in_unknown_section' : 'preferred_section_missing';
	} else if (preferredHallSeats.length > 0 && preferredTableSeats.length > 0) {
		sourceStatus = 'confirmed_main_hall_and_table_preferred_seats';
	} else if (preferredHallSeats.length > 0) {
		sourceStatus = 'confirmed_main_hall_preferred_rows';
	} else if (preferredTableSeats.length > 0) {
		sourceStatus = 'confirmed_table_preferred_seats';
	} else if (excludedSectionSeats.length > 0) {
		sourceStatus = 'preferred_rows_only_in_non_hall_sections';
	}

	return {
		availableInPreferredRows: preferredSectionSeats.length > 0,
		matchedRows,
		matchedSections,
		availableSeatCount: preferredSectionSeats.length,
		sourceStatus,
		sourceConfidence
	};
}
