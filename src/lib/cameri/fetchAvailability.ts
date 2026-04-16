import 'server-only';

import { getTheaterCacheTags } from '@/lib/theater/cache';
import {
	CameriPresentation,
	CameriPresentationResponse,
	CameriScheduleEntry,
	CameriSeatAvailabilityFetchResult,
	CameriSeatStatusResponse,
	CameriSeatplanResponse
} from './types';

const CAMERI_TICKETS_BASE_URL = 'https://tickets.cameri.co.il';

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
		next: { revalidate: 180, tags: getTheaterCacheTags('cameri') }
	};
}

async function fetchOrderPage(presentationId: string): Promise<string> {
	const response = await fetch(`${CAMERI_TICKETS_BASE_URL}/order/${presentationId}`, {
		headers: DEFAULT_HEADERS,
		next: { revalidate: 180, tags: getTheaterCacheTags('cameri') }
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
			next: { revalidate: 300, tags: getTheaterCacheTags('cameri') }
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

export async function fetchAvailability(
	entry: CameriScheduleEntry,
	seatplanCache: Map<string, Promise<CameriSeatplanResponse>>
): Promise<CameriSeatAvailabilityFetchResult> {
	const errors: string[] = [];

	try {
		const presentationResponse = await fetchPresentation(entry.id);
		const apiErrorStatus = getApiErrorStatus(presentationResponse);
		const presentation = getPresentationFromResponse(presentationResponse);

		if (apiErrorStatus) {
			return {
				presentationId: entry.id,
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
				presentationId: entry.id,
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
				presentationId: entry.id,
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
				presentationId: entry.id,
				uuid: null,
				presentation,
				seatplan: null,
				seatStatus: null,
				sourceStatus: presentation.isGA ? 'general_admission' : 'presentation_available',
				errors
			};
		}

		const orderHtml = await fetchOrderPage(entry.id);
		const uuid = extractUuid(orderHtml);

		if (!uuid) {
			return {
				presentationId: entry.id,
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
			presentationId: entry.id,
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
			presentationId: entry.id,
			uuid: null,
			presentation: null,
			seatplan: null,
			seatStatus: null,
			sourceStatus: 'availability_error',
			errors
		};
	}
}

export async function fetchAvailabilityBatch(
	entries: CameriScheduleEntry[],
	concurrencyLimit: number = 3
): Promise<CameriSeatAvailabilityFetchResult[]> {
	const seatplanCache = new Map<string, Promise<CameriSeatplanResponse>>();

	return mapWithConcurrency(entries, concurrencyLimit, entry => fetchAvailability(entry, seatplanCache));
}
