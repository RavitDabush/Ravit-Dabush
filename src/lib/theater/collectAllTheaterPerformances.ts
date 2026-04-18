import 'server-only';

import { collectCameriPerformances } from './collectCameriPerformances';
import { collectHabimaPerformances } from './collectHabimaPerformances';
import { collectHebrewTheaterPerformances } from './collectHebrewTheaterPerformances';
import { collectLessinPerformances } from './collectLessinPerformances';
import { collectTomixPerformances } from './collectTomixPerformances';
import { CollectedTheaterPerformance, TheaterCollectorResult, TheaterNormalizedPerformance } from './types';

export async function collectAllTheaterPerformances(): Promise<TheaterCollectorResult[]> {
	return Promise.all([
		collectLessinPerformances(),
		collectHabimaPerformances(),
		collectCameriPerformances(),
		collectTomixPerformances(),
		collectHebrewTheaterPerformances()
	]);
}

export function flattenCollectedTheaterPerformances(
	results: TheaterCollectorResult[]
): CollectedTheaterPerformance<TheaterNormalizedPerformance>[] {
	return results.flatMap(result =>
		result.performances.map(performance => ({
			theaterId: result.theaterId,
			performance
		}))
	);
}
