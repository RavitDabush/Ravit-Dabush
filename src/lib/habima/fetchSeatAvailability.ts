import 'server-only';

import { unstable_cache } from 'next/cache';
import { getTheaterCacheTags } from '@/lib/theater/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import {
	HabimaPresentationResponse,
	HabimaScheduleEntry,
	HabimaSeatAvailabilityFetchResult,
	HabimaSeatStatusResponse,
	HabimaSeatplanResponse
} from './types';

const TICKETS_BASE_URL = 'https://tickets.habima.co.il';
const DEFAULT_REVALIDATE_SECONDS = 180;
const DEFAULT_HABIMA_AVAILABILITY_CONCURRENCY_LIMIT = 4;
const HABIMA_AVAILABILITY_CACHE_REVALIDATE_SECONDS = 300;
const HABIMA_AVAILABILITY_CACHE_TAG = 'theater:habima:availability';
const HABIMA_AVAILABILITY_CACHE_TAGS = [HABIMA_AVAILABILITY_CACHE_TAG];
const SLOW_ITEM_LOG_LIMIT = 5;
const SKIPPED_SAMPLE_LIMIT = 10;
const SKIPPED_SOURCE_STATUSES = new Set(['soldout', 'isGA', 'missing_seatplan']);

const DEFAULT_HEADERS = {
	accept: 'application/json, text/plain, */*',
	'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

function getJsonInit(extraHeaders?: HeadersInit): RequestInit {
	return {
		headers: {
			...DEFAULT_HEADERS,
			...extraHeaders
		},
		next: { revalidate: DEFAULT_REVALIDATE_SECONDS, tags: getTheaterCacheTags('habima') }
	};
}

function getAvailabilityJsonInit(extraHeaders?: HeadersInit): RequestInit {
	return {
		headers: {
			...DEFAULT_HEADERS,
			...extraHeaders
		},
		next: {
			revalidate: HABIMA_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
			tags: HABIMA_AVAILABILITY_CACHE_TAGS
		}
	};
}

async function fetchOrderPage(presentationId: string, useAvailabilityCacheTags: boolean = false): Promise<string> {
	const response = await fetch(`${TICKETS_BASE_URL}/order/${presentationId}`, {
		headers: DEFAULT_HEADERS,
		next: useAvailabilityCacheTags
			? {
					revalidate: HABIMA_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
					tags: HABIMA_AVAILABILITY_CACHE_TAGS
				}
			: { revalidate: DEFAULT_REVALIDATE_SECONDS, tags: getTheaterCacheTags('habima') }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Habima order page for ${presentationId}: ${response.status}`);
	}

	return response.text();
}

function extractUuid(orderHtml: string): string | null {
	return orderHtml.match(/auth:\{uuid:"([^"]+)"/)?.[1] ?? orderHtml.match(/"uuid":"([^"]+)"/)?.[1] ?? null;
}

async function fetchPresentation(
	presentationId: string,
	useAvailabilityCacheTags: boolean = false
): Promise<HabimaPresentationResponse> {
	const response = await fetch(
		`${TICKETS_BASE_URL}/api/presentations/${presentationId}`,
		useAvailabilityCacheTags ? getAvailabilityJsonInit() : getJsonInit()
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch Habima presentation ${presentationId}: ${response.status}`);
	}

	return response.json();
}

export async function fetchPresentationMetadata(presentationId: string): Promise<HabimaPresentationResponse> {
	return fetchPresentation(presentationId);
}

async function fetchSeatplan(
	venueId: number,
	seatplanId: number,
	useAvailabilityCacheTags: boolean = false
): Promise<HabimaSeatplanResponse> {
	const response = await fetch(`${TICKETS_BASE_URL}/api/seats/seatplanV2?venueId=${venueId}&seatplanId=${seatplanId}`, {
		method: 'POST',
		headers: {
			...DEFAULT_HEADERS,
			'content-type': 'application/json'
		},
		body: '{}',
		next: useAvailabilityCacheTags
			? {
					revalidate: HABIMA_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
					tags: HABIMA_AVAILABILITY_CACHE_TAGS
				}
			: { revalidate: 300, tags: getTheaterCacheTags('habima') }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Habima seatplan ${venueId}/${seatplanId}: ${response.status}`);
	}

	return response.json();
}

async function fetchSeatStatus(
	presentationId: string,
	venueTypeId: number,
	isReserved: number,
	uuid: string,
	useAvailabilityCacheTags: boolean = false
): Promise<HabimaSeatStatusResponse> {
	const response = await fetch(
		`${TICKETS_BASE_URL}/api/seats/seats-statusV2?presentationId=${presentationId}&venueTypeId=${venueTypeId}&isReserved=${isReserved}`,
		useAvailabilityCacheTags ? getAvailabilityJsonInit({ uuid }) : getJsonInit({ uuid })
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch Habima seat status ${presentationId}: ${response.status}`);
	}

	return response.json();
}

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
	presentationId: string;
	durationMs: number;
	errorsCount: number;
	cacheHit: boolean;
};

