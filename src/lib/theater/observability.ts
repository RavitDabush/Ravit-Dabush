import 'server-only';

import { Locale } from 'next-intl';
import { TheaterCollectorResult, TheaterId } from './types';

type TheaterRefreshLog = {
	phase: 'start' | 'end';
	theaterId: TheaterId;
	locale: Locale;
	durationMs: number;
};

type TheaterFetchLog = {
	source: string;
	durationMs: number;
	status?: number | string;
};

export function getDurationMs(startedAt: number): number {
	return Date.now() - startedAt;
}

export function logTheaterRefresh(details: TheaterRefreshLog): void {
	console.info('[theater-refresh]', details);
}

export function logTheaterCollector(result: TheaterCollectorResult, durationMs: number): void {
	console.info('[theater-collector]', {
		theaterId: result.theaterId,
		durationMs,
		performancesCount: result.performances.length,
		collectedAt: result.collectedAt
	});
}

export function logTheaterFetch(details: TheaterFetchLog): void {
	console.info('[theater-fetch]', details);
}
