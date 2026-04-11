import { describe, expect, it } from 'vitest';
import { parseSeatAvailability } from './parseSeatAvailability';
import type { LessinSeatStatusResponse, LessinSeatplanResponse } from './types';

function createSeatplan(sectionLabel: string, rows: Record<string, string[]>): LessinSeatplanResponse {
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

function createSeatStatus(keys: string[]): LessinSeatStatusResponse {
	return {
		seats: Object.fromEntries(keys.map(key => [key, 1]))
	};
}

describe('lessin parseSeatAvailability', () => {
	it('counts only available main hall seats in preferred rows', () => {
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
		expect(result.sectionDebugStatus).toBe('main-hall');
	});

	it('excludes preferred rows when available seats are only in non-main-hall sections', () => {
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
		expect(result.sectionDebugStatus).toBe('non-hall-only');
	});

	it('marks preferred rows with missing section labels as ambiguous', () => {
		const seatplan = createSeatplan('', {
			'1': ['1', '2'],
			'3': ['3']
		});
		const seatStatus = createSeatStatus(['1_1_1', '1_2_1', '1_3_3']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
		expect(result.sectionDebugStatus).toBe('ambiguous');
	});

	it('does not count seats that are absent from seat status', () => {
		const seatplan = createSeatplan('Main Hall', {
			'1': ['1', '2'],
			'2': ['3']
		});
		const seatStatus = createSeatStatus(['1_1_1']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['Main Hall']);
		expect(result.matchedRows).toEqual(['1']);
		expect(result.availableSeatCount).toBe(1);
		expect(result.sectionDebugStatus).toBe('main-hall');
	});
});
