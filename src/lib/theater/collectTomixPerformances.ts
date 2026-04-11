import 'server-only';

import { unstable_cache } from 'next/cache';
import { getNormalizedPreferredPerformances } from '@/lib/tomix/normalizePerformance';
import { NormalizedPerformance } from '@/lib/tomix/types';
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
	{ revalidate: TOMIX_COLLECTOR_REVALIDATE_SECONDS }
);

export async function collectTomixPerformances(): Promise<TheaterCollectorResult<NormalizedPerformance>> {
	return collectTomixPerformancesCached();
}
