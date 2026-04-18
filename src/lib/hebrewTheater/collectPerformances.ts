import 'server-only';

import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import {
	HebrewTheaterEvent,
	HebrewTheaterScheduleEntry,
	HebrewTheaterSeatAvailabilityFetchResult,
	HebrewTheaterShow
} from './types';

const SMARTICKET_BASE_URL = 'https://thehebrewtheater.smarticket.co.il';
const HEBREW_THEATER_SHOWS_URL = `${SMARTICKET_BASE_URL}/api/shows/?visible=1`;
const HEBREW_THEATER_CHAIRMAP_URL = `${SMARTICKET_BASE_URL}/api/chairmap`;
const HEBREW_THEATER_SEAT_FETCH_CONCURRENCY = 6;

const DEFAULT_HEADERS = {
	accept: 'application/json,text/html,*/*;q=0.8',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

// Smarticket discovery, verified from the public Hebrew Theater frontend:
// - api/shows/?visible=1 returns the show list with nested event instances.
// - api/show_theater/get_events_calendar exposes the same visible instances for the calendar UI.
// - api/chairmap?show_theater=<eventId> returns rendered seat-map markup with data-row/data-status attributes.
export type HebrewTheaterCollectionResult = {
	entries: HebrewTheaterScheduleEntry[];
	availabilityResults: HebrewTheaterSeatAvailabilityFetchResult[];
	showsCount: number;
	eventsCount: number;
	discoveryDurationMs: number;
	availabilityDurationMs: number;
};

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let nextIndex = 0;

	async function worker() {
		while (nextIndex < items.length) {
			const currentIndex = nextIndex++;
			results[currentIndex] = await mapper(items[currentIndex]);
		}
	}

	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));

	return results;
}

function buildPurchaseUrl(event: HebrewTheaterEvent): string {
	if (event.permalink) {
		return new URL(event.permalink, SMARTICKET_BASE_URL).toString();
	}

	return `${SMARTICKET_BASE_URL}/event/${event.id}`;
}

function toBoolean(value: boolean | number | undefined): boolean {
	return value === true || value === 1;
}

function getLeftTicketsCount(event: HebrewTheaterEvent): number | undefined {
	return event.website_left_tickets_count ?? event.website_all_left_tickets_count;
}

function mapEventToEntry(show: HebrewTheaterShow, event: HebrewTheaterEvent): HebrewTheaterScheduleEntry | null {
	const eventId = event.id?.toString();
	const date = event.show_date ?? event.start_date;
	const time = event.show_time ?? event.start_time;

	if (!eventId || !date || !time) {
		return null;
	}

	return {
		id: `hebrew-theater-${eventId}`,
		eventId,
		showName: event.title || event.name || show.title || `Hebrew Theater ${eventId}`,
		date,
		time: time.slice(0, 5),
		venue: event.event_place,
		purchaseUrl: buildPurchaseUrl(event),
		sourceStatus: 'smarticket:api/shows',
		ticketsAvailable: event.tickets_available ?? toBoolean(event.website_available),
		leftTicketsCount: getLeftTicketsCount(event),
		ticketSaleStart: event.website_visibility_start,
		ticketSaleStop: event.website_visibility_end
	};
}

function flattenScheduleEntries(shows: HebrewTheaterShow[]): HebrewTheaterScheduleEntry[] {
	const entries: HebrewTheaterScheduleEntry[] = [];
	const seenEventIds = new Set<string>();

	for (const show of shows) {
		for (const event of show.events ?? []) {
			const entry = mapEventToEntry(show, event);

			if (!entry || seenEventIds.has(entry.eventId)) {
				continue;
			}

			seenEventIds.add(entry.eventId);
			entries.push(entry);
		}
	}

	return entries.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}

async function fetchHebrewTheaterShows(): Promise<HebrewTheaterShow[]> {
	const startedAt = Date.now();
	const response = await fetch(HEBREW_THEATER_SHOWS_URL, {
		headers: DEFAULT_HEADERS,
		next: { revalidate: 600, tags: ['theater', 'theater:hebrew-theater'] }
	});

	logTheaterFetch({ source: 'hebrewTheater.shows', durationMs: getDurationMs(startedAt), status: response.status });

	if (!response.ok) {
		throw new Error(`Failed to fetch Hebrew Theater shows: ${response.status}`);
	}

	return response.json();
}

async function fetchHebrewTheaterSeatAvailability(
	entry: HebrewTheaterScheduleEntry
): Promise<HebrewTheaterSeatAvailabilityFetchResult> {
	const url = new URL(HEBREW_THEATER_CHAIRMAP_URL);
	url.searchParams.set('show_theater', entry.eventId);
	const startedAt = Date.now();

	try {
		const response = await fetch(url, {
			headers: {
				...DEFAULT_HEADERS,
				accept: 'text/html,*/*;q=0.8'
			},
			next: { revalidate: 300, tags: ['theater', 'theater:hebrew-theater'] }
		});

		logTheaterFetch({
			source: 'hebrewTheater.chairmap',
			durationMs: getDurationMs(startedAt),
			status: response.status
		});

		if (!response.ok) {
			return {
				eventId: entry.eventId,
				html: '',
				sourceStatus: `smarticket-chairmap:${response.status}`,
				errors: [`Failed to fetch Hebrew Theater chairmap ${entry.eventId}: ${response.status}`]
			};
		}

		return {
			eventId: entry.eventId,
			html: await response.text(),
			sourceStatus: 'smarticket-chairmap:ok',
			errors: []
		};
	} catch (error) {
		logTheaterFetch({ source: 'hebrewTheater.chairmap', durationMs: getDurationMs(startedAt), status: 'error' });

		return {
			eventId: entry.eventId,
			html: '',
			sourceStatus: 'smarticket-chairmap:error',
			errors: [error instanceof Error ? error.message : 'Unknown Hebrew Theater chairmap error']
		};
	}
}

export async function collectHebrewTheaterRawPerformances(): Promise<HebrewTheaterCollectionResult> {
	const discoveryStartedAt = Date.now();

	try {
		const shows = await fetchHebrewTheaterShows();
		const entries = flattenScheduleEntries(shows);
		const discoveryDurationMs = getDurationMs(discoveryStartedAt);
		const availabilityStartedAt = Date.now();
		const availabilityResults = await mapWithConcurrency(
			entries,
			HEBREW_THEATER_SEAT_FETCH_CONCURRENCY,
			fetchHebrewTheaterSeatAvailability
		);
		const availabilityDurationMs = getDurationMs(availabilityStartedAt);

		console.info('[hebrew-theater-discovery]', {
			showsCount: shows.length,
			eventsCount: entries.length,
			discoveryDurationMs,
			availabilityDurationMs
		});

		return {
			entries,
			availabilityResults,
			showsCount: shows.length,
			eventsCount: entries.length,
			discoveryDurationMs,
			availabilityDurationMs
		};
	} catch (error) {
		console.info('[hebrew-theater-discovery]', {
			showsCount: 0,
			eventsCount: 0,
			error: error instanceof Error ? error.message : 'Unknown Hebrew Theater discovery error'
		});

		return {
			entries: [],
			availabilityResults: [],
			showsCount: 0,
			eventsCount: 0,
			discoveryDurationMs: getDurationMs(discoveryStartedAt),
			availabilityDurationMs: 0
		};
	}
}
