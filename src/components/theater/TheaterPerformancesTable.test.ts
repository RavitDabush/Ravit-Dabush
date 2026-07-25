import { describe, expect, it } from 'vitest';
import type { TheaterNormalizedPerformance } from '@/lib/theater/types';
import { formatAvailableAreas } from './TheaterPerformancesTable';

function createPerformance(overrides: Partial<TheaterNormalizedPerformance> = {}): TheaterNormalizedPerformance {
	return {
		id: 'tomix-wjv7f',
		showName: 'מצחיקונת',
		date: '2026-07-26',
		time: '20:00',
		venue: 'תיאטרון toMix, אקספו ת"א',
		hasPreferredAvailability: true,
		availabilityType: 'row',
		matchedSections: ['1', '2', '3'],
		matchedRows: ['3', '4', '5'],
		matchedRowDisplayLabels: ['1', '4', '5', '6'],
		availableSeatCount: 6,
		sourceConfidence: 'medium',
		saleLifecycle: { saleState: 'on_sale' },
		...overrides
	};
}

describe('formatAvailableAreas', () => {
	it('shows only display rows for row availability without appending Eventer section IDs', () => {
		expect(formatAvailableAreas(createPerformance(), 'לא זמין')).toBe('1, 4, 5, 6');
	});

	it('shows sections for section availability', () => {
		expect(
			formatAvailableAreas(
				createPerformance({
					availabilityType: 'section',
					matchedRows: [],
					matchedRowDisplayLabels: [],
					matchedSections: ['אולם', 'יציע']
				}),
				'לא זמין'
			)
		).toBe('אולם, יציע');
	});
});
