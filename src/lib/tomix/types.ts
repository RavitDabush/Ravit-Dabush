import { TheaterNormalizedPerformance, TheaterSourceConfidence } from '@/lib/theater/types';

export type SourceConfidence = TheaterSourceConfidence;

export type TomixProductImage = {
	src?: string;
	thumbnail?: string;
	alt?: string;
};

export type TomixProductCategory = {
	id: number;
	name?: string;
	slug?: string;
};

export type TomixStoreProduct = {
	id: number;
	name: string;
	slug: string;
	permalink: string;
	categories?: TomixProductCategory[];
	images?: TomixProductImage[];
	is_in_stock?: boolean;
};

export type TomixEventerTicketType = {
	_id: string;
	name?: string;
	price?: number;
	remaining?: number;
	toDate?: string;
	areas?: unknown[];
};

export type TomixEventerEvent = {
	_id: string;
	status?: number;
	name?: string;
	locationDescription?: string;
	schedule?: {
		start?: string;
		end?: string;
		openDoors?: string;
	};
	ticketTypes?: TomixEventerTicketType[];
	soldOut?: boolean;
	linkName?: string;
	startString?: string;
	dateString?: string;
	timeString?: string;
	dayString?: string;
	start?: string;
};

export type TomixEventerDataResponse = {
	production?: string;
	linkName?: string;
	tags?: string[];
	events?: TomixEventerEvent[];
};

export type TomixEventerSeat = {
	_id: string;
	arena?: string;
	place?: string;
	ticketTypes?: string[];
	status?: number;
	isSeat?: boolean;
};

export type TomixEventerSource = {
	product: TomixStoreProduct;
	iframeUrl: string;
	getDataUrl: string;
};

export type TomixScheduleEntry = {
	id: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl?: string;
	productUrl: string;
	eventId: string;
	ticketTypeIds: string[];
	sourceStatus?: string;
	ticketSaleStop?: string;
	soldOut?: boolean;
};

export type TomixSeatAvailabilityFetchResult = {
	eventId: string;
	seats: TomixEventerSeat[];
	sourceStatus: string;
	errors: string[];
};

export type ParsedTomixSeatAvailability = {
	availableInPreferredRows: boolean;
	matchedSections: string[];
	matchedRows: string[];
	availableSeatCount: number;
	sourceStatus: string;
	sourceConfidence: SourceConfidence;
};

export type NormalizedPerformance = TheaterNormalizedPerformance;
