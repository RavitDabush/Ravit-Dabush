import 'server-only';

import { getTheaterCacheTags } from '@/lib/theater/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import { LessinFeature, LessinFeaturesResponse, LessinPresentationsResponse, LessinPresentationSummary } from './types';

const PRESGLOBAL_BASE_URL = 'https://lessin.presglobal.store';
const DEFAULT_LESSIN_PRESENTATIONS_CONCURRENCY_LIMIT = 4;

const DEFAULT_HEADERS = {
	accept: 'application/json, text/plain, */*',
	'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

function getJsonInit(revalidate: number): RequestInit {
	return {
		headers: DEFAULT_HEADERS,
		next: { revalidate, tags: getTheaterCacheTags('lessin') }
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
	const startedAt = Date.now();
	const response = await fetch(`${PRESGLOBAL_BASE_URL}/api/features/`, getJsonInit(300));
	logTheaterFetch({ source: 'lessin.features', durationMs: getDurationMs(startedAt), status: response.status });

	if (!response.ok) {
		throw new Error(`Failed to fetch Lessin features: ${response.status}`);
	}

	const payload = (await response.json()) as LessinFeaturesResponse;

	return payload.filter(feature => Boolean(feature?.id) && Boolean(feature?.name));
}

export async function fetchPresentations(featureId: number): Promise<LessinPresentationSummary[]> {
	const startedAt = Date.now();
	const response = await fetch(`${PRESGLOBAL_BASE_URL}/api/presentations/?featureIds=${featureId}`, getJsonInit(300));
	logTheaterFetch({
		source: 'lessin.presentations',
		durationMs: getDurationMs(startedAt),
		status: response.status
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Lessin presentations for feature ${featureId}: ${response.status}`);
	}

	const payload = (await response.json()) as LessinPresentationsResponse;

	return payload.presentations ?? [];
}

export async function fetchAllPresentations(
	features: LessinFeature[],
	concurrencyLimit: number = DEFAULT_LESSIN_PRESENTATIONS_CONCURRENCY_LIMIT
): Promise<LessinPresentationSummary[]> {
	const startedAt = Date.now();
	const batches = await mapWithConcurrency(features, concurrencyLimit, async feature => fetchPresentations(feature.id));
	const durationMs = getDurationMs(startedAt);
	const presentations = batches.flat();

	logTheaterFetch({ source: 'lessin.presentationsBatch', durationMs });
	console.info('[lessin-presentations-batch]', {
		featuresCount: features.length,
		presentationsCount: presentations.length,
		durationMs,
		concurrencyLimit
	});

	return presentations;
}
