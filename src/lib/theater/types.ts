export type TheaterId = 'habima' | 'lessin' | 'cameri' | 'tomix';

export type TheaterSourceConfidence = 'high' | 'medium' | 'low';

export type TheaterAvailabilityType = 'row' | 'section' | 'general' | 'unknown';

export type SaleState = 'not_started' | 'on_sale' | 'sold_out' | 'ended' | 'unknown';

export type SaleLifecycle = {
	saleState: SaleState;
	ticketSaleStart?: string;
	ticketSaleStop?: string;
};

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
	saleLifecycle: SaleLifecycle;
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
