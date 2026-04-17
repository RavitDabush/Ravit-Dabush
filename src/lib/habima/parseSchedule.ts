import 'server-only';

import { HabimaScheduleEntry, HabimaScheduleJson, HabimaSchedulePresentation } from './types';

const HABIMA_4_VENUE_NAME = '\u05d0\u05d5\u05dc\u05dd \u05d4\u05d1\u05d9\u05de\u05d4 4';
const MAX_FILTERED_VENUE_SAMPLE_TITLES = 3;

type FilteredVenueStats = {
	totalFiltered: number;
	venueCounts: Record<string, number>;
	sampleTitlesByVenue: Record<string, string[]>;
};

function padTwoDigits(value: number): string {
	return String(value).padStart(2, '0');
}

function getJerusalemWallClockParts(timestampSeconds: number): { date: string; time: string } {
	const timestamp = new Date(timestampSeconds * 1000);
	const year = timestamp.getUTCFullYear();
	const month = padTwoDigits(timestamp.getUTCMonth() + 1);
	const day = padTwoDigits(timestamp.getUTCDate());
	const hours = padTwoDigits(timestamp.getUTCHours());
	const minutes = padTwoDigits(timestamp.getUTCMinutes());

	return {
		date: `${year}-${month}-${day}`,
		time: `${hours}:${minutes}`
	};
}

function toScheduleEntry(
	sourceShowKey: string,
	presentation: HabimaSchedulePresentation,
	schedule: HabimaScheduleJson
): HabimaScheduleEntry {
	const show = schedule.shows.he?.[sourceShowKey];
	const venue = schedule.venues.he?.[String(presentation.venue_id)];
	const wallClockParts = getJerusalemWallClockParts(presentation.time);

	return {
		id: String(presentation.id),
		showName: show?.title?.trim() || sourceShowKey,
		date: wallClockParts.date,
		time: wallClockParts.time,
		venue,
		purchaseUrl: `https://tickets.habima.co.il/order/${presentation.id}`,
		showUrl: show?.url,
		sourceShowKey
	};
}

function isExcludedVenue(venueName: string | undefined): boolean {
	return venueName?.trim() === HABIMA_4_VENUE_NAME;
}

function createFilteredVenueStats(): FilteredVenueStats {
	return {
		totalFiltered: 0,
		venueCounts: {},
		sampleTitlesByVenue: {}
	};
}

function trackFilteredVenue(stats: FilteredVenueStats, entry: HabimaScheduleEntry): void {
	const venueName = entry.venue?.trim();

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

	const title = entry.showName.trim();

	if (title && !sampleTitles.includes(title)) {
		sampleTitles.push(title);
		stats.sampleTitlesByVenue[venueName] = sampleTitles;
	}
}

function logFilteredVenueStats(stats: FilteredVenueStats): void {
	if (stats.totalFiltered === 0) {
		return;
	}

	console.info('[habima-filtered-venues]', {
		totalFiltered: stats.totalFiltered,
		venueCounts: stats.venueCounts,
		...(process.env.NODE_ENV === 'development' ? { sampleTitlesByVenue: stats.sampleTitlesByVenue } : {})
	});
}

export function parseSchedule(schedule: HabimaScheduleJson): HabimaScheduleEntry[] {
	const hebrewPresentations = schedule.presentations.he ?? {};
	const seenIds = new Set<string>();
	let duplicatePresentationCount = 0;
	const filteredVenueStats = createFilteredVenueStats();
	const discoveredEntries = Object.entries(hebrewPresentations).flatMap(([sourceShowKey, presentations]) =>
		presentations.map(presentation => {
			const presentationId = String(presentation.id);

			if (seenIds.has(presentationId)) {
				duplicatePresentationCount += 1;
			}

			seenIds.add(presentationId);

			return toScheduleEntry(sourceShowKey, presentation, schedule);
		})
	);
	const entries = discoveredEntries.filter(entry => {
		if (isExcludedVenue(entry.venue)) {
			trackFilteredVenue(filteredVenueStats, entry);
			return false;
		}

		return true;
	});

	logFilteredVenueStats(filteredVenueStats);

	console.info('[habima-discovery]', {
		scheduleCount: discoveredEntries.length,
		discoverableCount: entries.length,
		skippedCount: filteredVenueStats.totalFiltered,
		duplicatePresentationCount
	});

	return entries.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
