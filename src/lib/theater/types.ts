import { NormalizedPerformance as HabimaNormalizedPerformance } from '@/lib/habima/types';
import { NormalizedPerformance as LessinNormalizedPerformance } from '@/lib/lessin/types';

export type TheaterId = 'habima' | 'lessin';

export type TheaterNormalizedPerformance = HabimaNormalizedPerformance | LessinNormalizedPerformance;

export type TheaterCollectorResult<TPerformance extends TheaterNormalizedPerformance = TheaterNormalizedPerformance> = {
	theaterId: TheaterId;
	collectedAt: string;
	performances: TPerformance[];
};

export type CollectedTheaterPerformance<
	TPerformance extends TheaterNormalizedPerformance = TheaterNormalizedPerformance
> = {
	theaterId: TheaterId;
	performance: TPerformance;
};

export type TheaterPerformanceGroup<TPerformance extends TheaterNormalizedPerformance = TheaterNormalizedPerformance> =
	{
		date: string;
		label: string;
		performances: TPerformance[];
	};
