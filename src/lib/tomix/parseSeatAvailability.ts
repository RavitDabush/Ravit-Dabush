import { ParsedTomixSeatAvailability, TomixEventerSeat } from './types';
import { getTomixAllowedSectionsForVenue, normalizeTomixVenueName } from './venueSections';

const PREFERRED_ROW_MIN = 1;
const PREFERRED_ROW_MAX = 7;

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

export function parseTomixSeatAvailability(
	seats: TomixEventerSeat[],
	venue: string | undefined,
	activeTicketTypeIds: string[]
): ParsedTomixSeatAvailability {
	const matchedSections = new Set<string>();
	const matchedRows = new Set<string>();
	const allowedSections = getTomixAllowedSectionsForVenue(venue);
	const activeTicketTypes = new Set(activeTicketTypeIds);
	const normalizedVenue = normalizeTomixVenueName(venue);
	let availableSeatCount = 0;

	for (const seat of seats) {
		if (seat.status !== 1 || seat.isSeat !== true) {
			continue;
		}

		if (!seat.ticketTypes?.some(ticketTypeId => activeTicketTypes.has(ticketTypeId))) {
			continue;
		}

		const parsedPlace = parsePlace(seat.place);

		if (!parsedPlace) {
			continue;
		}

		if (allowedSections && !allowedSections.has(parsedPlace.section)) {
			continue;
		}

		if (parsedPlace.rowNumber < PREFERRED_ROW_MIN || parsedPlace.rowNumber > PREFERRED_ROW_MAX) {
			continue;
		}

		availableSeatCount += 1;
		matchedSections.add(parsedPlace.section);
		matchedRows.add(parsedPlace.row);
	}

	return {
		availableInPreferredRows: availableSeatCount > 0,
		matchedSections: Array.from(matchedSections).sort((left, right) => Number(left) - Number(right)),
		matchedRows: Array.from(matchedRows).sort((left, right) => Number(left) - Number(right)),
		availableSeatCount,
		sourceStatus: allowedSections
			? `eventer-place:section_row_seat | venue-sections:${normalizedVenue}:${Array.from(allowedSections).join(',')}`
			: 'eventer-place:section_row_seat | venue-sections:fallback-row-only',
		sourceConfidence: 'medium'
	};
}
