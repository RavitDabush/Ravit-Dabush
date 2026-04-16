import 'server-only';

import { unstable_cache } from 'next/cache';
import { getNormalizedPreferredPerformances } from '@/lib/lessin/normalizePerformance';
import { NormalizedPerformance } from '@/lib/lessin/types';
import { getTheaterCacheTags } from './cache';
import { TheaterCollectorResult } from './types';

const LESSIN_COLLECTOR_REVALIDATE_SECONDS = 300;

const collectLessinPerformancesCached = unstable_cache(
	async (): Promise<TheaterCollectorResult<NormalizedPerformance>> => {
		const performances = await getNormalizedPreferredPerformances();

		return {
			theaterId: 'lessin',
			collectedAt: new Date().toISOString(),
			performances
		};
	},
	['theater', 'lessin', 'prepared-performances'],
	{ revalidate: LESSIN_COLLECTOR_REVALIDATE_SECONDS, tags: getTheaterCacheTags('lessin') }
);

export async function collectLessinPerformances(): Promise<TheaterCollectorResult<NormalizedPerformance>> {
	return collectLessinPerformancesCached();
}
