import 'server-only';

import { getTheaterCacheTags } from '@/lib/theater/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import { HabimaScheduleJson } from './types';

const HABIMA_SCHEDULE_URL = 'https://www.habima.co.il/presentations/';
const DEFAULT_REVALIDATE_SECONDS = 600;

const BROWSER_HEADERS = {
	'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

function decodeJsonEscapedUrl(value: string): string {
	return value.replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
}

function extractScheduleDataUrl(pageHtml: string): string {
	const match = pageHtml.match(/all_shows_data_file":"([^"]+)"/);

	if (!match?.[1]) {
		throw new Error('Unable to locate Habima schedule data URL');
	}

	return decodeJsonEscapedUrl(match[1]);
}

export async function fetchSchedule(): Promise<HabimaScheduleJson> {
	const pageStartedAt = Date.now();
	const pageResponse = await fetch(HABIMA_SCHEDULE_URL, {
		headers: BROWSER_HEADERS,
		next: { revalidate: DEFAULT_REVALIDATE_SECONDS, tags: getTheaterCacheTags('habima') }
	});
	logTheaterFetch({
		source: 'habima.schedulePage',
		durationMs: getDurationMs(pageStartedAt),
		status: pageResponse.status
	});

	if (!pageResponse.ok) {
		throw new Error(`Failed to fetch Habima schedule page: ${pageResponse.status}`);
	}

	const pageHtml = await pageResponse.text();
	const dataUrl = extractScheduleDataUrl(pageHtml);
	const dataStartedAt = Date.now();
	const scheduleResponse = await fetch(dataUrl, {
		headers: BROWSER_HEADERS,
		next: { revalidate: DEFAULT_REVALIDATE_SECONDS, tags: getTheaterCacheTags('habima') }
	});
	logTheaterFetch({
		source: 'habima.scheduleData',
		durationMs: getDurationMs(dataStartedAt),
		status: scheduleResponse.status
	});

	if (!scheduleResponse.ok) {
		throw new Error(`Failed to fetch Habima schedule data: ${scheduleResponse.status}`);
	}

	return scheduleResponse.json();
}
