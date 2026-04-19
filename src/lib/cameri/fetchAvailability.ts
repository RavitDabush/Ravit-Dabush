import 'server-only';

import { unstable_cache } from 'next/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import {
	CameriPresentation,
	CameriPresentationResponse,
	CameriScheduleEntry,
	CameriSeatAvailabilityFetchResult,
	CameriSeatStatusResponse,
	CameriSeatplanResponse
} from './types';

const CAMERI_TICKETS_BASE_URL = 'https://tickets.cameri.co.il';
const DEFAULT_CAMERI_AVAILABILITY_CONCURRENCY_LIMIT = 4;
const CAMERI_AVAILABILITY_CACHE_REVALIDATE_SECONDS = 300;
const CAMERI_AVAILABILITY_CACHE_TAG = 'theater:cameri:availability';
const CAMERI_AVAILABILITY_CACHE_TAGS = [CAMERI_AVAILABILITY_CACHE_TAG];
const SLOW_ITEM_LOG_LIMIT = 5;
const SKIPPED_SOURCE_STATUSES = new Set(['soldout', 'general_admission', 'presentation_available']);

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
		next: {
			revalidate: CAMERI_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
			tags: CAMERI_AVAILABILITY_CACHE_TAGS
		}
	};
}

async function fetchOrderPage(presentationId: string): Promise<string> {
	const response = await fetch(`${CAMERI_TICKETS_BASE_URL}/order/${presentationId}`, {
		headers: DEFAULT_HEADERS,
		next: {
			revalidate: CAMERI_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
			tags: CAMERI_AVAILABILITY_CACHE_TAGS
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Cameri order page for ${presentationId}: ${response.status}`);
	}

	return response.text();
}

function extractUuid(orderHtml: string): string | null {
	return orderHtml.match(/auth:\{uuid:"([^"]+)"/)?.[1] ?? orderHtml.match(/"uuid":"([^"]+)"/)?.[1] ?? null;
}

async function fetchPresentation(presentationId: string): Promise<CameriPresentationResponse> {
	const response = await fetch(`${CAMERI_TICKETS_BASE_URL}/api/presentations/${presentationId}`, getJsonInit());

	if (!response.ok) {
		throw new Error(`Failed to fetch Cameri presentation ${presentationId}: ${response.status}`);
	}

	return response.json();
}

async function fetchSeatplan(venueId: number, seatplanId: number): Promise<CameriSeatplanResponse> {
	const response = await fetch(
		`${CAMERI_TICKETS_BASE_URL}/api/seats/seatplanV2?venueId=${venueId}&seatplanId=${seatplanId}`,
		{
			method: 'POST',
			headers: {
				...DEFAULT_HEADERS,
				'content-type': 'application/json'
			},
			body: '{}',
			next: {
				revalidate: CAMERI_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
				tags: CAMERI_AVAILABILITY_CACHE_TAGS
			}
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch Cameri seatplan ${venueId}/${seatplanId}: ${response.status}`);
	}

	return response.json();
}

async function fetchSeatStatus(presentation: CameriPresentation, uuid: string): Promise<CameriSeatStatusResponse> {
	const isReserved = presentation.isReserved ? 1 : 0;
	const response = await fetch(
		`${CAMERI_TICKETS_BASE_URL}/api/seats/seats-statusV2?presentationId=${presentation.id}&venueTypeId=${presentation.venueTypeId}&isReserved=${isReserved}`,
		getJsonInit({ uuid })
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch Cameri seat status ${presentation.id}: ${response.status}`);
	}

	return response.json();
}

function getPresentationFromResponse(response: CameriPresentationResponse): CameriPresentation | null {
	return 'presentation' in response ? response.presentation : null;
}

function getApiErrorStatus(response: CameriPresentationResponse): string | null {
	return 'error' in response ? response.error.error : null;
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
	sourceStatus: string;
	errorsCount: number;
	cacheHit: boolean;
};

type CachedAvailabilityResult = {
	result: CameriSeatAvailabilityFetchResult;
	cacheStoredAtMs: number;
};

type RuntimeAvailabilityCacheEntry = {
	value: CachedAvailabilityResult;
	expiresAtMs: number;
};

const runtimeAvailabilityCache = new Map<string, RuntimeAvailabilityCacheEntry>();

function getDuplicatePresentationIds(entries: CameriScheduleEntry[]): string[] {
	const counts = new Map<string, number>();

	for (const entry of entries) {
		counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.filter(([, count]) => count > 1)
		.map(([presentationId]) => presentationId);
}

function getStatusCounts(results: CameriSeatAvailabilityFetchResult[]): Record<string, number> {
	return results.reduce<Record<string, number>>((counts, result) => {
		counts[result.sourceStatus] = (counts[result.sourceStatus] ?? 0) + 1;
		return counts;
	}, {});
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
		console.info('[cameri-availability-item]', {
			reason: 'max_duration',
			...maxItemTiming
		});
	}

	for (const timing of failedItemTimings) {
		console.info('[cameri-availability-item]', {
			reason: 'failed',
			...timing
		});
	}
}

async function fetchAvailabilityByPresentationId(
	presentationId: string,
	seatplanCache: Map<string, Promise<CameriSeatplanResponse>>
): Promise<CameriSeatAvailabilityFetchResult> {
	const errors: string[] = [];

	try {
		const presentationResponse = await fetchPresentation(presentationId);
		const apiErrorStatus = getApiErrorStatus(presentationResponse);
		const presentation = getPresentationFromResponse(presentationResponse);

		if (apiErrorStatus) {
			return {
				presentationId,
				uuid: null,
				presentation: null,
				seatplan: null,
				seatStatus: null,
				sourceStatus: apiErrorStatus.toLowerCase(),
				errors
			};
		}

		if (!presentation) {
			return {
				presentationId,
				uuid: null,
				presentation: null,
				seatplan: null,
				seatStatus: null,
				sourceStatus: 'missing_presentation',
				errors: ['Missing Cameri presentation payload']
			};
		}

		if (presentation.soldout) {
			return {
				presentationId,
				uuid: null,
				presentation,
				seatplan: null,
				seatStatus: null,
				sourceStatus: 'soldout',
				errors
			};
		}

		if (!presentation.isReserved || !presentation.seatplanId) {
			return {
				presentationId,
				uuid: null,
				presentation,
				seatplan: null,
				seatStatus: null,
				sourceStatus: presentation.isGA ? 'general_admission' : 'presentation_available',
				errors
			};
		}

		const orderHtml = await fetchOrderPage(presentationId);
		const uuid = extractUuid(orderHtml);

		if (!uuid) {
			return {
				presentationId,
				uuid: null,
				presentation,
				seatplan: null,
				seatStatus: null,
				sourceStatus: 'missing_uuid',
				errors: ['Missing UUID in Cameri order page']
			};
		}

		const seatplanKey = `${presentation.venueId}:${presentation.seatplanId}`;
		const seatplanPromise =
			seatplanCache.get(seatplanKey) ?? fetchSeatplan(presentation.venueId, presentation.seatplanId);

		seatplanCache.set(seatplanKey, seatplanPromise);

		const [seatplan, seatStatus] = await Promise.all([seatplanPromise, fetchSeatStatus(presentation, uuid)]);

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
		errors.push(error instanceof Error ? error.message : 'Unknown Cameri availability error');

		return {
			presentationId,
			uuid: null,
			presentation: null,
			seatplan: null,
			seatStatus: null,
			sourceStatus: 'availability_error',
			errors
		};
	}
}

const fetchCachedAvailabilityByPresentationId = unstable_cache(
	async (presentationId: string): Promise<CachedAvailabilityResult> => ({
		result: await fetchAvailabilityByPresentationId(presentationId, new Map<string, Promise<CameriSeatplanResponse>>()),
		cacheStoredAtMs: Date.now()
	}),
	['theater', 'cameri', 'availability-result', 'v1'],
	{ revalidate: CAMERI_AVAILABILITY_CACHE_REVALIDATE_SECONDS, tags: CAMERI_AVAILABILITY_CACHE_TAGS }
);

async function getCachedAvailabilityByPresentationId(presentationId: string): Promise<CachedAvailabilityResult> {
	const now = Date.now();
	const runtimeCacheEntry = runtimeAvailabilityCache.get(presentationId);

	if (runtimeCacheEntry && runtimeCacheEntry.expiresAtMs > now) {
		return runtimeCacheEntry.value;
	}

	if (runtimeCacheEntry) {
		runtimeAvailabilityCache.delete(presentationId);
	}

	const value = await fetchCachedAvailabilityByPresentationId(presentationId);

	runtimeAvailabilityCache.set(presentationId, {
		value,
		expiresAtMs: now + CAMERI_AVAILABILITY_CACHE_REVALIDATE_SECONDS * 1000
	});

	return value;
}

export async function fetchAvailability(
	entry: CameriScheduleEntry,
	seatplanCache: Map<string, Promise<CameriSeatplanResponse>>
): Promise<CameriSeatAvailabilityFetchResult> {
	return fetchAvailabilityByPresentationId(entry.id, seatplanCache);
}

export async function fetchAvailabilityBatch(
	entries: CameriScheduleEntry[],
	concurrencyLimit: number = DEFAULT_CAMERI_AVAILABILITY_CONCURRENCY_LIMIT
): Promise<CameriSeatAvailabilityFetchResult[]> {
	const startedAt = Date.now();
	const itemTimings: AvailabilityItemTiming[] = [];
	const duplicatePresentationIds = getDuplicatePresentationIds(entries);

	if (duplicatePresentationIds.length > 0) {
		console.info('[cameri-availability-duplicates]', {
			duplicateCount: duplicatePresentationIds.length,
			presentationIds: duplicatePresentationIds
		});
	}

	const results = await mapWithConcurrency(entries, concurrencyLimit, async entry => {
		const itemStartedAt = Date.now();
		const cachedResult = await getCachedAvailabilityByPresentationId(entry.id);
		const cacheHit = cachedResult.cacheStoredAtMs < startedAt;

		itemTimings.push({
			presentationId: entry.id,
			durationMs: getDurationMs(itemStartedAt),
			sourceStatus: cachedResult.result.sourceStatus,
			errorsCount: cachedResult.result.errors.length,
			cacheHit
		});

		return cachedResult.result;
	});
	const durationMs = getDurationMs(startedAt);
	const failedCount = results.filter(result => result.errors.length > 0).length;
	const skippedCount = results.filter(result => SKIPPED_SOURCE_STATUSES.has(result.sourceStatus)).length;
	const cacheHitCount = itemTimings.filter(timing => timing.cacheHit).length;
	const cacheMissCount = itemTimings.length - cacheHitCount;
	const maxItemTiming = getMaxItemTiming(itemTimings);

	logTheaterFetch({ source: 'cameri.availabilityBatch', durationMs });
	console.info('[cameri-availability-cache]', {
		requestedCount: entries.length,
		cacheHitCount,
		cacheMissCount,
		failureCount: failedCount,
		durationMs,
		concurrencyLimit,
		revalidateSeconds: CAMERI_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
		runtimeCacheSize: runtimeAvailabilityCache.size
	});
	console.info('[cameri-availability-summary]', {
		concurrencyLimit,
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
	console.info('[cameri-availability-batch]', {
		requestedCount: entries.length,
		succeededCount: results.length - failedCount,
		failedCount,
		skippedCount,
		durationMs,
		averageItemDurationMs: getAverageDurationMs(itemTimings),
		maxItemDurationMs: maxItemTiming?.durationMs ?? 0,
		duplicatePresentationCount: duplicatePresentationIds.length,
		concurrencyLimit,
		statusCounts: getStatusCounts(results)
	});
	logDetailedAvailabilityItems(itemTimings);

	return results;
}
