import 'server-only';

import { unstable_cache } from 'next/cache';
import { getNormalizedPreferredPerformances } from '@/lib/tomix/normalizePerformance';
import { NormalizedPerformance } from '@/lib/tomix/types';
import { getTheaterCacheTags } from './cache';
import { getDurationMs, logTheaterCollector } from './observability';
import { TheaterCollectorResult } from './types';

const TOMIX_COLLECTOR_REVALIDATE_SECONDS = 600;

const collectTomixPerformancesCached = unstable_cache(
	async (): Promise<TheaterCollectorResult<NormalizedPerformance>> => {
		const performances = await getNormalizedPreferredPerformances();

		return {
			theaterId: 'tomix',
			collectedAt: new Date().toISOString(),
			performances
		};
	},
	['theater', 'tomix', 'prepared-performances'],
	{ revalidate: TOMIX_COLLECTOR_REVALIDATE_SECONDS, tags: getTheaterCacheTags('tomix') }
);

export async function collectTomixPerformances(): Promise<TheaterCollectorResult<NormalizedPerformance>> {
	const startedAt = Date.now();
	const result = await collectTomixPerformancesCached();

	logTheaterCollector(result, getDurationMs(startedAt));

	return result;
}
