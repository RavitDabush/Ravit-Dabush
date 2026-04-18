import { describe, expect, it } from 'vitest';
import { parseTomixSeatAvailability } from './parseSeatAvailability';
import type { TomixEventerArena, TomixEventerSeat } from './types';

const ACTIVE_TICKET_TYPE_ID = '69d76000ee7e3f479eb3244d';
const INACTIVE_TICKET_TYPE_ID = 'inactive-ticket-type';
const KALCHKIN_VENUE =
	'\u05d0\u05d5\u05d3\u05d9\u05d8\u05d5\u05e8\u05d9\u05d5\u05dd \u05e2"\u05e9 \u05e7\u05dc\u05e6\'\u05e7\u05d9\u05df, \u05ea\u05dc \u05d0\u05d1\u05d9\u05d1';
const UNMAPPED_VENUE = 'Unmapped TOMIX venue';
const RISHON_VENUE =
	'\u05d4\u05d9\u05db\u05dc \u05d4\u05ea\u05e8\u05d1\u05d5\u05ea \u05e8\u05d0\u05e9\u05d5\u05df \u05dc\u05e6\u05d9\u05d5\u05df';

function createSeats(row: number, count: number, ticketTypeId: string, section = '1'): TomixEventerSeat[] {
	return Array.from({ length: count }, (_, index) => ({
		_id: `${section}-${row}-${index + 1}`,
		place: `${section}_${row}_${index + 1}`,
		ticketTypes: [ticketTypeId],
		status: 1,
		isSeat: true
	}));
}

function createSeat(place: string, ticketTypeId: string): TomixEventerSeat {
	return {
		_id: `seat-${place}`,
		place,
		ticketTypes: [ticketTypeId],
		status: 1,
		isSeat: true
	};
}

function createRishonArena(
	overrides: NonNullable<NonNullable<TomixEventerArena['svg']>['sections']> = []
): TomixEventerArena {
	return {
		svg: {
			sections: [
				{
					sectionId: 1,
					sectionName: '\u05d0\u05d5\u05dc\u05dd',
					lines: [{ lineNumber: 7, lineName: '\u05e9\u05d5\u05e8\u05d4 7' }]
				},
				{
					sectionId: 2,
					sectionName: '\u05d0\u05d5\u05dc\u05dd',
					lines: [
						{ lineNumber: 1, lineName: '\u05e9\u05d5\u05e8\u05d4 \u05d0' },
						{ lineNumber: 2, lineName: '\u05e9\u05d5\u05e8\u05d4 \u05d1' }
					]
				},
				...overrides
			]
		}
	};
}

function createShiftedRowsArena(): TomixEventerArena {
	return {
		svg: {
			sections: [
				{
					sectionId: 1,
					lines: [
						{ lineNumber: 1, lineName: '\u05e9\u05d5\u05e8\u05d4 2' },
						{ lineNumber: 2, lineName: '\u05e9\u05d5\u05e8\u05d4 1' },
						{ lineNumber: 3, lineName: '\u05e9\u05d5\u05e8\u05d4 1' }
					]
				},
				{
					sectionId: 2,
					lines: [
						{ lineNumber: 2, lineName: '\u05e9\u05d5\u05e8\u05d4 B' },
						{ lineNumber: 8, lineName: '\u05e9\u05d5\u05e8\u05d4 7' }
					]
				},
				{
					sectionId: 3,
					lines: [{ lineNumber: 2, lineName: '\u05e9\u05d5\u05e8\u05d4 2' }]
				}
			]
		}
	};
}

function createDisplayStartsAtTwoArena(): TomixEventerArena {
	return {
		svg: {
			sections: [
				{
					sectionId: 1,
					lines: [
						{ lineNumber: 1, lineName: '\u05e9\u05d5\u05e8\u05d4 2' },
						{ lineNumber: 6, lineName: '\u05e9\u05d5\u05e8\u05d4 7' },
						{ lineNumber: 7, lineName: '\u05e9\u05d5\u05e8\u05d4 8' }
					]
				}
			]
		}
	};
}

