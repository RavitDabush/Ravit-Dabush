import 'server-only';

import { unstable_cache } from 'next/cache';
import { getNormalizedPreferredPerformances } from '@/lib/hebrewTheater/normalizePerformance';
import { NormalizedPerformance } from '@/lib/hebrewTheater/types';
import { getTheaterCacheTags } from './cache';
import { getDurationMs, logTheaterCollector } from './observability';
import { TheaterCollectorResult } from './types';

const HEBREW_THEATER_COLLECTOR_REVALIDATE_SECONDS = 600;

const collectHebrewTheaterPerformancesCached = unstable_cache(
	async (): Promise<TheaterCollectorResult<NormalizedPerformance>> => {
		const performances = await getNormalizedPreferredPerformances();

		return {
			theaterId: 'hebrew-theater',
			collectedAt: new Date().toISOString(),
			performances
		};
	},
	['theater', 'hebrew-theater', 'prepared-performances', 'v2'],
	{ revalidate: HEBREW_THEATER_COLLECTOR_REVALIDATE_SECONDS, tags: getTheaterCacheTags('hebrew-theater') }
);

export async function collectHebrewTheaterPerformances(): Promise<TheaterCollectorResult<NormalizedPerformance>> {
	const startedAt = Date.now();
	const result = await collectHebrewTheaterPerformancesCached();

	logTheaterCollector(result, getDurationMs(startedAt));

	return result;
}
