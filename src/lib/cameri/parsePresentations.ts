import 'server-only';

import { CameriPresentationListItem, CameriPresentationListResponse, CameriScheduleEntry } from './types';

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

function normalizePresentation(presentation: CameriPresentationListItem): CameriScheduleEntry {
	return {
		id: `${presentation.id}`,
		showName: presentation.featureName.trim(),
		date: presentation.businessDate.trim(),
		time: getPresentationTime(presentation.dateTime),
		venue: presentation.venueName?.trim() || undefined,
		purchaseUrl: `https://tickets.cameri.co.il/order/${presentation.id}`,
		sourceStatus: 'ticketing_presentations'
	};
}

export function parsePresentations(
	response: CameriPresentationListResponse,
	now: Date = new Date()
): CameriScheduleEntry[] {
	const seenIds = new Set<string>();

	return (response.presentations ?? [])
		.filter(presentation => isDiscoverablePresentation(presentation, now))
		.map(normalizePresentation)
		.filter(entry => {
			if (!entry.time || seenIds.has(entry.id)) {
				return false;
			}

			seenIds.add(entry.id);
			return true;
		})
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
