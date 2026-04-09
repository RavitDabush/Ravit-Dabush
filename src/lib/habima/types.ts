export type SourceConfidence = 'high' | 'medium' | 'low';

export type HabimaSchedulePresentation = {
	id: number;
	time: number;
	venue_id: number;
	subtitles?: string[];
};

export type HabimaScheduleShow = {
	ID: number;
	title: string;
	url?: string;
	img?: string;
	s_img?: string;
};

export type HabimaScheduleJson = {
	presentations: {
		he?: Record<string, HabimaSchedulePresentation[]>;
		en?: Record<string, HabimaSchedulePresentation[]>;
	};
	venues: {
		he?: Record<string, string>;
		en?: Record<string, string>;
	};
	shows: {
		he?: Record<string, HabimaScheduleShow>;
		en?: Record<string, HabimaScheduleShow>;
	};
};

export type HabimaScheduleEntry = {
	id: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl: string;
	showUrl?: string;
	sourceShowKey: string;
};

export type HabimaPresentation = {
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
	newBookingUrl?: string | null;
};

export type HabimaPresentationResponse = {
	presentation: HabimaPresentation;
	serverTime?: string;
};

export type HabimaSeatplanSeat = {
	n?: string;
	tg?: number;
	rd?: Record<string, unknown>;
	[key: string]: unknown;
};

export type HabimaSeatplanRow = {
	n?: string;
	S: Record<string, HabimaSeatplanSeat>;
};

export type HabimaSeatplanGroup = {
	R: Record<string, HabimaSeatplanRow>;
};

export type HabimaSeatplanSection = {
	r?: number;
	n?: string;
	G: Record<string, HabimaSeatplanGroup>;
};

export type HabimaSeatplanResponse = {
	S: Record<string, HabimaSeatplanSection>;
	[key: string]: unknown;
};

export type HabimaSeatStatusResponse = {
	seats: Record<string, number | string>;
};

export type HabimaSeatAvailabilityFetchResult = {
	presentationId: string;
	uuid: string | null;
	presentation: HabimaPresentation | null;
	seatplan: HabimaSeatplanResponse | null;
	seatStatus: HabimaSeatStatusResponse | null;
	sourceStatus?: string;
	errors: string[];
};

export type FlattenedSeat = {
	key: string;
	sectionId: string;
	sectionLabel: string;
	groupId: string;
	rowId: string;
	rowLabel: string;
	seatId: string;
	seatLabel: string;
	sectionMatchKind: 'preferred' | 'preferred_table' | 'excluded' | 'unknown';
};

export type ParsedSeatAvailability = {
	availableInPreferredRows: boolean;
	matchedRows: string[];
	matchedSections: string[];
	availableSeatCount: number;
	sourceStatus: string;
	sourceConfidence: SourceConfidence;
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
	matchedSections: string[];
	availableSeatCount?: number;
	sourceStatus?: string;
	sourceConfidence: SourceConfidence;
};
