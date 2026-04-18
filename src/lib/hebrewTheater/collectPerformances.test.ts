import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HebrewTheaterShow } from './types';

vi.mock('next/cache', () => ({
	unstable_cache: (callback: unknown) => callback
}));

function createShow(events: NonNullable<HebrewTheaterShow['events']>): HebrewTheaterShow {
	return {
		id: 2338,
		title: '\u05e2\u05e4\u05e8\u05d4 - \u05d4\u05e6\u05d2\u05d5\u05ea \u05d7\u05d5\u05e5',
		events
	};
}

function createEvent(overrides: NonNullable<HebrewTheaterShow['events']>[number]) {
	return {
		id: 10950,
		title: '\u05e2\u05e4\u05e8\u05d4 - \u05e4\u05ea\u05d7 \u05ea\u05e7\u05d5\u05d5\u05d4',
		show_date: '2026-04-18',
		show_time: '21:00:00',
		event_place:
			'\u05d4\u05d9\u05db\u05dc \u05d4\u05ea\u05e8\u05d1\u05d5\u05ea \u05e4\u05ea\u05d7 \u05ea\u05e7\u05d5\u05d5\u05d4',
		permalink: '/%D7%A2%D7%A4%D7%A8%D7%94_-_%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%97%D7%95%D7%A5/?id=10950',
		tickets_available: true,
		website_left_tickets_count: 8,
		...overrides
	};
}

function mockFetchByUrl(fetchMock: ReturnType<typeof vi.fn>, shows: HebrewTheaterShow[]) {
	fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
		const url = input.toString();

		if (url.includes('/api/shows/')) {
			return Response.json(shows);
		}

		if (url.includes('/api/chairmap') && url.includes('show_theater=10950')) {
			return new Response(
				'<div class="theater" data-area-id="69" data-area-type-key="marked" data-area-name="\u05d0\u05d6\u05d5\u05e8 \u05d7\u05d3\u05e9"><a class="chair empty" data-row="3" data-status="empty"></a></div>'
			);
		}

		if (url.includes('/api/chairmap') && url.includes('show_theater=10872')) {
			return new Response(
				'<div class="theater" data-area-id="69" data-area-type-key="marked" data-area-name="\u05d0\u05d6\u05d5\u05e8 \u05d7\u05d3\u05e9"><a class="chair empty" data-row="4" data-status="empty"></a></div>'
			);
		}

		return new Response('', { status: 404 });
	});
}

async function collectHebrewTheaterRawPerformances() {
	return (await import('./collectPerformances')).collectHebrewTheaterRawPerformances();
}

