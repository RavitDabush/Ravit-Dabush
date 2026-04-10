import 'server-only';

import { CameriSeatStatusResponse, CameriSeatplanResponse, FlattenedSeat, ParsedSeatAvailability } from './types';

const PREFERRED_ROWS = new Set(['1', '2', '3', '4', '5', '6', '7']);
const GROUP_A_SECTION_LABELS = new Set(['אולם', 'אגף מרכז']);
const GROUP_B_SECTION_LABELS = new Set([
	'קיטקאט קלאסי',
	"לאונג'",
	'לאמיצים בלבד',
	"לאונג'.",
	'קיטקאט בר',
	'סלון',
	'סלון.',
	'3'
]);
const EXCLUDED_SECTION_LABELS = new Set(['עליה', 'יציע', 'תאים שמאל', 'תאים ימין', 'אגף שמאל', 'אגף ימין']);

function normalizeText(value: string | undefined): string {
	return (value ?? '')
		.replace(/[\u200e\u200f\u202a-\u202e]/g, '')
		.trim()
		.toLocaleLowerCase();
}

function getSectionMatchKind(sectionLabel: string): FlattenedSeat['sectionMatchKind'] {
	const normalizedLabel = normalizeText(sectionLabel);

	if (!normalizedLabel) {
		return 'unknown';
	}

	if (GROUP_A_SECTION_LABELS.has(normalizedLabel)) {
		return 'group_a';
	}

	if (GROUP_B_SECTION_LABELS.has(normalizedLabel)) {
		return 'group_b';
	}

	if (EXCLUDED_SECTION_LABELS.has(normalizedLabel)) {
		return 'excluded';
	}

	return 'excluded';
}

function flattenSeatplan(seatplan: CameriSeatplanResponse): FlattenedSeat[] {
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

export function parseAvailability(
	seatplan: CameriSeatplanResponse,
	seatStatus: CameriSeatStatusResponse
): ParsedSeatAvailability {
	const flattenedSeats = flattenSeatplan(seatplan);
	const availableSeats = flattenedSeats.filter(seat => seat.key in (seatStatus.seats ?? {}));
	const groupASeats = availableSeats.filter(
		seat => seat.sectionMatchKind === 'group_a' && PREFERRED_ROWS.has(normalizeText(seat.rowLabel))
	);
	const groupBSeats = availableSeats.filter(seat => seat.sectionMatchKind === 'group_b');
	const preferredSeats = [...groupASeats, ...groupBSeats];
	const matchedRows = Array.from(new Set(groupASeats.map(seat => seat.rowLabel))).sort(
		(left, right) => Number(left) - Number(right)
	);
	const matchedSections = Array.from(new Set(preferredSeats.map(seat => seat.sectionLabel))).sort((left, right) =>
		left.localeCompare(right)
	);
	const hasSupportedPreferredSections = flattenedSeats.some(
		seat => seat.sectionMatchKind === 'group_a' || seat.sectionMatchKind === 'group_b'
	);
	const hasAmbiguousSections = flattenedSeats.some(seat => seat.sectionMatchKind === 'unknown');

	if (hasAmbiguousSections) {
		return {
			available: false,
			availabilityType: 'unknown',
			availableInPreferred: false,
			matchedRows: [],
			matchedSections: [],
			availableSeatCount: 0,
			sourceStatus: 'ambiguous_section_labels',
			sourceConfidence: 'low'
		};
	}

	if (availableSeats.length === 0) {
		return {
			available: false,
			availabilityType: 'unknown',
			availableInPreferred: false,
			matchedRows: [],
			matchedSections: [],
			availableSeatCount: 0,
			sourceStatus: 'no_available_seats',
			sourceConfidence: hasSupportedPreferredSections ? 'high' : 'medium'
		};
	}

	if (preferredSeats.length > 0) {
		const availabilityType = groupASeats.length > 0 ? 'row' : 'section';

		return {
			available: true,
			availabilityType,
			availableInPreferred: true,
			matchedRows,
			matchedSections,
			availableSeatCount: preferredSeats.length,
			sourceStatus: 'preferred_sections_confirmed',
			sourceConfidence: 'high'
		};
	}

	return {
		available: false,
		availabilityType: 'unknown',
		availableInPreferred: false,
		matchedRows: [],
		matchedSections: [],
		availableSeatCount: 0,
		sourceStatus: 'available_outside_preferred_sections',
		sourceConfidence: hasSupportedPreferredSections ? 'medium' : 'low'
	};
}
