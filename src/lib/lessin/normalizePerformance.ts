import 'server-only';

import { fetchAllPresentations, fetchFeatures } from './fetchFeatures';
import { fetchSeatAvailabilityBatch } from './fetchSeatAvailability';
import { parseTicketingDiscovery } from './parseDiscovery';
import { parseSeatAvailability } from './parseSeatAvailability';
import { resolveSaleLifecycle } from '@/lib/theater/resolveSaleLifecycle';
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

function getSeatAvailabilitySourceStatus(
	fallbackSourceStatus: string | undefined,
	sectionDebugStatus: string,
	matchedSections: string[]
): string {
	const parts = [fallbackSourceStatus, `seat-section:${sectionDebugStatus}`];

	if (matchedSections.length > 0) {
		parts.push(`matched-sections:${matchedSections.join(', ')}`);
	}

	return parts.filter(Boolean).join(' | ');
}

function resolveLessinLifecycle(entry: LessinScheduleEntry, result: LessinSeatAvailabilityFetchResult | undefined) {
	return resolveSaleLifecycle(entry, {
		soldout: result?.presentation?.soldout ?? entry.isSoldOut,
		ticketSaleStart: result?.presentation?.ticketSaleStart ?? entry.ticketSaleStart,
		ticketSaleStop: result?.presentation?.ticketSaleStop ?? entry.ticketSaleStop
	});
}

export function normalizePerformance(
	entry: LessinScheduleEntry,
	result: LessinSeatAvailabilityFetchResult | undefined
): NormalizedPerformance {
	const saleLifecycle = resolveLessinLifecycle(entry, result);

	if (result?.presentation && result.seatplan && result.seatStatus) {
		const parsedAvailability = parseSeatAvailability(result.seatplan, result.seatStatus);
		const sourceConfidence: SourceConfidence = parsedAvailability.sectionDebugStatus === 'ambiguous' ? 'medium' : 'high';

		return {
			id: entry.id,
			showName: result.presentation.featureName || entry.showName,
			date: result.presentation.businessDate || entry.date,
			time: entry.time,
			venue: result.presentation.venueName || entry.venue,
			purchaseUrl: entry.purchaseUrl,
			hasPreferredAvailability: parsedAvailability.availableInPreferredRows,
			availabilityType: parsedAvailability.availableInPreferredRows ? 'row' : 'unknown',
			matchedRows: parsedAvailability.matchedRows,
			matchedSections: parsedAvailability.matchedSections,
			availableSeatCount: parsedAvailability.availableSeatCount,
			sourceStatus: getSeatAvailabilitySourceStatus(
				entry.sourceStatus,
				parsedAvailability.sectionDebugStatus,
				parsedAvailability.matchedSections
			),
			sourceConfidence,
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
		matchedRows: [],
		matchedSections: [],
		sourceStatus: entry.sourceStatus,
		sourceConfidence: result ? getSourceConfidence(result) : 'low',
		saleLifecycle
	};
}

export async function getNormalizedPreferredPerformances(): Promise<NormalizedPerformance[]> {
	const features = await fetchFeatures();
	const presentations = await fetchAllPresentations(features);
	const discoveryEntries = parseTicketingDiscovery(features, presentations);
	const availabilityResults = await fetchSeatAvailabilityBatch(discoveryEntries);
	const resultMap = new Map(availabilityResults.map(result => [result.presentationId, result]));

	return discoveryEntries
		.map(entry => normalizePerformance(entry, resultMap.get(entry.id)))
		.filter(performance => performance.hasPreferredAvailability)
		.sort((left, right) => {
			const leftDateTime = `${left.date}T${left.time}`;
			const rightDateTime = `${right.date}T${right.time}`;

			return leftDateTime.localeCompare(rightDateTime);
		});
}

export async function getNormalizedSaleLifecyclePerformances(): Promise<NormalizedPerformance[]> {
	const features = await fetchFeatures();
	const presentations = await fetchAllPresentations(features);
	const discoveryEntries = parseTicketingDiscovery(features, presentations);

	return discoveryEntries
		.map(entry => normalizePerformance(entry, undefined))
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
