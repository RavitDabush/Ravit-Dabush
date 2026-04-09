export type SourceConfidence = 'high' | 'medium' | 'low';

export type LessinScheduleEntry = {
	id: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl?: string;
	sourceStatus?: string;
	sourceDay?: string;
	sourceShowId?: string;
	isSoldOut: boolean;
};

export type LessinPresentation = {
	id: number;
	businessDate: string;
	featureName: string;
	featureId: number;
	venueName: string;
	dateTime: string;
	venueTypeId: number;
	venueId: number;
	locationName: string;
	seatplanId: number | null;
	soldout: number;
	isReserved: number;
	isGA: number;
	specialMessage?: string | null;
	specialMessage2?: string | null;
	viewAreaName?: string | null;
	newBookingUrl?: string | null;
};

export type LessinPresentationResponse = {
	presentation: LessinPresentation;
	serverTime?: string;
};

export type LessinSeatplanSeat = {
	n?: string;
	tg?: number;
	rd?: Record<string, unknown>;
	[key: string]: unknown;
};

export type LessinSeatplanRow = {
	n?: string;
	S: Record<string, LessinSeatplanSeat>;
};

export type LessinSeatplanGroup = {
	R: Record<string, LessinSeatplanRow>;
};

export type LessinSeatplanSection = {
	r?: number;
	n?: string;
	G: Record<string, LessinSeatplanGroup>;
};

export type LessinSeatplanResponse = {
	S: Record<string, LessinSeatplanSection>;
	[key: string]: unknown;
};

export type LessinSeatStatusResponse = {
	seats: Record<string, number | string>;
};

export type LessinSeatAvailabilityFetchResult = {
	presentationId: string;
	uuid: string | null;
	presentation: LessinPresentation | null;
	seatplan: LessinSeatplanResponse | null;
	seatStatus: LessinSeatStatusResponse | null;
	errors: string[];
};

export type FlattenedSeat = {
	key: string;
	sectionId: string;
	groupId: string;
	rowId: string;
	rowLabel: string;
	seatId: string;
	seatLabel: string;
};

export type ParsedSeatAvailability = {
	availableInPreferredRows: boolean;
	matchedRows: string[];
	availableSeatCount: number;
};

export type NormalizedPerformance = {
	id: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl?: string;
	availableInPreferredRows: boolean;
	matchedRows: string[];
	availableSeatCount?: number;
	sourceStatus?: string;
	sourceConfidence: SourceConfidence;
};
