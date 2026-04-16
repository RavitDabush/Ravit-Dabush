import 'server-only';

import { getTheaterCacheTags } from '@/lib/theater/cache';

const LESSIN_SCHEDULE_URL = 'https://www.lessin.co.il/%D7%94%D7%A6%D7%92%D7%95%D7%AA/';

const BROWSER_HEADERS = {
	'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

export async function fetchSchedule(): Promise<string> {
	const response = await fetch(LESSIN_SCHEDULE_URL, {
		headers: BROWSER_HEADERS,
		next: { revalidate: 300, tags: getTheaterCacheTags('lessin') }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Lessin schedule: ${response.status}`);
	}

	return response.text();
}
