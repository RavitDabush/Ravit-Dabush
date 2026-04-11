import 'server-only';

import { LessinFeature, LessinPresentationSummary, LessinScheduleEntry } from './types';

function normalizeTime(dateTime: string): string {
	const match = dateTime.match(/(\d{2}):(\d{2})/);

	if (!match) {
		return '00:00';
	}

	return `${match[1]}:${match[2]}`;
}

function parseLocalDateTime(value: string | null | undefined): Date | null {
	if (!value) {
		return null;
	}

	const normalizedValue = value.replace(' ', 'T');
	const parsedDate = new Date(normalizedValue);

	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isFuturePresentation(presentation: LessinPresentationSummary, now: Date): boolean {
	const presentationDate = parseLocalDateTime(presentation.dateTime);

	if (!presentationDate) {
		return false;
	}

	if (presentation.soldout) {
		return false;
	}

	const saleStopDate = parseLocalDateTime(presentation.ticketSaleStop);

	if (saleStopDate && saleStopDate <= now) {
		return false;
	}

	return presentationDate > now;
}

export function parseTicketingDiscovery(
	features: LessinFeature[],
	presentations: LessinPresentationSummary[],
	now: Date = new Date()
): LessinScheduleEntry[] {
	const featureNameMap = new Map(features.map(feature => [feature.id, feature.name]));
	const dedupedEntries = new Map<string, LessinScheduleEntry>();

	for (const presentation of presentations) {
		if (!isFuturePresentation(presentation, now)) {
			continue;
		}

		const id = String(presentation.id);
		const showName = presentation.featureName || featureNameMap.get(presentation.featureId) || '';

		dedupedEntries.set(id, {
			id,
			showName,
			date: presentation.businessDate,
			time: normalizeTime(presentation.dateTime),
			venue: presentation.venueName || undefined,
			purchaseUrl: `https://lessin.presglobal.store/order/${presentation.id}`,
			sourceStatus: 'ticketing-discovery',
			sourceShowId: String(presentation.featureId),
			isSoldOut: Boolean(presentation.soldout),
			featureId: presentation.featureId,
			seatplanId: presentation.seatplanId,
			ticketSaleStart: presentation.ticketSaleStart ?? null,
			ticketSaleStop: presentation.ticketSaleStop ?? null
		});
	}

	return Array.from(dedupedEntries.values());
}
