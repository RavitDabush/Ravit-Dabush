import 'server-only';

import { fetchAvailabilityBatch } from './fetchAvailability';
import { fetchPresentations } from './fetchPresentations';
import { parseSeatAvailability } from './parseSeatAvailability';
import { parsePresentations } from './parsePresentations';
import { getDurationMs } from '@/lib/theater/observability';
import { resolveSaleLifecycle } from '@/lib/theater/resolveSaleLifecycle';
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

function getSeatingMatchTypeCounts(performances: NormalizedPerformance[]) {
	const rowBasedMatchCount = performances.filter(performance => performance.availabilityType === 'row').length;

	return {
		rowBasedMatchCount,
		nonRowBasedMatchCount: performances.length - rowBasedMatchCount
	};
}

export function normalizePerformance(
	entry: CameriScheduleEntry,
	result: CameriSeatAvailabilityFetchResult | undefined
): NormalizedPerformance {
	const saleLifecycle = resolveSaleLifecycle(entry, {
		soldout: result?.presentation?.soldout,
		ticketSaleStart: result?.presentation?.ticketSaleStart ?? entry.ticketSaleStart,
		ticketSaleStop: result?.presentation?.ticketSaleStop ?? entry.ticketSaleStop
	});

	if (result?.presentation && result.seatplan && result.seatStatus) {
		const parsedAvailability = parseSeatAvailability(result.seatplan, result.seatStatus);

		return {
			id: entry.id,
			showName: result.presentation.featureName || entry.showName,
			date: result.presentation.businessDate || entry.date,
			time: entry.time,
			venue: result.presentation.venueName || entry.venue,
			purchaseUrl: entry.purchaseUrl,
			hasPreferredAvailability: parsedAvailability.availableInPreferred,
			availabilityType: parsedAvailability.availabilityType,
			matchedSections: parsedAvailability.matchedSections,
			matchedRows: parsedAvailability.matchedRows,
			availableSeatCount: parsedAvailability.availableSeatCount,
			sourceStatus: `${result.sourceStatus} | ${parsedAvailability.sourceStatus}`,
			sourceConfidence: parsedAvailability.sourceConfidence,
			saleLifecycle
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
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedSections: [],
			matchedRows: [],
			sourceStatus: `${result.sourceStatus} | seat_level_data_required`,
			sourceConfidence: 'medium',
			saleLifecycle
		};
	}

	return {
		id: entry.id,
		showName: entry.showName,
		date: entry.date,
		time: entry.time,
		venue: entry.venue,
		purchaseUrl: entry.purchaseUrl,
		hasPreferredAvailability: false,
		availabilityType: 'unknown',
		matchedSections: [],
		matchedRows: [],
		sourceStatus: result?.sourceStatus ?? entry.sourceStatus,
		sourceConfidence: getFallbackConfidence(result),
		saleLifecycle
	};
}

export async function getNormalizedAvailablePerformances(): Promise<NormalizedPerformance[]> {
	const startedAt = Date.now();
	const presentationsStartedAt = Date.now();
	const presentationsResponse = await fetchPresentations();
	const presentationsDurationMs = getDurationMs(presentationsStartedAt);
	const discoveryStartedAt = Date.now();
	const presentationEntries = parsePresentations(presentationsResponse);
	const discoveryDurationMs = getDurationMs(discoveryStartedAt);
	const availabilityStartedAt = Date.now();
	const availabilityResults = await fetchAvailabilityBatch(presentationEntries);
	const availabilityDurationMs = getDurationMs(availabilityStartedAt);
	const resultMap = new Map(availabilityResults.map(result => [result.presentationId, result]));

	const performances = presentationEntries
		.map(entry => normalizePerformance(entry, resultMap.get(entry.id)))
		.filter(performance => performance.hasPreferredAvailability)
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));

	console.info('[cameri-normalization]', {
		durationMs: getDurationMs(startedAt),
		presentationsDurationMs,
		discoveryDurationMs,
		availabilityDurationMs,
		presentationsCount: presentationsResponse.presentations?.length ?? 0,
		rawPerformancesDiscoveredCount: presentationsResponse.presentations?.length ?? 0,
		relevantPerformancesCount: presentationEntries.length,
		availabilityCheckedCount: availabilityResults.length,
		availabilityFailedCount: availabilityResults.filter(result => result.errors.length > 0).length,
		performancesCount: performances.length,
		finalPerformancesCount: performances.length
	});
	console.info('[cameri-seating-match-types]', getSeatingMatchTypeCounts(performances));

	return performances;
}

export async function getNormalizedSaleLifecyclePerformances(): Promise<NormalizedPerformance[]> {
	const presentationsResponse = await fetchPresentations();
	const presentationEntries = parsePresentations(presentationsResponse);

	return presentationEntries
		.map(entry => normalizePerformance(entry, undefined))
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
