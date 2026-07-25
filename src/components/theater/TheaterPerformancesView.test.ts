import { describe, expect, it } from 'vitest';
import type { TheaterNormalizedPerformance, TheaterPerformanceGroup } from '@/lib/theater/types';
import { groupPerformances } from './TheaterPerformancesView';

function createPerformance(showName: string): TheaterNormalizedPerformance {
	return {
		id: 'tomix-wjv7f',
		showName,
		date: '2026-07-26',
		time: '20:00',
		venue: 'תיאטרון toMix, אקספו ת"א',
		purchaseUrl: 'https://www.eventer.co.il/wjv7f',
		hasPreferredAvailability: true,
		availabilityType: 'row',
		matchedSections: ['1', '2', '3'],
		matchedRows: ['1', '4', '5', '6'],
		sourceConfidence: 'medium',
		saleLifecycle: { saleState: 'on_sale' }
	};
}

describe('groupPerformances', () => {
	it('does not retain another show that happens to share the same performance id', () => {
		const selectedShow = createPerformance('מצחיקונת');
		const otherShow = createPerformance('מופע אחר');
		const groups: TheaterPerformanceGroup[] = [
			{
				date: '2026-07-26',
				label: '26 ביולי 2026',
				performances: [selectedShow, otherShow]
			}
		];

		const result = groupPerformances([otherShow], groups);

		expect(result).toHaveLength(1);
		expect(result[0].performances).toEqual([otherShow]);
	});
});
