import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HabimaScheduleEntry } from './types';

vi.mock('next/cache', () => ({
	unstable_cache: (callback: unknown) => callback
}));

function createEntry(id: string): HabimaScheduleEntry {
	return {
		id,
		showName: 'Failed show',
		date: '2026-04-12',
		time: '20:30',
		venue: 'Main Venue',
		purchaseUrl: `https://tickets.habima.co.il/order/${id}`,
		sourceShowKey: 'failedShow'
	};
}

describe('habima fetchSeatAvailabilityBatch', () => {
	const originalFetch = global.fetch;
	let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.resetModules();
		consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
	});

	afterEach(() => {
		global.fetch = originalFetch;
		consoleInfoSpy.mockRestore();
		vi.restoreAllMocks();
	});

	it('reuses duplicate failed availability results from cache within the TTL', async () => {
		const fetchMock = vi.fn(async () => new Response('', { status: 500 }));
		global.fetch = fetchMock;

		const { fetchSeatAvailabilityBatch } = await import('./fetchSeatAvailability');
		const entries = [createEntry('501'), createEntry('501')];

		const firstResults = await fetchSeatAvailabilityBatch(entries, 4);
		const secondResults = await fetchSeatAvailabilityBatch(entries, 4);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(firstResults).toHaveLength(2);
		expect(secondResults).toHaveLength(2);
		expect(firstResults.every(result => result.errors.length > 0)).toBe(true);
		expect(secondResults.every(result => result.errors.length > 0)).toBe(true);
		expect(firstResults[0]).toEqual(firstResults[1]);
		expect(secondResults[0]).toEqual(firstResults[0]);
		expect(consoleInfoSpy).toHaveBeenCalledWith(
			'[habima-availability-cache]',
			expect.objectContaining({
				requestedCount: 2,
				failureCount: 2,
				concurrencyLimit: 4
			})
		);
	});
});
