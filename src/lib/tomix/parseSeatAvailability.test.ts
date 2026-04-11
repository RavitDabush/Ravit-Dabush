import { describe, expect, it } from 'vitest';
import { parseTomixSeatAvailability } from './parseSeatAvailability';
import type { TomixEventerSeat } from './types';

const ACTIVE_TICKET_TYPE_ID = '69d76000ee7e3f479eb3244d';
const INACTIVE_TICKET_TYPE_ID = 'inactive-ticket-type';
const KALCHKIN_VENUE =
	'\u05d0\u05d5\u05d3\u05d9\u05d8\u05d5\u05e8\u05d9\u05d5\u05dd \u05e2"\u05e9 \u05e7\u05dc\u05e6\'\u05e7\u05d9\u05df, \u05ea\u05dc \u05d0\u05d1\u05d9\u05d1';
const UNMAPPED_VENUE = 'Unmapped TOMIX venue';

function createSeats(row: number, count: number, ticketTypeId: string, section = '1'): TomixEventerSeat[] {
	return Array.from({ length: count }, (_, index) => ({
		_id: `${section}-${row}-${index + 1}`,
		place: `${section}_${row}_${index + 1}`,
		ticketTypes: [ticketTypeId],
		status: 1,
		isSeat: true
	}));
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
});
