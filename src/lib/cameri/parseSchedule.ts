import 'server-only';

import { CameriScheduleCalendarEvent, CameriScheduleEntry, CameriScheduleTimeEntry } from './types';

const CALENDAR_EVENTS_PATTERN = /let\s+calendarEvents\s*=\s*(\[[\s\S]*?\]);/;

function extractCalendarEvents(html: string): CameriScheduleCalendarEvent[] {
	const match = html.match(CALENDAR_EVENTS_PATTERN);

	if (!match) {
		throw new Error('Unable to locate Cameri calendar events payload');
	}

	const parsed = JSON.parse(match[1]) as unknown;

	if (!Array.isArray(parsed)) {
		throw new Error('Unexpected Cameri calendar events payload shape');
	}

	return parsed as CameriScheduleCalendarEvent[];
}

function normalizeTimeEntry(
	event: CameriScheduleCalendarEvent,
	timeEntry: CameriScheduleTimeEntry,
	seenIds: Set<string>
): CameriScheduleEntry | null {
	const [, time, subtitles, purchaseId] = timeEntry;
	const showName = event.extendedProps?.show_name?.trim();
	const date = event.start?.trim();
	const id = `${purchaseId ?? ''}`.trim();

	if (!showName || !date || !id || seenIds.has(id)) {
		return null;
	}

	seenIds.add(id);

	return {
		id,
		showName,
		date,
		time: `${time ?? ''}`.trim(),
		purchaseUrl: `https://tickets.cameri.co.il/order/${id}`,
		showUrl: event.extendedProps?.show_permalink?.trim(),
		subtitles: subtitles?.trim() || undefined,
		sourceStatus: 'calendar_events'
	};
}

export function parseSchedule(html: string): CameriScheduleEntry[] {
	const events = extractCalendarEvents(html);
	const seenIds = new Set<string>();
	const entries: CameriScheduleEntry[] = [];

	for (const event of events) {
		for (const timeEntry of event.extendedProps?.times ?? []) {
			const entry = normalizeTimeEntry(event, timeEntry, seenIds);

			if (entry) {
				entries.push(entry);
			}
		}
	}

	return entries.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