type CachedAvailabilityResult = {
	result: HabimaSeatAvailabilityFetchResult;
	cacheStoredAtMs: number;
};

type RuntimeAvailabilityCacheEntry = {
	valuePromise: Promise<CachedAvailabilityResult>;
	expiresAtMs: number;
};

type SkippedAvailabilitySample = {
	presentationId: string;
	showName: string;
	sourceStatus: string;
};

const runtimeAvailabilityCache = new Map<string, RuntimeAvailabilityCacheEntry>();

function getDuplicatePresentationIds(entries: HabimaScheduleEntry[]): string[] {
	const counts = new Map<string, number>();

	for (const entry of entries) {
		counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.filter(([, count]) => count > 1)
		.map(([presentationId]) => presentationId);
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
		console.info('[habima-availability-item]', {
			reason: 'max_duration',
			...maxItemTiming
		});
	}

	for (const timing of failedItemTimings) {
		console.info('[habima-availability-item]', {
			reason: 'failure',
			...timing
		});
	}
}

function logAvailabilityFailures(itemTimings: AvailabilityItemTiming[]): void {
	if (process.env.NODE_ENV !== 'development') {
		return;
	}

	const failedItemTimings = itemTimings.filter(timing => timing.errorsCount > 0);

	if (failedItemTimings.length === 0) {
		return;
	}

	console.info('[habima-availability-failures]', {
		failureCount: failedItemTimings.length,
		sampleFailed: failedItemTimings.slice(0, SLOW_ITEM_LOG_LIMIT).map(timing => ({
			presentationId: timing.presentationId,
			durationMs: timing.durationMs
		}))
	});
}

function logSkippedAvailabilitySummary(
	entries: HabimaScheduleEntry[],
	results: HabimaSeatAvailabilityFetchResult[]
): void {
	const entryMap = new Map(entries.map(entry => [entry.id, entry]));
	const skippedByStatus: Record<string, number> = {};
	const sampleSkipped: SkippedAvailabilitySample[] = [];

	for (const result of results) {
		if (!result.sourceStatus || !SKIPPED_SOURCE_STATUSES.has(result.sourceStatus)) {
			continue;
		}

		skippedByStatus[result.sourceStatus] = (skippedByStatus[result.sourceStatus] ?? 0) + 1;

		if (sampleSkipped.length < SKIPPED_SAMPLE_LIMIT) {
			sampleSkipped.push({
				presentationId: result.presentationId,
				showName: result.presentation?.featureName || entryMap.get(result.presentationId)?.showName || '',
				sourceStatus: result.sourceStatus
			});
		}
	}

	const skippedCount = Object.values(skippedByStatus).reduce((count, statusCount) => count + statusCount, 0);

	if (skippedCount === 0) {
		return;
	}

	console.info('[habima-availability-skipped]', {
		skippedCount,
		skippedByStatus,
		sampleSkipped
	});
}

async function fetchSeatAvailabilityByPresentationId(
	presentationId: string,
	seatplanCache: Map<string, Promise<HabimaSeatplanResponse>>,
	useAvailabilityCacheTags: boolean = false
): Promise<HabimaSeatAvailabilityFetchResult> {
	const errors: string[] = [];

	try {
		const orderHtml = await fetchOrderPage(presentationId, useAvailabilityCacheTags);
		const uuid = extractUuid(orderHtml);

		if (!uuid) {
			return {
				presentationId,
				uuid: null,
				presentation: null,
				seatplan: null,
				seatStatus: null,
				sourceStatus: 'missing_uuid',
				errors: ['Missing UUID in Habima order page']
			};
		}

		const presentationResponse = await fetchPresentation(presentationId, useAvailabilityCacheTags);
		const presentation = presentationResponse.presentation;

		if (!presentation) {
			return {
				presentationId,
				uuid,
				presentation: null,
				seatplan: null,
				seatStatus: null,
				sourceStatus: 'missing_presentation',
				errors: ['Missing Habima presentation payload']
			};
		}

		if (presentation.soldout) {
			return {
				presentationId,
				uuid,
				presentation,
				seatplan: null,
				seatStatus: null,
				sourceStatus: 'soldout',
				errors
			};
		}

		if (presentation.isGA) {
			return {
				presentationId,
				uuid,
				presentation,
				seatplan: null,
				seatStatus: null,
				sourceStatus: 'isGA',
				errors
			};
		}

		if (!presentation.seatplanId) {
			return {
				presentationId,
				uuid,
				presentation,
				seatplan: null,
				seatStatus: null,
				sourceStatus: 'missing_seatplan',
				errors: ['Missing Habima seatplan metadata']
			};
		}

		const seatplanKey = `${presentation.venueId}:${presentation.seatplanId}`;
		const seatplanPromise =
			seatplanCache.get(seatplanKey) ??
			fetchSeatplan(presentation.venueId, presentation.seatplanId, useAvailabilityCacheTags);

		seatplanCache.set(seatplanKey, seatplanPromise);

		const [seatplan, seatStatus] = await Promise.all([
			seatplanPromise,
			fetchSeatStatus(presentationId, presentation.venueTypeId, presentation.isReserved, uuid, useAvailabilityCacheTags)
		]);

		return {
			presentationId,
			uuid,
			presentation,
			seatplan,
			seatStatus,
			sourceStatus: 'seat_status_available',
			errors
		};
	} catch (error) {
		errors.push(error instanceof Error ? error.message : 'Unknown Habima seat availability error');

		return {
			presentationId,
			uuid: null,
			presentation: null,
			seatplan: null,
			seatStatus: null,
			sourceStatus: 'seat_status_unavailable',
			errors
		};
	}
}

