import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TomixScheduleEntry } from './types';

vi.mock('next/cache', () => ({
	unstable_cache: (callback: unknown) => callback
}));

function createEntry(eventId: string): TomixScheduleEntry {
	return {
		id: `tomix-${eventId}`,
		eventId,
		showName: 'TOMIX Show',
		date: '2026-05-01',
		time: '20:30',
		venue: 'TOMIX Venue',
		purchaseUrl: `https://www.eventer.co.il/${eventId}`,
		productUrl: 'https://www.to-mix.co.il/product/show/',
		ticketTypeIds: [`ticket-${eventId}`]
	};
}

describe('tomix fetchTomixSeatAvailabilityBatch', () => {
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

	it('caches availability by Eventer event id and reports duplicate work', async () => {
		const fetchMock = vi.fn(async () => Response.json([{ _id: 'seat-1' }]));
		global.fetch = fetchMock;

		const { fetchTomixSeatAvailabilityBatch } = await import('./fetchSeatAvailability');
		const entries = [createEntry('event-1'), createEntry('event-1')];

		const firstResults = await fetchTomixSeatAvailabilityBatch(entries, 1);
		const secondResults = await fetchTomixSeatAvailabilityBatch([createEntry('event-1')], 1);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(firstResults).toHaveLength(2);
		expect(secondResults).toHaveLength(1);
		expect(firstResults[0]).toEqual(firstResults[1]);
		expect(secondResults[0]).toEqual(firstResults[0]);
		expect(fetchMock).toHaveBeenCalledWith(
			'https://www.eventer.co.il/arenas/event-1/seats.js',
			expect.objectContaining({
				next: {
					revalidate: 300,
					tags: ['theater:tomix:availability']
				}
			})
		);
		expect(consoleInfoSpy).toHaveBeenCalledWith(
			'[tomix-availability-duplicates]',
			expect.objectContaining({
				duplicateCount: 1,
				eventIds: ['event-1']
			})
		);
		expect(consoleInfoSpy).toHaveBeenCalledWith(
			'[tomix-availability-cache]',
			expect.objectContaining({
				requestedCount: 2,
				cacheHitCount: 0,
				cacheMissCount: 2,
				concurrencyLimit: 1,
				revalidateSeconds: 300
			})
		);
		expect(consoleInfoSpy).toHaveBeenCalledWith(
			'[tomix-availability-cache]',
			expect.objectContaining({
				requestedCount: 1,
				cacheHitCount: 1,
				cacheMissCount: 0,
				concurrencyLimit: 1,
				revalidateSeconds: 300
			})
		);
	});
});
