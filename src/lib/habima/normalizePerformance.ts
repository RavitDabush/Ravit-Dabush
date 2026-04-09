import 'server-only';

import { fetchSchedule } from './fetchSchedule';
import { fetchSeatAvailabilityBatch } from './fetchSeatAvailability';
import { parseSchedule } from './parseSchedule';
import { parseSeatAvailability } from './parseSeatAvailability';
import {
	HabimaScheduleEntry,
	HabimaSeatAvailabilityFetchResult,
	NormalizedPerformance,
	SourceConfidence
} from './types';

function getSourceConfidence(result: HabimaSeatAvailabilityFetchResult): SourceConfidence {
	if (result.presentation && result.seatplan && result.seatStatus) {
		return 'high';
	}

	if (result.presentation) {
		return 'medium';
	}

	return 'low';
}

export function normalizePerformance(
	entry: HabimaScheduleEntry,
	result: HabimaSeatAvailabilityFetchResult | undefined
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
			matchedSections: parsedAvailability.matchedSections,
			availableSeatCount: parsedAvailability.availableSeatCount,
			sourceStatus: parsedAvailability.sourceStatus,
			sourceConfidence: parsedAvailability.sourceConfidence
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
		matchedSections: [],
		sourceStatus: result?.sourceStatus,
		sourceConfidence: result ? getSourceConfidence(result) : 'low'
	};
}

export async function getNormalizedPreferredPerformances(): Promise<NormalizedPerformance[]> {
	const schedule = await fetchSchedule();
	const scheduleEntries = parseSchedule(schedule);
	const availabilityResults = await fetchSeatAvailabilityBatch(scheduleEntries);
	const resultMap = new Map(availabilityResults.map(result => [result.presentationId, result]));

	return scheduleEntries
		.map(entry => normalizePerformance(entry, resultMap.get(entry.id)))
		.filter(performance => performance.availableInPreferredRows)
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
