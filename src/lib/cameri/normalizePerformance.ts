import 'server-only';

import { fetchAvailabilityBatch } from './fetchAvailability';
import { fetchPresentations } from './fetchPresentations';
import { parseSeatAvailability } from './parseSeatAvailability';
import { parsePresentations } from './parsePresentations';
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
	const presentationsResponse = await fetchPresentations();
	const presentationEntries = parsePresentations(presentationsResponse);
	const availabilityResults = await fetchAvailabilityBatch(presentationEntries);
	const resultMap = new Map(availabilityResults.map(result => [result.presentationId, result]));

	return presentationEntries
		.map(entry => normalizePerformance(entry, resultMap.get(entry.id)))
		.filter(performance => performance.hasPreferredAvailability)
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}

export async function getNormalizedSaleLifecyclePerformances(): Promise<NormalizedPerformance[]> {
	const presentationsResponse = await fetchPresentations();
	const presentationEntries = parsePresentations(presentationsResponse);

	return presentationEntries
		.map(entry => normalizePerformance(entry, undefined))
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
