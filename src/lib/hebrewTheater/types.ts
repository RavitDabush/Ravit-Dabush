import { TheaterNormalizedPerformance, TheaterSourceConfidence } from '@/lib/theater/types';

export type SourceConfidence = TheaterSourceConfidence;

export type HebrewTheaterShow = {
	id?: number;
	title?: string;
	url?: string;
	permalink?: string;
	events?: HebrewTheaterEvent[];
};

export type HebrewTheaterPricelistItem = {
	ticket_type?: number;
	ticket_type_name?: string;
	level_name?: string | null;
	price?: number;
	condition?: string;
};

export type HebrewTheaterEvent = {
	show?: number;
	id?: number;
	title?: string;
	name?: string;
	show_date?: string;
	show_time?: string;
	start_date?: string;
	start_time?: string;
	end_date?: string;
	end_time?: string;
	event_place?: string;
	permalink?: string;
	tickets_available?: boolean;
	availability?: boolean;
	visibility?: boolean;
	website_available?: number | boolean;
	website_left_tickets_count?: number;
	website_all_left_tickets_count?: number;
	website_visibility_start?: string;
	website_visibility_end?: string;
	pricelist?: HebrewTheaterPricelistItem[];
	website_pricelist?: HebrewTheaterPricelistItem[];
};

export type HebrewTheaterScheduleEntry = {
	id: string;
	eventId: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl: string;
	sourceStatus: string;
	ticketsAvailable?: boolean;
	leftTicketsCount?: number;
	ticketSaleStart?: string;
	ticketSaleStop?: string;
};

export type HebrewTheaterSeatAvailabilityFetchResult = {
	eventId: string;
	html: string;
	sourceStatus: string;
	errors: string[];
};

export type ParsedHebrewTheaterSeatAvailability = {
	availableInPreferredRows: boolean;
	matchedSections: string[];
	matchedRows: string[];
	matchedRowDisplayLabels?: string[];
	availableSeatCount: number;
	sourceStatus: string;
	sourceConfidence: SourceConfidence;
};

export type NormalizedPerformance = TheaterNormalizedPerformance;
