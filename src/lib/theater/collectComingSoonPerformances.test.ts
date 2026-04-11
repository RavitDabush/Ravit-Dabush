import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TheaterNormalizedPerformance } from './types';

const collectorMocks = vi.hoisted(() => ({
	cameri: vi.fn<() => Promise<TheaterNormalizedPerformance[]>>(),
	habima: vi.fn<() => Promise<TheaterNormalizedPerformance[]>>(),
	lessin: vi.fn<() => Promise<TheaterNormalizedPerformance[]>>()
}));

vi.mock('next/cache', () => ({
	unstable_cache: (callback: unknown) => callback
}));

vi.mock('@/lib/cameri/normalizePerformance', () => ({
	getNormalizedSaleLifecyclePerformances: collectorMocks.cameri
}));

vi.mock('@/lib/habima/normalizePerformance', () => ({
	getNormalizedSaleLifecyclePerformances: collectorMocks.habima
}));

vi.mock('@/lib/lessin/normalizePerformance', () => ({
	getNormalizedSaleLifecyclePerformances: collectorMocks.lessin
}));

import { collectComingSoonPerformances } from './collectComingSoonPerformances';

function createPerformance(overrides: Partial<TheaterNormalizedPerformance>): TheaterNormalizedPerformance {
	return {
		id: 'performance-1',
		showName: 'Show name',
		date: '2026-05-01',
		time: '20:30',
		hasPreferredAvailability: false,
		availabilityType: 'unknown',
		matchedSections: [],
		matchedRows: [],
		sourceConfidence: 'medium',
		saleLifecycle: {
			saleState: 'on_sale',
			ticketSaleStart: '2026-04-01T10:00:00',
			ticketSaleStop: '2026-05-01T18:00:00'
		},
		...overrides
	};
}

describe('theater collectComingSoonPerformances', () => {
	beforeEach(() => {
		collectorMocks.cameri.mockReset();
		collectorMocks.habima.mockReset();
		collectorMocks.lessin.mockReset();

		collectorMocks.cameri.mockResolvedValue([]);
		collectorMocks.habima.mockResolvedValue([]);
		collectorMocks.lessin.mockResolvedValue([]);
	});

	it('includes only performances whose sale lifecycle has not started', async () => {
		const missingLifecycle = createPerformance({ id: 'missing-lifecycle' }) as Partial<TheaterNormalizedPerformance>;
		delete missingLifecycle.saleLifecycle;

		collectorMocks.lessin.mockResolvedValue([
			createPerformance({
				id: 'not-started',
				saleLifecycle: {
					saleState: 'not_started',
					ticketSaleStart: '2026-04-20T10:00:00'
				}
			}),
			createPerformance({ id: 'on-sale', saleLifecycle: { saleState: 'on_sale' } }),
			createPerformance({ id: 'sold-out', saleLifecycle: { saleState: 'sold_out' } }),
			createPerformance({ id: 'ended', saleLifecycle: { saleState: 'ended' } }),
			createPerformance({ id: 'unknown', saleLifecycle: { saleState: 'unknown' } }),
			missingLifecycle as TheaterNormalizedPerformance
		]);

		const result = await collectComingSoonPerformances();

		expect(result.map(performance => performance.id)).toEqual(['not-started']);
		expect(result[0].theaterId).toBe('lessin');
	});

	it('sorts coming soon performances by ticket sale start and preserves theater metadata', async () => {
		collectorMocks.lessin.mockResolvedValue([
			createPerformance({
				id: 'lessin-later',
				showName: 'Lessin later',
				saleLifecycle: {
					saleState: 'not_started',
					ticketSaleStart: '2026-05-10T10:00:00'
				}
			})
		]);
		collectorMocks.habima.mockResolvedValue([
			createPerformance({
				id: 'habima-earlier',
				showName: 'Habima earlier',
				saleLifecycle: {
					saleState: 'not_started',
					ticketSaleStart: '2026-04-15T10:00:00'
				}
			})
		]);
		collectorMocks.cameri.mockResolvedValue([
			createPerformance({
				id: 'cameri-middle',
				showName: 'Cameri middle',
				saleLifecycle: {
					saleState: 'not_started',
					ticketSaleStart: '2026-04-20T10:00:00'
				}
			})
		]);

		const result = await collectComingSoonPerformances();

		expect(result.map(performance => performance.id)).toEqual(['habima-earlier', 'cameri-middle', 'lessin-later']);
		expect(result.map(performance => performance.theaterId)).toEqual(['habima', 'cameri', 'lessin']);
		expect(result[0].showName).toBe('Habima earlier');
	});

	it('returns an empty list when sources are empty or have no coming soon performances', async () => {
		collectorMocks.lessin.mockResolvedValue([createPerformance({ id: 'lessin-on-sale' })]);
		collectorMocks.habima.mockResolvedValue([
			createPerformance({ id: 'habima-ended', saleLifecycle: { saleState: 'ended' } })
		]);

		const result = await collectComingSoonPerformances();

		expect(result).toEqual([]);
	});

	it('ignores a failing source collector and keeps results from other sources', async () => {
		collectorMocks.lessin.mockRejectedValue(new Error('Lessin unavailable'));
		collectorMocks.habima.mockResolvedValue([
			createPerformance({
				id: 'habima-coming-soon',
				saleLifecycle: {
					saleState: 'not_started',
					ticketSaleStart: '2026-04-20T10:00:00'
				}
			})
		]);

		const result = await collectComingSoonPerformances();

		expect(result.map(performance => performance.id)).toEqual(['habima-coming-soon']);
		expect(result[0].theaterId).toBe('habima');
	});
});
