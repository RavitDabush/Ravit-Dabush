export type SourceConfidence = 'high' | 'medium' | 'low';

export type AvailabilityType = 'row' | 'zone' | 'general' | 'unknown';

export type CameriScheduleTimeEntry = [number, string, string, string];

export type CameriScheduleCalendarEvent = {
	start: string;
	extendedProps?: {
		show_name?: string;
		show_permalink?: string;
		press_global_id?: string;
		times?: CameriScheduleTimeEntry[];
	};
};

export type CameriScheduleEntry = {
	id: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl: string;
	showUrl?: string;
	subtitles?: string;
	sourceStatus?: string;
};

export type CameriPresentation = {
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
	isBestAvailableEnabled?: number;
	specialMessage?: string | null;
	specialMessage2?: string | null;
	viewAreaName?: string | null;
	seatplanTitle?: string | null;
	ticketSaleStop?: string | null;
	ticketSaleStart?: string | null;
	newBookingUrl?: string | null;
};

export type CameriPresentationResponse =
	| {
			presentation: CameriPresentation;
			serverTime?: string;
	  }
	| {
			error: {
				error: string;
				message?: string;
				data?: string;
			};
	  };

export type CameriSeatplanSeat = {
	n?: string;
	tg?: number;
	rd?: Record<string, unknown>;
	[key: string]: unknown;
};

export type CameriSeatplanRow = {
	n?: string;
	S: Record<string, CameriSeatplanSeat>;
};

export type CameriSeatplanGroup = {
	R: Record<string, CameriSeatplanRow>;
};

export type CameriSeatplanSection = {
	r?: number;
	n?: string;
	G: Record<string, CameriSeatplanGroup>;
};

export type CameriSeatplanResponse = {
	S: Record<string, CameriSeatplanSection>;
	[key: string]: unknown;
};

export type CameriSeatStatusResponse = {
	seats: Record<string, number | string>;
};

export type CameriSeatAvailabilityFetchResult = {
	presentationId: string;
	uuid: string | null;
	presentation: CameriPresentation | null;
	seatplan: CameriSeatplanResponse | null;
	seatStatus: CameriSeatStatusResponse | null;
	sourceStatus: string;
	errors: string[];
};

export type FlattenedSeat = {
	key: string;
	sectionId: string;
	sectionLabel: string;
	sectionMatchKind: 'group_a' | 'group_b' | 'excluded' | 'unknown';
	groupId: string;
	rowId: string;
	rowLabel: string;
	seatId: string;
	seatLabel: string;
};

export type ParsedSeatAvailability = {
	available: boolean;
	availabilityType: AvailabilityType;
	availableInPreferred: boolean;
	matchedRows: string[];
	matchedZones: string[];
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
	available: boolean;
	availabilityType: AvailabilityType;
	availableInPreferred?: boolean;
	matchedZones?: string[];
	matchedRows?: string[];
	availableSeatCount?: number;
	sourceStatus?: string;
	sourceConfidence: SourceConfidence;
	availableInPreferredRows?: boolean;
};
