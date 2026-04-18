import 'server-only';

import { getTheaterCacheTags } from '@/lib/theater/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import { CameriPresentationListResponse } from './types';

const CAMERI_PRESENTATIONS_URL = 'https://tickets.cameri.co.il/api/presentations';

const BROWSER_HEADERS = {
	accept: 'application/json, text/plain, */*',
	'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

export async function fetchPresentations(): Promise<CameriPresentationListResponse> {
	const startedAt = Date.now();
	const response = await fetch(CAMERI_PRESENTATIONS_URL, {
		headers: BROWSER_HEADERS,
		next: { revalidate: 300, tags: getTheaterCacheTags('cameri') }
	});
	logTheaterFetch({ source: 'cameri.presentations', durationMs: getDurationMs(startedAt), status: response.status });

	if (!response.ok) {
		throw new Error(`Failed to fetch Cameri presentations: ${response.status}`);
	}

	return (await response.json()) as CameriPresentationListResponse;
}
