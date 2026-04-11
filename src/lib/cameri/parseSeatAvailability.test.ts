import { describe, expect, it } from 'vitest';
import { parseSeatAvailability } from './parseSeatAvailability';
import type { CameriSeatStatusResponse, CameriSeatplanResponse } from './types';

const GROUP_A_SECTION = '\u05d0\u05d5\u05dc\u05dd';
const GROUP_B_SECTION = '3';

function createSeatplan(sectionLabel: string, rows: Record<string, string[]>): CameriSeatplanResponse {
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

function createSeatStatus(keys: string[]): CameriSeatStatusResponse {
	return {
		seats: Object.fromEntries(keys.map(key => [key, 1]))
	};
}

describe('cameri parseSeatAvailability', () => {
	it('counts group A seats only in preferred rows', () => {
		const seatplan = createSeatplan(GROUP_A_SECTION, {
			'1': ['1', '2'],
			'7': ['3'],
			'8': ['4', '5']
		});
		const seatStatus = createSeatStatus(['1_1_1', '1_2_1', '1_3_7', '1_4_8', '1_5_8']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.available).toBe(true);
		expect(result.availableInPreferred).toBe(true);
		expect(result.availabilityType).toBe('row');
		expect(result.matchedSections).toEqual([GROUP_A_SECTION]);
		expect(result.matchedRows).toEqual(['1', '7']);
		expect(result.availableSeatCount).toBe(3);
	});

	it('counts group B seats as preferred section availability', () => {
		const seatplan = createSeatplan(GROUP_B_SECTION, {
			'8': ['1', '2'],
			'10': ['3']
		});
		const seatStatus = createSeatStatus(['1_1_8', '1_2_8', '1_3_10']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.available).toBe(true);
		expect(result.availableInPreferred).toBe(true);
		expect(result.availabilityType).toBe('section');
		expect(result.matchedSections).toEqual([GROUP_B_SECTION]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(3);
	});

	it('fails closed when section labels are ambiguous', () => {
		const seatplan = createSeatplan('', {
			'1': ['1', '2']
		});
		const seatStatus = createSeatStatus(['1_1_1', '1_2_1']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.available).toBe(false);
		expect(result.availableInPreferred).toBe(false);
		expect(result.availabilityType).toBe('unknown');
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
		expect(result.sourceStatus).toBe('ambiguous_section_labels');
	});

	it('returns unavailable when seats are available only outside preferred sections', () => {
		const seatplan = createSeatplan('Balcony', {
			'1': ['1', '2'],
			'3': ['3']
		});
		const seatStatus = createSeatStatus(['1_1_1', '1_2_1', '1_3_3']);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.available).toBe(false);
		expect(result.availableInPreferred).toBe(false);
		expect(result.availabilityType).toBe('unknown');
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
		expect(result.sourceStatus).toBe('available_outside_preferred_sections');
	});

	it('returns no available seats when seat status is empty', () => {
		const seatplan = createSeatplan(GROUP_A_SECTION, {
			'1': ['1', '2'],
			'7': ['3']
		});
		const seatStatus = createSeatStatus([]);

		const result = parseSeatAvailability(seatplan, seatStatus);

		expect(result.available).toBe(false);
		expect(result.availableInPreferred).toBe(false);
		expect(result.availabilityType).toBe('unknown');
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
		expect(result.sourceStatus).toBe('no_available_seats');
	});
});