const fetchCachedSeatAvailabilityByPresentationId = unstable_cache(
	async (presentationId: string): Promise<CachedAvailabilityResult> => ({
		result: await fetchSeatAvailabilityByPresentationId(
			presentationId,
			new Map<string, Promise<HabimaSeatplanResponse>>(),
			true
		),
		cacheStoredAtMs: Date.now()
	}),
	['theater', 'habima', 'availability-result', 'v1'],
	{ revalidate: HABIMA_AVAILABILITY_CACHE_REVALIDATE_SECONDS, tags: HABIMA_AVAILABILITY_CACHE_TAGS }
);

async function getCachedSeatAvailability(presentationId: string): Promise<CachedAvailabilityResult> {
	const now = Date.now();
	const runtimeCacheEntry = runtimeAvailabilityCache.get(presentationId);

	if (runtimeCacheEntry && runtimeCacheEntry.expiresAtMs > now) {
		return runtimeCacheEntry.valuePromise;
	}

	if (runtimeCacheEntry) {
		runtimeAvailabilityCache.delete(presentationId);
	}

	const valuePromise = fetchCachedSeatAvailabilityByPresentationId(presentationId);

	runtimeAvailabilityCache.set(presentationId, {
		valuePromise,
		expiresAtMs: now + HABIMA_AVAILABILITY_CACHE_REVALIDATE_SECONDS * 1000
	});

	try {
		return await valuePromise;
	} catch (error) {
		runtimeAvailabilityCache.delete(presentationId);
		throw error;
	}
}

export async function fetchSeatAvailability(
	presentationId: string,
	seatplanCache: Map<string, Promise<HabimaSeatplanResponse>>
): Promise<HabimaSeatAvailabilityFetchResult> {
	return fetchSeatAvailabilityByPresentationId(presentationId, seatplanCache);
}

export async function fetchSeatAvailabilityBatch(
	entries: HabimaScheduleEntry[],
	concurrencyLimit: number = DEFAULT_HABIMA_AVAILABILITY_CONCURRENCY_LIMIT
): Promise<HabimaSeatAvailabilityFetchResult[]> {
	const startedAt = Date.now();
	const itemTimings: AvailabilityItemTiming[] = [];
	const duplicatePresentationIds = getDuplicatePresentationIds(entries);

	if (duplicatePresentationIds.length > 0) {
		console.info('[habima-availability-duplicates]', {
			duplicateCount: duplicatePresentationIds.length,
			presentationIds: duplicatePresentationIds
		});
	}

	const results = await mapWithConcurrency(entries, concurrencyLimit, async entry => {
		const itemStartedAt = Date.now();
		const cachedResult = await getCachedSeatAvailability(entry.id);
		const cacheHit = cachedResult.cacheStoredAtMs < startedAt;

		itemTimings.push({
			presentationId: entry.id,
			durationMs: getDurationMs(itemStartedAt),
			errorsCount: cachedResult.result.errors.length,
			cacheHit
		});

		return cachedResult.result;
	});
	const durationMs = getDurationMs(startedAt);
	const failedCount = results.filter(result => result.errors.length > 0).length;
	const skippedCount = results.filter(result => {
		return result.sourceStatus ? SKIPPED_SOURCE_STATUSES.has(result.sourceStatus) : false;
	}).length;
	const failureCount = failedCount;
	const cacheHitCount = itemTimings.filter(timing => timing.cacheHit).length;
	const cacheMissCount = itemTimings.length - cacheHitCount;
	const maxItemTiming = getMaxItemTiming(itemTimings);

	logTheaterFetch({ source: 'habima.seatAvailabilityBatch', durationMs });
	console.info('[habima-availability-cache]', {
		requestedCount: entries.length,
		cacheHitCount,
		cacheMissCount,
		failureCount,
		durationMs,
		concurrencyLimit,
		revalidateSeconds: HABIMA_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
		runtimeCacheSize: runtimeAvailabilityCache.size
	});
	console.info('[habima-availability-summary]', {
		requestedCount: entries.length,
		succeededCount: results.length - failedCount,
		failedCount,
		skippedCount,
		durationMs,
		averageItemDurationMs: getAverageDurationMs(itemTimings),
		maxItemDurationMs: maxItemTiming?.durationMs ?? 0,
		duplicatePresentationCount: duplicatePresentationIds.length,
		cacheHitCount,
		cacheMissCount
	});
	logSkippedAvailabilitySummary(entries, results);
	logAvailabilityFailures(itemTimings);
	logDetailedAvailabilityItems(itemTimings);

	return results;
}
