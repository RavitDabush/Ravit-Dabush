export type TheaterId = 'habima' | 'lessin' | 'cameri';

export type TheaterSourceConfidence = 'high' | 'medium' | 'low';

export type TheaterAvailabilityType = 'row' | 'section' | 'general' | 'unknown';

export type TheaterNormalizedPerformance = {
	id: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl?: string;
	hasPreferredAvailability: boolean;
	availabilityType: TheaterAvailabilityType;
	matchedSections: string[];
	matchedRows: string[];
	availableSeatCount?: number;
	sourceStatus?: string;
	sourceConfidence: TheaterSourceConfidence;
};

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
