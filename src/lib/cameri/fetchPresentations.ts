import 'server-only';

import { CameriPresentationListResponse } from './types';

const CAMERI_PRESENTATIONS_URL = 'https://tickets.cameri.co.il/api/presentations';

const BROWSER_HEADERS = {
	accept: 'application/json, text/plain, */*',
	'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

export async function fetchPresentations(): Promise<CameriPresentationListResponse> {
	const response = await fetch(CAMERI_PRESENTATIONS_URL, {
		headers: BROWSER_HEADERS,
		next: { revalidate: 300 }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Cameri presentations: ${response.status}`);
	}

	return response.json();
}
