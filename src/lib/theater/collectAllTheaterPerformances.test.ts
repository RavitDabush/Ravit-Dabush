import { describe, expect, it } from 'vitest';
import { flattenCollectedTheaterPerformances } from './collectAllTheaterPerformances';
import type { TheaterCollectorResult, TheaterNormalizedPerformance } from './types';

function createPerformance(id: string): TheaterNormalizedPerformance {
	return {
		id,
		showName: `Show ${id}`,
		date: '2026-05-01',
		time: '20:30',
		hasPreferredAvailability: true,
		availabilityType: 'row',
		matchedSections: ['1'],
		matchedRows: ['1'],
		sourceConfidence: 'high',
		saleLifecycle: {
			saleState: 'on_sale'
		}
	};
}

describe('theater flattenCollectedTheaterPerformances', () => {
	it('flattens multiple collector results and keeps the correct theater id for each performance', () => {
		const lessinPerformance = createPerformance('lessin-1');
		const habimaPerformanceOne = createPerformance('habima-1');
		const habimaPerformanceTwo = createPerformance('habima-2');
		const results: TheaterCollectorResult[] = [
			{
				theaterId: 'lessin',
				collectedAt: '2026-04-12T10:00:00.000Z',
				performances: [lessinPerformance]
			},
			{
				theaterId: 'habima',
				collectedAt: '2026-04-12T10:00:00.000Z',
				performances: [habimaPerformanceOne, habimaPerformanceTwo]
			}
		];

		const flattened = flattenCollectedTheaterPerformances(results);

		expect(flattened).toEqual([
			{ theaterId: 'lessin', performance: lessinPerformance },
			{ theaterId: 'habima', performance: habimaPerformanceOne },
			{ theaterId: 'habima', performance: habimaPerformanceTwo }
		]);
	});

	it('returns an empty array for empty input and empty collector results', () => {
		const emptyCollectors: TheaterCollectorResult[] = [
			{
				theaterId: 'lessin',
				collectedAt: '2026-04-12T10:00:00.000Z',
				performances: []
			},
			{
				theaterId: 'cameri',
				collectedAt: '2026-04-12T10:00:00.000Z',
				performances: []
			}
		];

		expect(flattenCollectedTheaterPerformances([])).toEqual([]);
		expect(flattenCollectedTheaterPerformances(emptyCollectors)).toEqual([]);
	});

	it('ignores empty collectors while preserving performances from non-empty collectors', () => {
		const tomixPerformance = createPerformance('tomix-1');
		const results: TheaterCollectorResult[] = [
			{
				theaterId: 'lessin',
				collectedAt: '2026-04-12T10:00:00.000Z',
				performances: []
			},
			{
				theaterId: 'tomix',
				collectedAt: '2026-04-12T10:00:00.000Z',
				performances: [tomixPerformance]
			},
			{
				theaterId: 'habima',
				collectedAt: '2026-04-12T10:00:00.000Z',
				performances: []
			}
		];

		expect(flattenCollectedTheaterPerformances(results)).toEqual([{ theaterId: 'tomix', performance: tomixPerformance }]);
	});

	it('does not mutate collector results or performance objects', () => {
		const performance = createPerformance('cameri-1');
		const results: TheaterCollectorResult[] = [
			{
				theaterId: 'cameri',
				collectedAt: '2026-04-12T10:00:00.000Z',
				performances: [performance]
			}
		];
		const originalResults = structuredClone(results);

		const flattened = flattenCollectedTheaterPerformances(results);

		expect(results).toEqual(originalResults);
		expect(flattened[0].performance).toBe(performance);
	});
});
