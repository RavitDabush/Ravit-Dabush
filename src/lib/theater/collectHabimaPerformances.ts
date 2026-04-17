import 'server-only';

import { unstable_cache } from 'next/cache';
import { getNormalizedPreferredPerformances } from '@/lib/habima/normalizePerformance';
import { NormalizedPerformance } from '@/lib/habima/types';
import { getTheaterCacheTags } from './cache';
import { getDurationMs, logTheaterCollector } from './observability';
import { TheaterCollectorResult } from './types';

const HABIMA_COLLECTOR_REVALIDATE_SECONDS = 600;

const collectHabimaPerformancesCached = unstable_cache(
	async (): Promise<TheaterCollectorResult<NormalizedPerformance>> => {
		const performances = await getNormalizedPreferredPerformances();

		return {
			theaterId: 'habima',
			collectedAt: new Date().toISOString(),
			performances
		};
	},
	['theater', 'habima', 'prepared-performances'],
	{ revalidate: HABIMA_COLLECTOR_REVALIDATE_SECONDS, tags: getTheaterCacheTags('habima') }
);

export async function collectHabimaPerformances(): Promise<TheaterCollectorResult<NormalizedPerformance>> {
	const startedAt = Date.now();
	const result = await collectHabimaPerformancesCached();

	logTheaterCollector(result, getDurationMs(startedAt));

	return result;
}
