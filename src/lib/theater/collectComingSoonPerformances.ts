import 'server-only';

import { unstable_cache } from 'next/cache';
import { getNormalizedSaleLifecyclePerformances as getLessinSaleLifecyclePerformances } from '@/lib/lessin/normalizePerformance';
import { getNormalizedSaleLifecyclePerformances as getHabimaSaleLifecyclePerformances } from '@/lib/habima/normalizePerformance';
import { getNormalizedSaleLifecyclePerformances as getCameriSaleLifecyclePerformances } from '@/lib/cameri/normalizePerformance';
import { TheaterId, TheaterNormalizedPerformance } from './types';

const COMING_SOON_COLLECTOR_REVALIDATE_SECONDS = 300;

export type ComingSoonPerformance = TheaterNormalizedPerformance & {
	theaterId: TheaterId;
};

async function collectTheaterComingSoon(
	theaterId: TheaterId,
	collector: () => Promise<TheaterNormalizedPerformance[]>
): Promise<ComingSoonPerformance[]> {
	try {
		const performances = await collector();

		return performances.map(performance => ({
			...performance,
			theaterId
		}));
	} catch {
		return [];
	}
}

const collectComingSoonPerformancesCached = unstable_cache(
	async (): Promise<ComingSoonPerformance[]> => {
		const theaterResults = await Promise.all([
			collectTheaterComingSoon('lessin', getLessinSaleLifecyclePerformances),
			collectTheaterComingSoon('habima', getHabimaSaleLifecyclePerformances),
			collectTheaterComingSoon('cameri', getCameriSaleLifecyclePerformances)
		]);

		return theaterResults
			.flat()
			.filter(performance => performance.saleLifecycle?.saleState === 'not_started')
			.sort((left, right) =>
				(left.saleLifecycle.ticketSaleStart ?? '').localeCompare(right.saleLifecycle.ticketSaleStart ?? '')
			);
	},
	['theater', 'coming-soon', 'prepared-performances'],
	{ revalidate: COMING_SOON_COLLECTOR_REVALIDATE_SECONDS }
);

export async function collectComingSoonPerformances(): Promise<ComingSoonPerformance[]> {
	return collectComingSoonPerformancesCached();
}
