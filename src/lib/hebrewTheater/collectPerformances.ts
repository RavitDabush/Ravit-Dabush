import 'server-only';

import { unstable_cache } from 'next/cache';
import { getTheaterCacheTags } from '@/lib/theater/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import {
	HebrewTheaterEvent,
	HebrewTheaterScheduleEntry,
	HebrewTheaterSeatAvailabilityFetchResult,
	HebrewTheaterShow
} from './types';
import { parseHebrewTheaterSeatAvailability } from './parseSeatAvailability';

const SMARTICKET_BASE_URL = 'https://thehebrewtheater.smarticket.co.il';
const HEBREW_THEATER_SHOWS_URL = `${SMARTICKET_BASE_URL}/api/shows/?visible=1`;
const HEBREW_THEATER_CHAIRMAP_URL = `${SMARTICKET_BASE_URL}/api/chairmap`;
const HEBREW_THEATER_SEAT_FETCH_CONCURRENCY = 3;
const HEBREW_THEATER_DISCOVERY_REVALIDATE_SECONDS = 600;
const HEBREW_THEATER_CHAIRMAP_REVALIDATE_SECONDS = 300;
const HEBREW_THEATER_CACHE_TAGS = getTheaterCacheTags('hebrew-theater');

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
	availabilityFailedCount: number;
	discoveryDurationMs: number;
	availabilityDurationMs: number;
};

type CachedChairmapResult = {
	result: HebrewTheaterSeatAvailabilityFetchResult;
	cacheStoredAtMs: number;
};

type RuntimeChairmapCacheEntry = {
	value: CachedChairmapResult;
	expiresAtMs: number;
};

const runtimeChairmapCache = new Map<string, RuntimeChairmapCacheEntry>();

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
		next: { revalidate: HEBREW_THEATER_DISCOVERY_REVALIDATE_SECONDS, tags: HEBREW_THEATER_CACHE_TAGS }
	});

	logTheaterFetch({ source: 'hebrewTheater.shows', durationMs: getDurationMs(startedAt), status: response.status });

	if (!response.ok) {
		throw new Error(`Failed to fetch Hebrew Theater shows: ${response.status}`);
	}

	return response.json();
}

async function fetchHebrewTheaterSeatAvailabilityByEventId(
	eventId: string
): Promise<HebrewTheaterSeatAvailabilityFetchResult> {
	const url = new URL(HEBREW_THEATER_CHAIRMAP_URL);
	url.searchParams.set('show_theater', eventId);
	const startedAt = Date.now();

	try {
		const response = await fetch(url, {
			headers: {
				...DEFAULT_HEADERS,
				accept: 'text/html,*/*;q=0.8'
			},
			cache: 'no-store'
		});

		logTheaterFetch({
			source: 'hebrewTheater.chairmap',
			durationMs: getDurationMs(startedAt),
			status: response.status
		});

		if (!response.ok) {
			return {
				eventId,
				sourceStatus: `smarticket-chairmap:${response.status}`,
				errors: [`Failed to fetch Hebrew Theater chairmap ${eventId}: ${response.status}`]
			};
		}

		return {
			eventId,
			parsedAvailability: parseHebrewTheaterSeatAvailability(await response.text()),
			sourceStatus: 'smarticket-chairmap:ok',
			errors: []
		};
	} catch (error) {
		logTheaterFetch({ source: 'hebrewTheater.chairmap', durationMs: getDurationMs(startedAt), status: 'error' });

		return {
			eventId,
			sourceStatus: 'smarticket-chairmap:error',
			errors: [error instanceof Error ? error.message : 'Unknown Hebrew Theater chairmap error']
		};
	}
}

const fetchCachedHebrewTheaterSeatAvailabilityByEventId = unstable_cache(
	async (eventId: string): Promise<CachedChairmapResult> => ({
		result: await fetchHebrewTheaterSeatAvailabilityByEventId(eventId),
		cacheStoredAtMs: Date.now()
	}),
	['theater', 'hebrew-theater', 'chairmap-result', 'v1'],
	{ revalidate: HEBREW_THEATER_CHAIRMAP_REVALIDATE_SECONDS, tags: HEBREW_THEATER_CACHE_TAGS }
);

async function getCachedHebrewTheaterSeatAvailability(
	eventId: string
): Promise<HebrewTheaterSeatAvailabilityFetchResult> {
	const now = Date.now();
	const runtimeCacheEntry = runtimeChairmapCache.get(eventId);

	if (runtimeCacheEntry && runtimeCacheEntry.expiresAtMs > now) {
		return runtimeCacheEntry.value.result;
	}

	if (runtimeCacheEntry) {
		runtimeChairmapCache.delete(eventId);
	}

	const value = await fetchCachedHebrewTheaterSeatAvailabilityByEventId(eventId);

	runtimeChairmapCache.set(eventId, {
		value,
		expiresAtMs: now + HEBREW_THEATER_CHAIRMAP_REVALIDATE_SECONDS * 1000
	});

	return value.result;
}

async function fetchHebrewTheaterSeatAvailability(
	entry: HebrewTheaterScheduleEntry
): Promise<HebrewTheaterSeatAvailabilityFetchResult> {
	return getCachedHebrewTheaterSeatAvailability(entry.eventId);
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
		const availabilityFailedCount = availabilityResults.filter(result => result.errors.length > 0).length;

		console.info('[hebrew-theater-discovery]', {
			showsCount: shows.length,
			eventsCount: entries.length,
			rawPerformancesDiscoveredCount: entries.length,
			relevantPerformancesCount: entries.length,
			availabilityCheckedCount: availabilityResults.length,
			availabilityFailedCount,
			discoveryDurationMs,
			availabilityDurationMs
		});

		return {
			entries,
			availabilityResults,
			showsCount: shows.length,
			eventsCount: entries.length,
			availabilityFailedCount,
			discoveryDurationMs,
			availabilityDurationMs
		};
	} catch (error) {
		const discoveryDurationMs = getDurationMs(discoveryStartedAt);

		console.info('[hebrew-theater-discovery]', {
			showsCount: 0,
			eventsCount: 0,
			rawPerformancesDiscoveredCount: 0,
			relevantPerformancesCount: 0,
			availabilityCheckedCount: 0,
			availabilityFailedCount: 0,
			discoveryDurationMs,
			availabilityDurationMs: 0,
			error: error instanceof Error ? error.message : 'Unknown Hebrew Theater discovery error'
		});

		return {
			entries: [],
			availabilityResults: [],
			showsCount: 0,
			eventsCount: 0,
			availabilityFailedCount: 0,
			discoveryDurationMs,
			availabilityDurationMs: 0
		};
	}
}
