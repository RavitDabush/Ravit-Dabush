import 'server-only';

import { fetchSeatAvailabilityBatch } from './fetchSeatAvailability';
import { fetchSchedule } from './fetchSchedule';
import { parseSchedule } from './parseSchedule';
import { parseSeatAvailability } from './parseSeatAvailability';
import {
	LessinScheduleEntry,
	LessinSeatAvailabilityFetchResult,
	NormalizedPerformance,
	SourceConfidence
} from './types';

function getSourceConfidence(result: LessinSeatAvailabilityFetchResult): SourceConfidence {
	if (result.presentation && result.seatplan && result.seatStatus) {
		return 'high';
	}

	if (result.presentation) {
		return 'medium';
	}

	return 'low';
}

export function normalizePerformance(
	entry: LessinScheduleEntry,
	result: LessinSeatAvailabilityFetchResult | undefined
): NormalizedPerformance {
	if (result?.presentation && result.seatplan && result.seatStatus) {
		const parsedAvailability = parseSeatAvailability(result.seatplan, result.seatStatus);

		return {
			id: entry.id,
			showName: result.presentation.featureName || entry.showName,
			date: result.presentation.businessDate || entry.date,
			time: entry.time,
			venue: result.presentation.venueName || entry.venue,
			purchaseUrl: entry.purchaseUrl,
			availableInPreferredRows: parsedAvailability.availableInPreferredRows,
			matchedRows: parsedAvailability.matchedRows,
			availableSeatCount: parsedAvailability.availableSeatCount,
			sourceStatus: entry.sourceStatus,
			sourceConfidence: 'high'
		};
	}

	return {
		id: entry.id,
		showName: entry.showName,
		date: entry.date,
		time: entry.time,
		venue: entry.venue,
		purchaseUrl: entry.purchaseUrl,
		availableInPreferredRows: false,
		matchedRows: [],
		sourceStatus: entry.sourceStatus,
		sourceConfidence: result ? getSourceConfidence(result) : 'low'
	};
}

export async function getNormalizedPreferredPerformances(): Promise<NormalizedPerformance[]> {
	const scheduleHtml = await fetchSchedule();
	const scheduleEntries = parseSchedule(scheduleHtml);
	const availabilityResults = await fetchSeatAvailabilityBatch(scheduleEntries);
	const resultMap = new Map(availabilityResults.map(result => [result.presentationId, result]));

	return scheduleEntries
		.map(entry => normalizePerformance(entry, resultMap.get(entry.id)))
		.filter(performance => performance.availableInPreferredRows)
		.sort((left, right) => {
			const leftDateTime = `${left.date}T${left.time}`;
			const rightDateTime = `${right.date}T${right.time}`;

			return leftDateTime.localeCompare(rightDateTime);
		});
}
