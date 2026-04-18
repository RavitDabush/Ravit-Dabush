import { ParsedTomixSeatAvailability, TomixEventerArena, TomixEventerSeat } from './types';
import { getTomixAllowedSectionsForVenue, normalizeTomixVenueName } from './venueSections';

const PREFERRED_ROW_MIN = 1;
const PREFERRED_ROW_MAX = 7;
const HEBREW_ROW_NUMBERS: Record<string, number> = {
	א: 1,
	ב: 2,
	ג: 3,
	ד: 4,
	ה: 5,
	ו: 6,
	ז: 7
};

const LATIN_ROW_NUMBERS: Record<string, number> = {
	A: 1,
	B: 2,
	C: 3,
	D: 4,
	E: 5,
	F: 6,
	G: 7
};

type RowDisplayMetadata = {
	label: string;
	preferredRowNumber: number | null;
};

function parsePlace(
	place: string | undefined
): { section: string; row: string; seat: string; rowNumber: number } | null {
	if (!place) {
		return null;
	}

	const [section, row, seat] = place.split('_');
	const rowNumber = Number(row);

	if (!section || !row || !seat || !Number.isInteger(rowNumber)) {
		return null;
	}

	return {
		section,
		row,
		seat,
		rowNumber
	};
}

function splitPlaceEntries(place: string | undefined): string[] {
	return place?.split(/\s+/).filter(Boolean) ?? [];
}

function normalizeLineName(lineName: string | undefined): string | null {
	const label = lineName
		?.replace(/^\s*\u05e9\u05d5\u05e8\u05d4\s*/u, '')
		.replace(/\s+/g, ' ')
		.trim();

	return label || null;
}

function parsePreferredRowNumberFromDisplayLabel(label: string): number | null {
	const numericMatch = label.match(/^([1-9]\d*)(?:\s*[A-Za-z])?$/u);

	if (numericMatch) {
		return Number(numericMatch[1]);
	}

	const normalizedLetter = label.replace(/['\u05f3]/gu, '').trim();

	return HEBREW_ROW_NUMBERS[normalizedLetter] ?? LATIN_ROW_NUMBERS[normalizedLetter.toUpperCase()] ?? null;
}

function isPreferredRowNumber(rowNumber: number): boolean {
	return rowNumber >= PREFERRED_ROW_MIN && rowNumber <= PREFERRED_ROW_MAX;
}

function createRowDisplayMetadataMap(arena: TomixEventerArena | undefined): Map<string, RowDisplayMetadata> {
	const labels = new Map<string, RowDisplayMetadata>();

	for (const section of arena?.svg?.sections ?? []) {
		if (typeof section.sectionId !== 'number' && typeof section.sectionId !== 'string') {
			continue;
		}

		for (const line of section.lines ?? []) {
			if (typeof line.lineNumber !== 'number' && typeof line.lineNumber !== 'string') {
				continue;
			}

			const label = normalizeLineName(line.lineName);

			if (label) {
				labels.set(`${section.sectionId}_${line.lineNumber}`, {
					label,
					preferredRowNumber: parsePreferredRowNumberFromDisplayLabel(label)
				});
			}
		}
	}

	return labels;
}

function getRowDisplayMetadata(
	displayMetadataMap: Map<string, RowDisplayMetadata>,
	section: string,
	row: string
): RowDisplayMetadata | null {
	return displayMetadataMap.get(`${section}_${row}`) ?? null;
}

function sortRows(left: string, right: string): number {
	return Number(left) - Number(right);
}

function getDisplayLabelSortRank(label: string): number {
	if (/^[\u05d0-\u05eaA-Za-z]$/u.test(label)) {
		return 0;
	}

	if (/^\d+[A-Za-z]?$/u.test(label)) {
		return 1;
	}

	return 2;
}

function sortDisplayLabels(left: string, right: string): number {
	const rankDiff = getDisplayLabelSortRank(left) - getDisplayLabelSortRank(right);

	if (rankDiff !== 0) {
		return rankDiff;
	}

	const leftNumber = Number.parseInt(left, 10);
	const rightNumber = Number.parseInt(right, 10);

	if (Number.isInteger(leftNumber) && Number.isInteger(rightNumber) && leftNumber !== rightNumber) {
		return leftNumber - rightNumber;
	}

	return left.localeCompare(right, 'he', { numeric: true });
}

export function parseTomixSeatAvailability(
	seats: TomixEventerSeat[],
	venue: string | undefined,
	activeTicketTypeIds: string[],
	arena?: TomixEventerArena
): ParsedTomixSeatAvailability {
	const matchedSections = new Set<string>();
	const matchedRows = new Set<string>();
	const matchedRowDisplayLabels = new Set<string>();
	const allowedSections = getTomixAllowedSectionsForVenue(venue);
	const activeTicketTypes = new Set(activeTicketTypeIds);
	const normalizedVenue = normalizeTomixVenueName(venue);
	const rowDisplayLabels = createRowDisplayMetadataMap(arena);
	let availableSeatCount = 0;

	for (const seat of seats) {
		if (seat.status !== 1 || seat.isSeat !== true) {
			continue;
		}

		if (!seat.ticketTypes?.some(ticketTypeId => activeTicketTypes.has(ticketTypeId))) {
			continue;
		}

		for (const placeEntry of splitPlaceEntries(seat.place)) {
			const parsedPlace = parsePlace(placeEntry);

			if (!parsedPlace) {
				continue;
			}

			if (allowedSections && !allowedSections.has(parsedPlace.section)) {
				continue;
			}

			const rowDisplayMetadata = getRowDisplayMetadata(rowDisplayLabels, parsedPlace.section, parsedPlace.row);
			const preferredRowNumber = rowDisplayMetadata?.preferredRowNumber ?? parsedPlace.rowNumber;

			if (!isPreferredRowNumber(preferredRowNumber)) {
				continue;
			}

			availableSeatCount += 1;
			matchedSections.add(parsedPlace.section);
			matchedRows.add(parsedPlace.row);
			const rowDisplayLabel = rowDisplayMetadata?.label ?? parsedPlace.row;
			matchedRowDisplayLabels.add(rowDisplayLabel);
		}
	}

	return {
		availableInPreferredRows: availableSeatCount > 0,
		matchedSections: Array.from(matchedSections).sort(sortRows),
		matchedRows: Array.from(matchedRows).sort(sortRows),
		matchedRowDisplayLabels: Array.from(matchedRowDisplayLabels).sort(sortDisplayLabels),
		availableSeatCount,
		sourceStatus: allowedSections
			? `eventer-place:section_row_seat | venue-sections:${normalizedVenue}:${Array.from(allowedSections).join(',')}`
			: 'eventer-place:section_row_seat | venue-sections:fallback-row-only',
		sourceConfidence: 'medium'
	};
}
