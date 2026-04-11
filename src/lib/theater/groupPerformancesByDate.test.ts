import { describe, expect, it } from 'vitest';
import { groupPerformancesByDate } from './groupPerformancesByDate';
import type { TheaterNormalizedPerformance } from './types';

function createPerformance(id: string, date: string, time: string): TheaterNormalizedPerformance {
	return {
		id,
		showName: `Show ${id}`,
		date,
		time,
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

describe('theater groupPerformancesByDate', () => {
	it('groups performances that share the same date', () => {
		const performances = [
			createPerformance('morning', '2026-05-01', '10:00'),
			createPerformance('evening', '2026-05-01', '20:30')
		];

		const groups = groupPerformancesByDate(performances, 'en');

		expect(groups).toHaveLength(1);
		expect(groups[0].date).toBe('2026-05-01');
		expect(groups[0].performances.map(performance => performance.id)).toEqual(['morning', 'evening']);
	});

	it('sorts performances inside each date group by time', () => {
		const performances = [
			createPerformance('late', '2026-05-01', '21:00'),
			createPerformance('early', '2026-05-01', '18:00'),
			createPerformance('middle', '2026-05-01', '20:30')
		];

		const groups = groupPerformancesByDate(performances, 'en');

		expect(groups[0].performances.map(performance => performance.id)).toEqual(['early', 'middle', 'late']);
	});

	it('sorts date groups chronologically', () => {
		const performances = [
			createPerformance('last', '2026-05-03', '20:30'),
			createPerformance('first', '2026-05-01', '20:30'),
			createPerformance('middle', '2026-05-02', '20:30')
		];

		const groups = groupPerformancesByDate(performances, 'en');

		expect(groups.map(group => group.date)).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
		expect(groups.map(group => group.performances[0].id)).toEqual(['first', 'middle', 'last']);
	});

	it('preserves the existing localized date label behavior', () => {
		const groups = groupPerformancesByDate([createPerformance('performance-1', '2026-05-01', '20:30')], 'en');

		expect(groups[0].label).toBe('Friday, May 1, 2026');
	});

	it('returns an empty array for empty input', () => {
		expect(groupPerformancesByDate([], 'en')).toEqual([]);
	});
});
