import 'server-only';

import { getTheaterCacheTags } from '@/lib/theater/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import {
	LessinScheduleEntry,
	LessinPresentationResponse,
	LessinSeatAvailabilityFetchResult,
	LessinSeatStatusResponse,
	LessinSeatplanResponse
} from './types';

const PRESGLOBAL_BASE_URL = 'https://lessin.presglobal.store';
const DEFAULT_LESSIN_AVAILABILITY_CONCURRENCY_LIMIT = 3;
const LESSIN_AVAILABILITY_CACHE_REVALIDATE_SECONDS = 300;
const SLOW_ITEM_LOG_LIMIT = 5;

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
		next: { revalidate: 180, tags: getTheaterCacheTags('lessin') }
	};
}

async function fetchOrderPage(presentationId: string): Promise<string> {
	const response = await fetch(`${PRESGLOBAL_BASE_URL}/order/${presentationId}`, {
		headers: DEFAULT_HEADERS,
		next: { revalidate: 180, tags: getTheaterCacheTags('lessin') }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch order page for ${presentationId}: ${response.status}`);
	}

	return response.text();
}

function extractUuid(orderHtml: string): string | null {
	return orderHtml.match(/auth:\{uuid:"([^"]+)"/)?.[1] ?? null;
}

async function fetchPresentation(presentationId: string): Promise<LessinPresentationResponse> {
	const response = await fetch(`${PRESGLOBAL_BASE_URL}/api/presentations/${presentationId}`, getJsonInit());

	if (!response.ok) {
		throw new Error(`Failed to fetch presentation ${presentationId}: ${response.status}`);
	}

	return response.json();
}

async function fetchSeatplan(venueId: number, seatplanId: number): Promise<LessinSeatplanResponse> {
	const response = await fetch(
		`${PRESGLOBAL_BASE_URL}/api/seats/seatplanV2?venueId=${venueId}&seatplanId=${seatplanId}`,
		{
			method: 'POST',
			headers: {
				...DEFAULT_HEADERS,
				'content-type': 'application/json'
			},
			body: '{}',
			next: { revalidate: 300, tags: getTheaterCacheTags('lessin') }
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch seatplan ${venueId}/${seatplanId}: ${response.status}`);
	}

	return response.json();
}

