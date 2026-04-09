import 'server-only';

import { FlattenedSeat, LessinSeatStatusResponse, LessinSeatplanResponse, ParsedSeatAvailability } from './types';

const PREFERRED_ROWS = new Set(['1', '2', '3', '4', '5', '6', '7']);

function flattenSeatplan(seatplan: LessinSeatplanResponse): FlattenedSeat[] {
	const flattenedSeats: FlattenedSeat[] = [];

	for (const [sectionId, section] of Object.entries(seatplan.S ?? {})) {
		for (const [groupId, group] of Object.entries(section.G ?? {})) {
			for (const [rowId, row] of Object.entries(group.R ?? {})) {
				const rowLabel = `${row.n ?? rowId}`.trim();

				for (const [seatId, seat] of Object.entries(row.S ?? {})) {
					flattenedSeats.push({
						key: `${sectionId}_${seatId}_${rowId}`,
						sectionId,
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
	const preferredAvailableSeats = availableSeats.filter(seat => PREFERRED_ROWS.has(seat.rowLabel));
	const matchedRows = Array.from(new Set(preferredAvailableSeats.map(seat => seat.rowLabel))).sort(
		(left, right) => Number(left) - Number(right)
	);

	return {
		availableInPreferredRows: preferredAvailableSeats.length > 0,
		matchedRows,
		availableSeatCount: preferredAvailableSeats.length
	};
}
