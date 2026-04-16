import 'server-only';

import { getTheaterCacheTags } from '@/lib/theater/cache';

const CAMERI_SCHEDULE_URL =
	'https://www.cameri.co.il/%D7%9C%D7%95%D7%97-%D7%94%D7%95%D7%A4%D7%A2%D7%95%D7%AA/?filter=show';

const BROWSER_HEADERS = {
	'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

export async function fetchSchedule(): Promise<string> {
	const response = await fetch(CAMERI_SCHEDULE_URL, {
		headers: BROWSER_HEADERS,
		next: { revalidate: 300, tags: getTheaterCacheTags('cameri') }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Cameri schedule page: ${response.status}`);
	}

	return response.text();
}
