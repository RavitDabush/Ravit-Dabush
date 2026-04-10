import 'server-only';

import { fetchAvailabilityBatch } from './fetchAvailability';
import { fetchSchedule } from './fetchSchedule';
import { parseAvailability } from './parseAvailability';
import { parseSchedule } from './parseSchedule';
import {
	CameriScheduleEntry,
	CameriSeatAvailabilityFetchResult,
	NormalizedPerformance,
	SourceConfidence
} from './types';

function getFallbackConfidence(result: CameriSeatAvailabilityFetchResult | undefined): SourceConfidence {
	if (!result) {
		return 'low';
	}

	if (result.presentation) {
		return 'medium';
	}

	return 'low';
}

export function normalizePerformance(
	entry: CameriScheduleEntry,
	result: CameriSeatAvailabilityFetchResult | undefined
): NormalizedPerformance {
	if (result?.presentation && result.seatplan && result.seatStatus) {
		const parsedAvailability = parseAvailability(result.seatplan, result.seatStatus);

		return {
			id: entry.id,
			showName: result.presentation.featureName || entry.showName,
			date: result.presentation.businessDate || entry.date,
			time: entry.time,
			venue: result.presentation.venueName || entry.venue,
			purchaseUrl: entry.purchaseUrl,
			available: parsedAvailability.available,
			availabilityType: parsedAvailability.availabilityType,
			availableInPreferred: parsedAvailability.availableInPreferred,
			matchedZones: parsedAvailability.matchedZones,
			matchedRows: parsedAvailability.matchedRows,
			availableSeatCount: parsedAvailability.availableSeatCount,
			sourceStatus: `${result.sourceStatus} | ${parsedAvailability.sourceStatus}`,
			sourceConfidence: parsedAvailability.sourceConfidence,
			availableInPreferredRows: parsedAvailability.availableInPreferred
		};
	}

	if (result?.presentation) {
		return {
			id: entry.id,
			showName: result.presentation.featureName || entry.showName,
			date: result.presentation.businessDate || entry.date,
			time: entry.time,
			venue: result.presentation.venueName || entry.venue,
			purchaseUrl: entry.purchaseUrl,
			available: false,
			availabilityType: 'unknown',
			availableInPreferred: false,
			matchedZones: [],
			matchedRows: [],
			sourceStatus: `${result.sourceStatus} | seat_level_data_required`,
			sourceConfidence: 'medium',
			availableInPreferredRows: false
		};
	}

	return {
		id: entry.id,
		showName: entry.showName,
		date: entry.date,
		time: entry.time,
		venue: entry.venue,
		purchaseUrl: entry.purchaseUrl,
		available: false,
		availabilityType: 'unknown',
		availableInPreferred: false,
		matchedZones: [],
		matchedRows: [],
		sourceStatus: result?.sourceStatus ?? entry.sourceStatus,
		sourceConfidence: getFallbackConfidence(result),
		availableInPreferredRows: false
	};
}

export async function getNormalizedAvailablePerformances(): Promise<NormalizedPerformance[]> {
	const scheduleHtml = await fetchSchedule();
	const scheduleEntries = parseSchedule(scheduleHtml);
	const availabilityResults = await fetchAvailabilityBatch(scheduleEntries);
	const resultMap = new Map(availabilityResults.map(result => [result.presentationId, result]));

	return scheduleEntries
		.map(entry => normalizePerformance(entry, resultMap.get(entry.id)))
		.filter(performance => performance.available)
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
