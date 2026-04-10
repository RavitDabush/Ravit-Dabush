import 'server-only';

import { LessinFeature, LessinFeaturesResponse, LessinPresentationsResponse, LessinPresentationSummary } from './types';

const PRESGLOBAL_BASE_URL = 'https://lessin.presglobal.store';

const DEFAULT_HEADERS = {
	accept: 'application/json, text/plain, */*',
	'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

function getJsonInit(revalidate: number): RequestInit {
	return {
		headers: DEFAULT_HEADERS,
		next: { revalidate }
	};
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

export async function fetchFeatures(): Promise<LessinFeature[]> {
	const response = await fetch(`${PRESGLOBAL_BASE_URL}/api/features/`, getJsonInit(300));

	if (!response.ok) {
		throw new Error(`Failed to fetch Lessin features: ${response.status}`);
	}

	const payload = (await response.json()) as LessinFeaturesResponse;

	return payload.filter(feature => Boolean(feature?.id) && Boolean(feature?.name));
}

export async function fetchPresentations(featureId: number): Promise<LessinPresentationSummary[]> {
	const response = await fetch(`${PRESGLOBAL_BASE_URL}/api/presentations/?featureIds=${featureId}`, getJsonInit(300));

	if (!response.ok) {
		throw new Error(`Failed to fetch Lessin presentations for feature ${featureId}: ${response.status}`);
	}

	const payload = (await response.json()) as LessinPresentationsResponse;

	return payload.presentations ?? [];
}

export async function fetchAllPresentations(
	features: LessinFeature[],
	concurrencyLimit: number = 4
): Promise<LessinPresentationSummary[]> {
	const batches = await mapWithConcurrency(features, concurrencyLimit, async feature => fetchPresentations(feature.id));

	return batches.flat();
}
