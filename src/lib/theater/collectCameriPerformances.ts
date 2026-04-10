import 'server-only';

import { unstable_cache } from 'next/cache';
import { getNormalizedAvailablePerformances } from '@/lib/cameri/normalizePerformance';
import { NormalizedPerformance } from '@/lib/cameri/types';
import { TheaterCollectorResult } from './types';

const CAMERI_COLLECTOR_REVALIDATE_SECONDS = 300;

const collectCameriPerformancesCached = unstable_cache(
	async (): Promise<TheaterCollectorResult<NormalizedPerformance>> => {
		const performances = await getNormalizedAvailablePerformances();

		return {
			theaterId: 'cameri',
			collectedAt: new Date().toISOString(),
			performances
		};
	},
	['theater', 'cameri', 'prepared-performances'],
	{ revalidate: CAMERI_COLLECTOR_REVALIDATE_SECONDS }
);

export async function collectCameriPerformances(): Promise<TheaterCollectorResult<NormalizedPerformance>> {
	return collectCameriPerformancesCached();
}
