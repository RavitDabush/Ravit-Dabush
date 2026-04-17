import 'server-only';

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

async function fetchOrderPage(presentationId: string): Promise<string> {
	const response = await fetch(`${TICKETS_BASE_URL}/order/${presentationId}`, {
		headers: DEFAULT_HEADERS,
		next: { revalidate: DEFAULT_REVALIDATE_SECONDS, tags: getTheaterCacheTags('habima') }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Habima order page for ${presentationId}: ${response.status}`);
	}

	return response.text();
}

function extractUuid(orderHtml: string): string | null {
	return orderHtml.match(/auth:\{uuid:"([^"]+)"/)?.[1] ?? orderHtml.match(/"uuid":"([^"]+)"/)?.[1] ?? null;
}

async function fetchPresentation(presentationId: string): Promise<HabimaPresentationResponse> {
	const response = await fetch(`${TICKETS_BASE_URL}/api/presentations/${presentationId}`, getJsonInit());

	if (!response.ok) {
		throw new Error(`Failed to fetch Habima presentation ${presentationId}: ${response.status}`);
	}

	return response.json();
}

export async function fetchPresentationMetadata(presentationId: string): Promise<HabimaPresentationResponse> {
	return fetchPresentation(presentationId);
}

async function fetchSeatplan(venueId: number, seatplanId: number): Promise<HabimaSeatplanResponse> {
	const response = await fetch(`${TICKETS_BASE_URL}/api/seats/seatplanV2?venueId=${venueId}&seatplanId=${seatplanId}`, {
		method: 'POST',
		headers: {
			...DEFAULT_HEADERS,
			'content-type': 'application/json'
		},
		body: '{}',
		next: { revalidate: 300, tags: getTheaterCacheTags('habima') }
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
	uuid: string
): Promise<HabimaSeatStatusResponse> {
	const response = await fetch(
		`${TICKETS_BASE_URL}/api/seats/seats-statusV2?presentationId=${presentationId}&venueTypeId=${venueTypeId}&isReserved=${isReserved}`,
		getJsonInit({ uuid })
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

export async function fetchSeatAvailability(
	presentationId: string,
	seatplanCache: Map<string, Promise<HabimaSeatplanResponse>>
): Promise<HabimaSeatAvailabilityFetchResult> {
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
				sourceStatus: 'missing_uuid',
				errors: ['Missing UUID in Habima order page']
			};
		}

		const presentationResponse = await fetchPresentation(presentationId);
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

export async function fetchSeatAvailabilityBatch(
	entries: HabimaScheduleEntry[],
	concurrencyLimit: number = 3
): Promise<HabimaSeatAvailabilityFetchResult[]> {
	const startedAt = Date.now();
	const seatplanCache = new Map<string, Promise<HabimaSeatplanResponse>>();

	const results = await mapWithConcurrency(entries, concurrencyLimit, entry =>
		fetchSeatAvailability(entry.id, seatplanCache)
	);
	logTheaterFetch({ source: 'habima.seatAvailabilityBatch', durationMs: getDurationMs(startedAt) });

	return results;
}