async function fetchSeatStatus(
	presentationId: string,
	venueTypeId: number,
	isReserved: number,
	uuid: string
): Promise<LessinSeatStatusResponse> {
	const response = await fetch(
		`${PRESGLOBAL_BASE_URL}/api/seats/seats-statusV2?presentationId=${presentationId}&venueTypeId=${venueTypeId}&isReserved=${isReserved}`,
		getJsonInit({ uuid })
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch seat status ${presentationId}: ${response.status}`);
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
	result: LessinSeatAvailabilityFetchResult;
	cacheStoredAtMs: number;
};

type RuntimeAvailabilityCacheEntry = {
	value: CachedAvailabilityResult;
	expiresAtMs: number;
};

const runtimeAvailabilityCache = new Map<string, RuntimeAvailabilityCacheEntry>();

function getDuplicatePresentationIds(entries: LessinScheduleEntry[]): string[] {
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
		console.info('[lessin-availability-item]', {
			reason: 'max_duration',
			...maxItemTiming
		});
	}

	for (const timing of failedItemTimings) {
		console.info('[lessin-availability-item]', {
			reason: 'failed',
			...timing
		});
	}
}

async function getCachedSeatAvailability(
	presentationId: string,
	seatplanCache: Map<string, Promise<LessinSeatplanResponse>>
): Promise<CachedAvailabilityResult> {
	const now = Date.now();
	const runtimeCacheEntry = runtimeAvailabilityCache.get(presentationId);

	if (runtimeCacheEntry && runtimeCacheEntry.expiresAtMs > now) {
		return runtimeCacheEntry.value;
	}

	if (runtimeCacheEntry) {
		runtimeAvailabilityCache.delete(presentationId);
	}

	const value: CachedAvailabilityResult = {
		result: await fetchSeatAvailability(presentationId, seatplanCache),
		cacheStoredAtMs: Date.now()
	};

	runtimeAvailabilityCache.set(presentationId, {
		value,
		expiresAtMs: now + LESSIN_AVAILABILITY_CACHE_REVALIDATE_SECONDS * 1000
	});

	return value;
}

export async function fetchSeatAvailability(
	presentationId: string,
	seatplanCache: Map<string, Promise<LessinSeatplanResponse>>
): Promise<LessinSeatAvailabilityFetchResult> {
	const errors: string[] = [];

	try {
		const orderHtml = await fetchOrderPage(presentationId);
		const uuid = extractUuid(orderHtml);

		if (!uuid) {
			return {
				presentationId,
				uuid: null,
				presentation: null,
				seatplan: null,
				seatStatus: null,
				errors: ['Missing UUID in order page']
			};
		}

		const presentationResponse = await fetchPresentation(presentationId);
		const presentation = presentationResponse.presentation;

		if (!presentation || !presentation.seatplanId) {
			return {
				presentationId,
				uuid,
				presentation,
				seatplan: null,
				seatStatus: null,
				errors: ['Missing presentation seatplan metadata']
			};
		}

		const seatplanKey = `${presentation.venueId}:${presentation.seatplanId}`;
		const seatplanPromise =
			seatplanCache.get(seatplanKey) ?? fetchSeatplan(presentation.venueId, presentation.seatplanId);

		seatplanCache.set(seatplanKey, seatplanPromise);

		const [seatplan, seatStatus] = await Promise.all([
			seatplanPromise,
			fetchSeatStatus(presentationId, presentation.venueTypeId, presentation.isReserved, uuid)
		]);

		return {
			presentationId,
			uuid,
			presentation,
			seatplan,
			seatStatus,
			errors
		};
	} catch (error) {
		errors.push(error instanceof Error ? error.message : 'Unknown seat availability error');

		return {
			presentationId,
			uuid: null,
			presentation: null,
			seatplan: null,
			seatStatus: null,
			errors
		};
	}
}

export async function fetchSeatAvailabilityBatch(
	entries: LessinScheduleEntry[],
	concurrencyLimit: number = DEFAULT_LESSIN_AVAILABILITY_CONCURRENCY_LIMIT
): Promise<LessinSeatAvailabilityFetchResult[]> {
	const startedAt = Date.now();
	const seatplanCache = new Map<string, Promise<LessinSeatplanResponse>>();
	const itemTimings: AvailabilityItemTiming[] = [];
	const duplicatePresentationIds = getDuplicatePresentationIds(entries);

	if (duplicatePresentationIds.length > 0) {
		console.info('[lessin-availability-duplicates]', {
			duplicateCount: duplicatePresentationIds.length,
			presentationIds: duplicatePresentationIds
		});
	}

	const results = await mapWithConcurrency(entries, concurrencyLimit, async entry => {
		const itemStartedAt = Date.now();
		const cachedResult = await getCachedSeatAvailability(entry.id, seatplanCache);
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
	const skippedCount = results.filter(result => !result.seatplan || !result.seatStatus).length;
	const cacheHitCount = itemTimings.filter(timing => timing.cacheHit).length;
	const cacheMissCount = itemTimings.length - cacheHitCount;
	const maxItemTiming = getMaxItemTiming(itemTimings);

	logTheaterFetch({ source: 'lessin.seatAvailabilityBatch', durationMs });
	console.info('[lessin-availability-cache]', {
		requestedCount: entries.length,
		cacheHitCount,
		cacheMissCount,
		failureCount: failedCount,
		durationMs,
		concurrencyLimit,
		revalidateSeconds: LESSIN_AVAILABILITY_CACHE_REVALIDATE_SECONDS,
		runtimeCacheSize: runtimeAvailabilityCache.size
	});
	console.info('[lessin-availability-summary]', {
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
	logDetailedAvailabilityItems(itemTimings);

	return results;
}
