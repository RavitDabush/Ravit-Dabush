import 'server-only';

import { unstable_cache } from 'next/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import { TomixEventerSeat, TomixScheduleEntry, TomixSeatAvailabilityFetchResult } from './types';

const EVENTER_SEATS_BASE_URL = 'https://www.eventer.co.il/arenas';
const DEFAULT_TOMIX_AVAILABILITY_CONCURRENCY_LIMIT = 8;
const TOMIX_AVAILABILITY_CACHE_REVALIDATE_SECONDS = 300;
const TOMIX_AVAILABILITY_CACHE_TAG = 'theater:tomix:availability';
const TOMIX_AVAILABILITY_CACHE_TAGS = [TOMIX_AVAILABILITY_CACHE_TAG];
const SLOW_ITEM_LOG_LIMIT = 5;

const DEFAULT_HEADERS = {
	accept: 'application/json,*/*;q=0.8',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
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

type AvailabilityItemTiming = {
	eventId: string;
	performanceId: string;
	durationMs: number;
	errorsCount: number;
	cacheHit: boolean;
};

type CachedAvailabilityResult = {
	result: TomixSeatAvailabilityFetchResult;
	cacheStoredAtMs: number;
};

type RuntimeAvailabilityCacheEntry = {
	value: CachedAvailabilityResult;
	expiresAtMs: number;
};

const runtimeAvailabilityCache = new Map<string, RuntimeAvailabilityCacheEntry>();

function getDuplicateEventIds(entries: TomixScheduleEntry[]): string[] {
	const counts = new Map<string, number>();

	for (const entry of entries) {
		counts.set(entry.eventId, (counts.get(entry.eventId) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.filter(([, count]) => count > 1)
		.map(([eventId]) => eventId);
}

function getAverageDurationMs(itemTimings: AvailabilityItemTiming[]): number {
	if (itemTimings.length === 0) {
		return 0;
	}

	const totalDurationMs = itemTimings.reduce((sum, timing) => sum + timing.durationMs, 0);

	return Math.round(totalDurationMs / itemTimings.length);
}

function getMaxItemTiming(itemTimings: AvailabilityItemTiming[]): AvailabilityItemTiming | null {
	return itemTimings.reduce<AvailabilityItemTiming | null>((maxTiming, timing) => {
		if (!maxTiming || timing.durationMs > maxTiming.durationMs) {
			return timing;
		}

		return maxTiming;
	}, null);
}

function logDetailedAvailabilityItems(itemTimings: AvailabilityItemTiming[]): void {
	if (process.env.NODE_ENV !== 'development') {
		return;
	}

	const maxItemTiming = getMaxItemTiming(itemTimings);
	const failedItemTimings = itemTimings.filter(timing => timing.errorsCount > 0).slice(0, SLOW_ITEM_LOG_LIMIT);

	if (maxItemTiming) {
		console.info('[tomix-availability-item]', {
			reason: 'max_duration',
			...maxItemTiming
		});
	}

	for (const timing of failedItemTimings) {
		console.info('[tomix-availability-item]', {
			reason: 'failed',
			...timing
		});
	}
}

async function fetchTomixSeatAvailabilityByEventId(eventId: string): Promise<TomixSeatAvailabilityFetchResult> {
	const errors: string[] = [];
	const startedAt = Date.now();

	try {
		const response = await fetch(`${EVENTER_SEATS_BASE_URL}/${eventId}/seats.js`, {
			headers: DEFAULT_HEADERS,
			next: {
				revalidate: TOMIX_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
				tags: TOMIX_AVAILABILITY_CACHE_TAGS
			}
		});
		logTheaterFetch({ source: 'tomix.eventerSeats', durationMs: getDurationMs(startedAt), status: response.status });

		if (!response.ok) {
			return {
				eventId,
				seats: [],
				sourceStatus: `eventer-seats:${response.status}`,
				errors: [`Failed to fetch TOMIX Eventer seats ${eventId}: ${response.status}`]
			};
		}

		return {
			eventId,
			seats: (await response.json()) as TomixEventerSeat[],
			sourceStatus: 'eventer-seats:ok',
			errors
		};
	} catch (error) {
		logTheaterFetch({ source: 'tomix.eventerSeats', durationMs: getDurationMs(startedAt), status: 'error' });
		errors.push(error instanceof Error ? error.message : 'Unknown TOMIX seat availability error');

		return {
			eventId,
			seats: [],
			sourceStatus: 'eventer-seats:error',
			errors
		};
	}
}

const fetchCachedTomixSeatAvailabilityByEventId = unstable_cache(
	async (eventId: string): Promise<CachedAvailabilityResult> => ({
		result: await fetchTomixSeatAvailabilityByEventId(eventId),
		cacheStoredAtMs: Date.now()
	}),
	['theater', 'tomix', 'availability-result', 'v1'],
	{ revalidate: TOMIX_AVAILABILITY_CACHE_REVALIDATE_SECONDS, tags: TOMIX_AVAILABILITY_CACHE_TAGS }
);

async function getCachedTomixSeatAvailability(eventId: string): Promise<CachedAvailabilityResult> {
	const now = Date.now();
	const runtimeCacheEntry = runtimeAvailabilityCache.get(eventId);

	if (runtimeCacheEntry && runtimeCacheEntry.expiresAtMs > now) {
		return runtimeCacheEntry.value;
	}

	if (runtimeCacheEntry) {
		runtimeAvailabilityCache.delete(eventId);
	}

	const value = await fetchCachedTomixSeatAvailabilityByEventId(eventId);

	runtimeAvailabilityCache.set(eventId, {
		value,
		expiresAtMs: now + TOMIX_AVAILABILITY_CACHE_REVALIDATE_SECONDS * 1000
	});

	return value;
}

export async function fetchTomixSeatAvailability(eventId: string): Promise<TomixSeatAvailabilityFetchResult> {
	return (await getCachedTomixSeatAvailability(eventId)).result;
}

export async function fetchTomixSeatAvailabilityBatch(
	entries: TomixScheduleEntry[],
	concurrencyLimit: number = DEFAULT_TOMIX_AVAILABILITY_CONCURRENCY_LIMIT
): Promise<TomixSeatAvailabilityFetchResult[]> {
	const startedAt = Date.now();
	const itemTimings: AvailabilityItemTiming[] = [];
	const duplicateEventIds = getDuplicateEventIds(entries);

	if (duplicateEventIds.length > 0) {
		console.info('[tomix-availability-duplicates]', {
			duplicateCount: duplicateEventIds.length,
			eventIds: duplicateEventIds
		});
	}

	const results = await mapWithConcurrency(entries, concurrencyLimit, async entry => {
		const itemStartedAt = Date.now();
		const cachedResult = await getCachedTomixSeatAvailability(entry.eventId);
		const cacheHit = cachedResult.cacheStoredAtMs <= startedAt;

		itemTimings.push({
			eventId: entry.eventId,
			performanceId: entry.id,
			durationMs: getDurationMs(itemStartedAt),
			errorsCount: cachedResult.result.errors.length,
			cacheHit
		});

		return cachedResult.result;
	});
	const durationMs = getDurationMs(startedAt);
	const failedCount = results.filter(result => result.errors.length > 0).length;
	const skippedCount = results.filter(result => result.seats.length === 0).length;
	const cacheHitCount = itemTimings.filter(timing => timing.cacheHit).length;
	const cacheMissCount = itemTimings.length - cacheHitCount;
	const maxItemTiming = getMaxItemTiming(itemTimings);

	logTheaterFetch({ source: 'tomix.seatAvailabilityBatch', durationMs });
	console.info('[tomix-availability-cache]', {
		requestedCount: entries.length,
		cacheHitCount,
		cacheMissCount,
		failureCount: failedCount,
		durationMs,
		concurrencyLimit,
		revalidateSeconds: TOMIX_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
		runtimeCacheSize: runtimeAvailabilityCache.size
	});
	console.info('[tomix-availability-summary]', {
		requestedCount: entries.length,
		succeededCount: results.length - failedCount,
		failedCount,
		skippedCount,
		durationMs,
		averageItemDurationMs: getAverageDurationMs(itemTimings),
		maxItemDurationMs: maxItemTiming?.durationMs ?? 0,
		duplicatePerformanceCount: duplicateEventIds.length,
		cacheHitCount,
		cacheMissCount
	});
	logDetailedAvailabilityItems(itemTimings);

	return results;
}
