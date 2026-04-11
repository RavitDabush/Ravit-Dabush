import { describe, expect, it } from 'vitest';
import { parseSeatAvailability } from './parseSeatAvailability';
import type { HabimaSeatStatusResponse, HabimaSeatplanResponse } from './types';

function createSeatplan(sectionLabel: string, rows: Record<string, string[]>): HabimaSeatplanResponse {
	return {
		S: {
			'1': {
				n: sectionLabel,
				G: {
					'1': {
						R: Object.fromEntries(
							Object.entries(rows).map(([rowLabel, seatIds]) => [
								rowLabel,
								{
									n: rowLabel,
									S: Object.fromEntries(seatIds.map(seatId => [seatId, { n: seatId }]))
								}
							])
						)
					}
				}
			}
		}
	};
}

function createSeatStatus(keys: string[]): HabimaSeatStatusResponse {
	return {
		seats: Object.fromEntries(keys.map(key => [key, 1]))
	};
}

describe('habima parseSeatAvailability', () => {
	it('counts preferred hall seats only in preferred rows', () => {
		const seatplan = createSeatplan('Main Hall', {
			'1': ['1', '2'],
			'7': ['3'],
			'8': ['4', '5']
		});
		const seatStatus = createSeatStatus(['1_1_1', '1_2_1', '1_3_7', '1_4_8', '1_5_8']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['Main Hall']);
		expect(result.matchedRows).toEqual(['1', '7']);
		expect(result.availableSeatCount).toBe(3);
		expect(result.sourceStatus).toBe('confirmed_main_hall_preferred_rows');
	});

	it('counts preferred table sections even outside preferred rows', () => {
		const seatplan = createSeatplan('Table Seats', {
			'8': ['1', '2'],
			'10': ['3']
		});
		const seatStatus = createSeatStatus(['1_1_8', '1_2_8', '1_3_10']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['Table Seats']);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(3);
		expect(result.sourceStatus).toBe('confirmed_table_preferred_seats');
	});

	it('excludes preferred rows in gallery sections', () => {
		const seatplan = createSeatplan('Gallery', {
			'1': ['1', '2'],
			'3': ['3']
		});
		const seatStatus = createSeatStatus(['1_1_1', '1_2_1', '1_3_3']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
		expect(result.sourceStatus).toBe('preferred_section_missing');
	});

	it('reports a non-confirmed status for preferred rows in unknown sections', () => {
		const seatplan = createSeatplan('Unknown Section', {
			'1': ['1', '2'],
			'3': ['3']
		});
		const seatStatus = createSeatStatus(['1_1_1', '1_2_1', '1_3_3']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
		expect(result.sourceStatus).toBe('preferred_rows_in_unknown_section');
		expect(result.sourceConfidence).toBe('medium');
	});
});
