import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectHebrewTheaterRawPerformances } from './collectPerformances';
import type { HebrewTheaterShow } from './types';

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
			return new Response('<a class="chair empty" data-row="3" data-status="empty"></a>');
		}

		if (url.includes('/api/chairmap') && url.includes('show_theater=10872')) {
			return new Response('<a class="chair empty" data-row="4" data-status="empty"></a>');
		}

		return new Response('', { status: 404 });
	});
}

beforeEach(() => {
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
			html: '<a class="chair empty" data-row="3" data-status="empty"></a>',
			sourceStatus: 'smarticket-chairmap:ok',
			errors: []
		});
		expect(fetchMock).toHaveBeenCalledWith(
			expect.objectContaining({ href: expect.stringContaining('show_theater=10950') }),
			{
				headers: expect.any(Object),
				next: expect.any(Object)
			}
		);
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
				html: '',
				sourceStatus: 'smarticket-chairmap:500',
				errors: ['Failed to fetch Hebrew Theater chairmap 10950: 500']
			}),
			expect.objectContaining({
				eventId: '10872',
				html: '<a class="chair empty" data-row="4" data-status="empty"></a>',
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