beforeEach(() => {
	vi.resetModules();
	vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('hebrewTheater collectPerformances', () => {
	it('flattens Smarticket shows into schedule entries and fetches chairmaps by event id', async () => {
		const fetchMock = vi.fn();
		mockFetchByUrl(fetchMock, [
			createShow([
				createEvent({ id: 10872, show_date: '2026-04-20', show_time: '20:30:00' }),
				createEvent({ id: 10950, show_date: '2026-04-18', show_time: '21:00:00' })
			])
		]);
		vi.stubGlobal('fetch', fetchMock);

		const result = await collectHebrewTheaterRawPerformances();

		expect(result.entries.map(entry => entry.eventId)).toEqual(['10950', '10872']);
		expect(result.entries[0]).toMatchObject({
			id: 'hebrew-theater-10950',
			showName: '\u05e2\u05e4\u05e8\u05d4 - \u05e4\u05ea\u05d7 \u05ea\u05e7\u05d5\u05d5\u05d4',
			date: '2026-04-18',
			time: '21:00',
			purchaseUrl:
				'https://thehebrewtheater.smarticket.co.il/%D7%A2%D7%A4%D7%A8%D7%94_-_%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%97%D7%95%D7%A5/?id=10950',
			ticketsAvailable: true,
			leftTicketsCount: 8
		});
		expect(result.availabilityResults).toHaveLength(2);
		expect(result.availabilityResults.find(item => item.eventId === '10950')).toMatchObject({
			parsedAvailability: expect.objectContaining({
				availableInPreferredRows: true,
				matchedRows: ['3'],
				sourceStatus: 'smarticket-chairmap:data-row:data-status | venue-sections:main-hall-only'
			}),
			sourceStatus: 'smarticket-chairmap:ok',
			errors: []
		});
		expect(fetchMock).toHaveBeenCalledWith(
			expect.objectContaining({ href: expect.stringContaining('show_theater=10950') }),
			{
				cache: 'no-store',
				headers: expect.any(Object)
			}
		);
	});

	it('reuses successful Smarticket chairmap results from cache within the TTL', async () => {
		const fetchMock = vi.fn();
		mockFetchByUrl(fetchMock, [createShow([createEvent({ id: 10950 })])]);
		vi.stubGlobal('fetch', fetchMock);

		const firstResult = await collectHebrewTheaterRawPerformances();
		const secondResult = await collectHebrewTheaterRawPerformances();
		const chairmapCalls = fetchMock.mock.calls.filter(([input]) => input.toString().includes('/api/chairmap'));

		expect(chairmapCalls).toHaveLength(1);
		expect(firstResult.availabilityResults).toEqual(secondResult.availabilityResults);
		expect(firstResult.availabilityResults[0]).toMatchObject({
			eventId: '10950',
			parsedAvailability: expect.objectContaining({
				availableInPreferredRows: true,
				matchedRows: ['3'],
				sourceStatus: 'smarticket-chairmap:data-row:data-status | venue-sections:main-hall-only'
			}),
			sourceStatus: 'smarticket-chairmap:ok',
			errors: []
		});
		expect(firstResult.availabilityResults[0]).not.toHaveProperty('html');
	});

	it('stores parsed Smarticket chairmap results without retaining large raw HTML', async () => {
		const largeChairmapHtml = `<div class="theater" data-area-id="69" data-area-type-key="marked" data-area-name="\u05d0\u05d6\u05d5\u05e8 \u05d7\u05d3\u05e9">
			<a class="chair empty" data-area="69" data-chair="1" data-row="3" data-status="empty"></a>
		</div>${' '.repeat(2_200_000)}`;
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = input.toString();

			if (url.includes('/api/shows/')) {
				return Response.json([createShow([createEvent({ id: 10950 })])]);
			}

			return new Response(largeChairmapHtml);
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await collectHebrewTheaterRawPerformances();

		expect(result.availabilityResults[0]).toMatchObject({
			eventId: '10950',
			parsedAvailability: expect.objectContaining({
				availableInPreferredRows: true,
				matchedRows: ['3'],
				availableSeatCount: 1
			}),
			sourceStatus: 'smarticket-chairmap:ok',
			errors: []
		});
		expect(result.availabilityResults[0]).not.toHaveProperty('html');
		expect(JSON.stringify(result.availabilityResults[0]).length).toBeLessThan(2000);
	});

	it('reuses failed Smarticket chairmap results from cache within the TTL', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = input.toString();

			if (url.includes('/api/shows/')) {
				return Response.json([createShow([createEvent({ id: 10950 })])]);
			}

			return new Response('', { status: 500 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const firstResult = await collectHebrewTheaterRawPerformances();
		const secondResult = await collectHebrewTheaterRawPerformances();
		const chairmapCalls = fetchMock.mock.calls.filter(([input]) => input.toString().includes('/api/chairmap'));

		expect(chairmapCalls).toHaveLength(1);
		expect(firstResult.availabilityResults).toEqual(secondResult.availabilityResults);
		expect(secondResult.availabilityResults[0]).toMatchObject({
			eventId: '10950',
			sourceStatus: 'smarticket-chairmap:500',
			errors: ['Failed to fetch Hebrew Theater chairmap 10950: 500']
		});
		expect(secondResult.availabilityResults[0]).not.toHaveProperty('html');
	});

	it('keeps Smarticket chairmap cache entries event-specific', async () => {
		const fetchMock = vi.fn();
		mockFetchByUrl(fetchMock, [
			createShow([createEvent({ id: 10950 }), createEvent({ id: 10872, show_date: '2026-04-20', show_time: '20:30:00' })])
		]);
		vi.stubGlobal('fetch', fetchMock);

		const firstResult = await collectHebrewTheaterRawPerformances();
		const secondResult = await collectHebrewTheaterRawPerformances();
		const chairmapCalls = fetchMock.mock.calls
			.map(([input]) => input.toString())
			.filter(url => url.includes('/api/chairmap'));

		expect(chairmapCalls).toHaveLength(2);
		expect(chairmapCalls.some(url => url.includes('show_theater=10950'))).toBe(true);
		expect(chairmapCalls.some(url => url.includes('show_theater=10872'))).toBe(true);
		expect(firstResult.availabilityResults.map(result => result.eventId)).toEqual(['10950', '10872']);
		expect(secondResult.availabilityResults.map(result => result.eventId)).toEqual(['10950', '10872']);
		expect(firstResult.availabilityResults.find(result => result.eventId === '10950')?.html).toBe(undefined);
		expect(firstResult.availabilityResults.find(result => result.eventId === '10872')?.html).toBe(undefined);
		expect(
			firstResult.availabilityResults.find(result => result.eventId === '10950')?.parsedAvailability?.matchedRows
		).toEqual(['3']);
		expect(
			firstResult.availabilityResults.find(result => result.eventId === '10872')?.parsedAvailability?.matchedRows
		).toEqual(['4']);
	});

	it('skips malformed Smarticket event records before chairmap lookup', async () => {
		const fetchMock = vi.fn();
		mockFetchByUrl(fetchMock, [
			createShow([
				createEvent({ id: undefined }),
				createEvent({ id: 10950, show_date: undefined }),
				createEvent({ id: 10872, show_time: undefined }),
				createEvent({ id: 10950 })
			])
		]);
		vi.stubGlobal('fetch', fetchMock);

		const result = await collectHebrewTheaterRawPerformances();

		expect(result.entries.map(entry => entry.eventId)).toEqual(['10950']);
		expect(result.availabilityResults.map(item => item.eventId)).toEqual(['10950']);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('deduplicates repeated Smarticket event ids before fetching chairmaps', async () => {
		const fetchMock = vi.fn();
		mockFetchByUrl(fetchMock, [
			createShow([createEvent({ id: 10950 })]),
			createShow([createEvent({ id: 10950, title: '\u05db\u05e4\u05d5\u05dc', show_time: '22:00:00' })])
		]);
		vi.stubGlobal('fetch', fetchMock);

		const result = await collectHebrewTheaterRawPerformances();

		expect(result.entries.map(entry => entry.eventId)).toEqual(['10950']);
		expect(result.availabilityResults.map(item => item.eventId)).toEqual(['10950']);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('limits concurrent Smarticket chairmap fetches', async () => {
		let activeChairmapFetches = 0;
		let maxActiveChairmapFetches = 0;
		const eventIds = [10950, 10951, 10952, 10953, 10954];
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = input.toString();

			if (url.includes('/api/shows/')) {
				return Response.json([createShow(eventIds.map(id => createEvent({ id })))]);
			}

			activeChairmapFetches += 1;
			maxActiveChairmapFetches = Math.max(maxActiveChairmapFetches, activeChairmapFetches);
			await new Promise(resolve => setTimeout(resolve, 10));
			activeChairmapFetches -= 1;

			return new Response('<a class="chair empty" data-row="3" data-status="empty"></a>');
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await collectHebrewTheaterRawPerformances();

		expect(result.entries.map(entry => entry.eventId)).toEqual(eventIds.map(String));
		expect(result.availabilityResults).toHaveLength(eventIds.length);
		expect(maxActiveChairmapFetches).toBe(3);
	});

	it('keeps valid entries when one Smarticket chairmap request fails closed', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = input.toString();

			if (url.includes('/api/shows/')) {
				return Response.json([
					createShow([createEvent({ id: 10950 }), createEvent({ id: 10872, show_date: '2026-04-20' })])
				]);
			}

			if (url.includes('show_theater=10950')) {
				return new Response('', { status: 500 });
			}

			return new Response('<a class="chair empty" data-row="4" data-status="empty"></a>');
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await collectHebrewTheaterRawPerformances();

		expect(result.entries.map(entry => entry.eventId)).toEqual(['10950', '10872']);
		expect(result.availabilityResults).toEqual([
			expect.objectContaining({
				eventId: '10950',
				sourceStatus: 'smarticket-chairmap:500',
				errors: ['Failed to fetch Hebrew Theater chairmap 10950: 500']
			}),
			expect.objectContaining({
				eventId: '10872',
				sourceStatus: 'smarticket-chairmap:ok',
				errors: []
			})
		]);
	});

	it('fails closed when Smarticket show discovery fails', async () => {
		const fetchMock = vi.fn(async () => new Response('', { status: 503 }));
		vi.stubGlobal('fetch', fetchMock);

		const result = await collectHebrewTheaterRawPerformances();

		expect(result).toMatchObject({
			entries: [],
			availabilityResults: [],
			showsCount: 0,
			eventsCount: 0,
			availabilityDurationMs: 0
		});
	});
});