describe('tomix parseSeatAvailability', () => {
	it('counts only seats that match the active event ticket types', () => {
		const seats: TomixEventerSeat[] = [
			...createSeats(1, 30, ACTIVE_TICKET_TYPE_ID),
			...createSeats(2, 40, INACTIVE_TICKET_TYPE_ID),
			...createSeats(3, 25, ACTIVE_TICKET_TYPE_ID),
			...createSeats(4, 35, INACTIVE_TICKET_TYPE_ID),
			...createSeats(5, 34, INACTIVE_TICKET_TYPE_ID),
			...createSeats(6, 33, INACTIVE_TICKET_TYPE_ID),
			...createSeats(7, 26, ACTIVE_TICKET_TYPE_ID)
		];

		const result = parseTomixSeatAvailability(seats, KALCHKIN_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['1']);
		expect(result.matchedRows).toEqual(['1', '3', '7']);
		expect(result.availableSeatCount).toBe(81);
	});

	it('excludes seats when ticket types do not match the active event ticket types', () => {
		const seats: TomixEventerSeat[] = [
			...createSeats(1, 2, INACTIVE_TICKET_TYPE_ID),
			...createSeats(3, 3, INACTIVE_TICKET_TYPE_ID),
			...createSeats(7, 4, INACTIVE_TICKET_TYPE_ID)
		];

		const result = parseTomixSeatAvailability(seats, KALCHKIN_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
	});

	it('falls back to row-only filtering when the venue is not mapped', () => {
		const seats: TomixEventerSeat[] = [
			...createSeats(1, 2, ACTIVE_TICKET_TYPE_ID, '1'),
			...createSeats(7, 3, ACTIVE_TICKET_TYPE_ID, '2'),
			...createSeats(8, 4, ACTIVE_TICKET_TYPE_ID, '1'),
			...createSeats(10, 5, ACTIVE_TICKET_TYPE_ID, '2')
		];

		const result = parseTomixSeatAvailability(seats, UNMAPPED_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['1', '2']);
		expect(result.matchedRows).toEqual(['1', '7']);
		expect(result.availableSeatCount).toBe(5);
	});

	it('ignores malformed place values without marking seats as available', () => {
		const seats: TomixEventerSeat[] = [
			{ _id: 'malformed-abc', place: 'abc', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 1, isSeat: true },
			{ _id: 'malformed-missing-seat', place: '1_2', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 1, isSeat: true },
			{ _id: 'malformed-row', place: '1_x_3', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 1, isSeat: true }
		];

		const result = parseTomixSeatAvailability(seats, KALCHKIN_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
	});

	it('counts only seats from allowed sections when the venue is mapped', () => {
		const seats: TomixEventerSeat[] = [
			...createSeats(1, 2, ACTIVE_TICKET_TYPE_ID, '1'),
			...createSeats(3, 3, ACTIVE_TICKET_TYPE_ID, '1'),
			...createSeats(2, 4, ACTIVE_TICKET_TYPE_ID, '2'),
			...createSeats(4, 5, ACTIVE_TICKET_TYPE_ID, '2')
		];

		const result = parseTomixSeatAvailability(seats, KALCHKIN_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['1']);
		expect(result.matchedRows).toEqual(['1', '3']);
		expect(result.availableSeatCount).toBe(5);
	});

	it('excludes seats when status is not available', () => {
		const seats: TomixEventerSeat[] = [
			...createSeats(1, 2, ACTIVE_TICKET_TYPE_ID),
			{ _id: 'status-zero', place: '1_2_1', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 0, isSeat: true },
			{ _id: 'status-two', place: '1_3_1', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 2, isSeat: true }
		];

		const result = parseTomixSeatAvailability(seats, KALCHKIN_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['1']);
		expect(result.matchedRows).toEqual(['1']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('excludes entries that are not real seats', () => {
		const seats: TomixEventerSeat[] = [
			...createSeats(1, 2, ACTIVE_TICKET_TYPE_ID),
			{ _id: 'not-seat', place: '1_2_1', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 1, isSeat: false }
		];

		const result = parseTomixSeatAvailability(seats, KALCHKIN_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['1']);
		expect(result.matchedRows).toEqual(['1']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('counts only fully valid seats when multiple failure conditions exist', () => {
		const seats: TomixEventerSeat[] = [
			...createSeats(1, 2, ACTIVE_TICKET_TYPE_ID, '1'),
			...createSeats(3, 1, ACTIVE_TICKET_TYPE_ID, '1'),
			...createSeats(2, 2, INACTIVE_TICKET_TYPE_ID, '1'),
			...createSeats(4, 2, ACTIVE_TICKET_TYPE_ID, '2'),
			...createSeats(8, 2, ACTIVE_TICKET_TYPE_ID, '1'),
			{ _id: 'bad-place', place: '1_x_3', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 1, isSeat: true },
			{ _id: 'bad-status', place: '1_5_1', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 0, isSeat: true },
			{ _id: 'not-seat', place: '1_6_1', ticketTypes: [ACTIVE_TICKET_TYPE_ID], status: 1, isSeat: false }
		];

		const result = parseTomixSeatAvailability(seats, KALCHKIN_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['1']);
		expect(result.matchedRows).toEqual(['1', '3']);
		expect(result.availableSeatCount).toBe(3);
	});

	it('returns unique matched rows and sections', () => {
		const seats: TomixEventerSeat[] = [
			...createSeats(1, 3, ACTIVE_TICKET_TYPE_ID),
			...createSeats(1, 2, ACTIVE_TICKET_TYPE_ID),
			...createSeats(3, 4, ACTIVE_TICKET_TYPE_ID)
		];

		const result = parseTomixSeatAvailability(seats, KALCHKIN_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['1']);
		expect(result.matchedRows).toEqual(['1', '3']);
		expect(result.availableSeatCount).toBe(9);
	});

	it('adds display row labels from section-specific arena metadata for the verified p707f layout', () => {
		const seats: TomixEventerSeat[] = [
			...['2_1_12', '2_1_11', '2_1_2', '2_1_1'].map(place => createSeat(place, ACTIVE_TICKET_TYPE_ID)),
			...['2_2_2', '2_2_1'].map(place => createSeat(place, ACTIVE_TICKET_TYPE_ID)),
			...['1_7_7', '1_7_6', '1_7_5', '1_7_4', '1_7_3', '1_7_2', '1_7_1'].map(place =>
				createSeat(place, ACTIVE_TICKET_TYPE_ID)
			),
			createSeat('1_8_1', ACTIVE_TICKET_TYPE_ID)
		];

		const result = parseTomixSeatAvailability(seats, RISHON_VENUE, [ACTIVE_TICKET_TYPE_ID], createRishonArena());

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['1', '2']);
		expect(result.matchedRows).toEqual(['1', '2', '7']);
		expect(result.matchedRowDisplayLabels).toEqual(['\u05d0', '\u05d1', '7']);
		expect(result.availableSeatCount).toBe(13);
	});

	it('uses section-specific metadata when the same raw row token has different display labels', () => {
		const seats = [createSeat('1_2_18', ACTIVE_TICKET_TYPE_ID), createSeat('2_2_22', ACTIVE_TICKET_TYPE_ID)];

		const result = parseTomixSeatAvailability(seats, UNMAPPED_VENUE, [ACTIVE_TICKET_TYPE_ID], createShiftedRowsArena());

		expect(result.matchedRows).toEqual(['2']);
		expect(result.matchedRowDisplayLabels).toEqual(['B', '1']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('counts shifted numeric rows when the display label is preferred even if the raw token is outside the range', () => {
		const seats = [createSeat('2_8_32', ACTIVE_TICKET_TYPE_ID), createSeat('2_8_31', ACTIVE_TICKET_TYPE_ID)];

		const result = parseTomixSeatAvailability(seats, UNMAPPED_VENUE, [ACTIVE_TICKET_TYPE_ID], createShiftedRowsArena());

		expect(result.matchedRows).toEqual(['8']);
		expect(result.matchedRowDisplayLabels).toEqual(['7']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('excludes raw preferred rows when metadata shows the display row is not preferred', () => {
		const seats = [
			createSeat('1_1_18', ACTIVE_TICKET_TYPE_ID),
			createSeat('1_6_25', ACTIVE_TICKET_TYPE_ID),
			createSeat('1_7_20', ACTIVE_TICKET_TYPE_ID)
		];

		const result = parseTomixSeatAvailability(
			seats,
			UNMAPPED_VENUE,
			[ACTIVE_TICKET_TYPE_ID],
			createDisplayStartsAtTwoArena()
		);

		expect(result.matchedRows).toEqual(['1', '6']);
		expect(result.matchedRowDisplayLabels).toEqual(['2', '7']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('sorts display labels by the user-facing row label instead of the raw row token', () => {
		const seats = [createSeat('1_1_18', ACTIVE_TICKET_TYPE_ID), createSeat('1_2_22', ACTIVE_TICKET_TYPE_ID)];

		const result = parseTomixSeatAvailability(seats, UNMAPPED_VENUE, [ACTIVE_TICKET_TYPE_ID], createShiftedRowsArena());

		expect(result.matchedRows).toEqual(['1', '2']);
		expect(result.matchedRowDisplayLabels).toEqual(['1', '2']);
	});

	it('groups different raw row tokens under the same metadata display label', () => {
		const seats = [createSeat('1_2_18', ACTIVE_TICKET_TYPE_ID), createSeat('1_3_25', ACTIVE_TICKET_TYPE_ID)];

		const result = parseTomixSeatAvailability(seats, UNMAPPED_VENUE, [ACTIVE_TICKET_TYPE_ID], createShiftedRowsArena());

		expect(result.matchedRows).toEqual(['2', '3']);
		expect(result.matchedRowDisplayLabels).toEqual(['1']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('splits multi-place Eventer records before filtering and display grouping', () => {
		const seats = [createSeat('1_2_22 1_2_1 1_2_2', ACTIVE_TICKET_TYPE_ID)];

		const result = parseTomixSeatAvailability(seats, UNMAPPED_VENUE, [ACTIVE_TICKET_TYPE_ID], createShiftedRowsArena());

		expect(result.matchedSections).toEqual(['1']);
		expect(result.matchedRows).toEqual(['2']);
		expect(result.matchedRowDisplayLabels).toEqual(['1']);
		expect(result.availableSeatCount).toBe(3);
	});

	it('falls back to numeric row labels when arena metadata is missing', () => {
		const seats = [createSeat('2_1_12', ACTIVE_TICKET_TYPE_ID), createSeat('2_2_1', ACTIVE_TICKET_TYPE_ID)];

		const result = parseTomixSeatAvailability(seats, RISHON_VENUE, [ACTIVE_TICKET_TYPE_ID]);

		expect(result.matchedRows).toEqual(['1', '2']);
		expect(result.matchedRowDisplayLabels).toEqual(['1', '2']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('falls back per row when arena metadata is incomplete', () => {
		const seats = [createSeat('2_1_12', ACTIVE_TICKET_TYPE_ID), createSeat('2_2_1', ACTIVE_TICKET_TYPE_ID)];
		const arena: TomixEventerArena = {
			svg: {
				sections: [
					{
						sectionId: 2,
						lines: [{ lineNumber: 1, lineName: '\u05e9\u05d5\u05e8\u05d4 \u05d0' }]
					}
				]
			}
		};

		const result = parseTomixSeatAvailability(seats, RISHON_VENUE, [ACTIVE_TICKET_TYPE_ID], arena);

		expect(result.matchedRowDisplayLabels).toEqual(['\u05d0', '2']);
	});

	it('falls back when arena line names are unusable', () => {
		const seats = [createSeat('2_1_12', ACTIVE_TICKET_TYPE_ID), createSeat('2_2_1', ACTIVE_TICKET_TYPE_ID)];
		const arena: TomixEventerArena = {
			svg: {
				sections: [
					{
						sectionId: 2,
						lines: [{ lineNumber: 1, lineName: '   ' }, { lineNumber: 2 }]
					}
				]
			}
		};

		const result = parseTomixSeatAvailability(seats, RISHON_VENUE, [ACTIVE_TICKET_TYPE_ID], arena);

		expect(result.matchedRowDisplayLabels).toEqual(['1', '2']);
	});
});
