import 'server-only';

import { HabimaScheduleEntry, HabimaScheduleJson, HabimaSchedulePresentation } from './types';

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

export function parseSchedule(schedule: HabimaScheduleJson): HabimaScheduleEntry[] {
	const hebrewPresentations = schedule.presentations.he ?? {};
	const entries = Object.entries(hebrewPresentations).flatMap(([sourceShowKey, presentations]) =>
		presentations.map(presentation => toScheduleEntry(sourceShowKey, presentation, schedule))
	);

	return entries.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
