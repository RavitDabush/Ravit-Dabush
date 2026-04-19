import 'server-only';

import { CameriPresentationListItem, CameriPresentationListResponse, CameriScheduleEntry } from './types';

const EXCLUDED_VENUES = new Set(['קפה תאטרון', 'קאמרי 4']);
const MAX_FILTERED_VENUE_SAMPLE_TITLES = 3;

type FilteredVenueStats = {
	totalFiltered: number;
	venueCounts: Record<string, number>;
	sampleTitlesByVenue: Record<string, string[]>;
};

type DiscoveryStats = {
	skippedCount: number;
	duplicatePresentationCount: number;
};

function parseDateTime(value: string | null | undefined): Date | null {
	if (!value) {
		return null;
	}

	const normalized = value.replace(' ', 'T');
	const parsed = new Date(normalized);

	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPresentationTime(value: string): string {
	const [, time = ''] = value.split(' ');
	return time.slice(0, 5);
}

function isExcludedVenue(venueName: string | null | undefined): boolean {
	if (!venueName) {
		return false;
	}

	return EXCLUDED_VENUES.has(venueName.trim());
}

function isDiscoverablePresentation(presentation: CameriPresentationListItem, now: Date): boolean {
	if (presentation.soldout) {
		return false;
	}

	if (!presentation.id || !presentation.featureName || !presentation.businessDate || !presentation.dateTime) {
		return false;
	}

	const ticketSaleStop = parseDateTime(presentation.ticketSaleStop);

	if (ticketSaleStop && ticketSaleStop.getTime() <= now.getTime()) {
		return false;
	}

	return true;
}

function createFilteredVenueStats(): FilteredVenueStats {
	return {
		totalFiltered: 0,
		venueCounts: {},
		sampleTitlesByVenue: {}
	};
}

function trackFilteredVenue(stats: FilteredVenueStats, presentation: CameriPresentationListItem): void {
	const venueName = presentation.venueName?.trim();

	if (!venueName) {
		return;
	}

	stats.totalFiltered += 1;
	stats.venueCounts[venueName] = (stats.venueCounts[venueName] ?? 0) + 1;

	if (process.env.NODE_ENV !== 'development') {
		return;
	}

	const sampleTitles = stats.sampleTitlesByVenue[venueName] ?? [];

	if (sampleTitles.length >= MAX_FILTERED_VENUE_SAMPLE_TITLES) {
		return;
	}

	const title = presentation.featureName?.trim();

	if (title && !sampleTitles.includes(title)) {
		sampleTitles.push(title);
		stats.sampleTitlesByVenue[venueName] = sampleTitles;
	}
}

function logFilteredVenueStats(stats: FilteredVenueStats): void {
	if (stats.totalFiltered === 0) {
		return;
	}

	console.info('[cameri-filtered-venues]', {
		totalFiltered: stats.totalFiltered,
		venueCounts: stats.venueCounts,
		...(process.env.NODE_ENV === 'development' ? { sampleTitlesByVenue: stats.sampleTitlesByVenue } : {})
	});
}

function normalizePresentation(presentation: CameriPresentationListItem): CameriScheduleEntry {
	return {
		id: `${presentation.id}`,
		showName: presentation.featureName.trim(),
		date: presentation.businessDate.trim(),
		time: getPresentationTime(presentation.dateTime),
		venue: presentation.venueName?.trim() || undefined,
		purchaseUrl: `https://tickets.cameri.co.il/order/${presentation.id}`,
		sourceStatus: 'ticketing_presentations',
		ticketSaleStart: presentation.ticketSaleStart ?? null,
		ticketSaleStop: presentation.ticketSaleStop ?? null
	};
}

export function parsePresentations(
	response: CameriPresentationListResponse,
	now: Date = new Date()
): CameriScheduleEntry[] {
	const seenIds = new Set<string>();
	const filteredVenueStats = createFilteredVenueStats();
	const presentations = response.presentations ?? [];
	const stats: DiscoveryStats = {
		skippedCount: 0,
		duplicatePresentationCount: 0
	};
	const discoverablePresentations = presentations.filter(presentation => {
		if (isExcludedVenue(presentation.venueName)) {
			trackFilteredVenue(filteredVenueStats, presentation);
			stats.skippedCount += 1;
			return false;
		}

		if (!isDiscoverablePresentation(presentation, now)) {
			stats.skippedCount += 1;
			return false;
		}

		return true;
	});

	logFilteredVenueStats(filteredVenueStats);

	const entries = discoverablePresentations
		.map(normalizePresentation)
		.filter(entry => {
			if (!entry.time || seenIds.has(entry.id)) {
				stats.skippedCount += 1;

				if (seenIds.has(entry.id)) {
					stats.duplicatePresentationCount += 1;
				}

				return false;
			}

			seenIds.add(entry.id);
			return true;
		})
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));

	console.info('[cameri-discovery]', {
		presentationsCount: presentations.length,
		rawPerformancesDiscoveredCount: presentations.length,
		discoverableCount: entries.length,
		relevantPerformancesCount: entries.length,
		skippedCount: stats.skippedCount,
		duplicatePresentationCount: stats.duplicatePresentationCount
	});

	return entries;
}
