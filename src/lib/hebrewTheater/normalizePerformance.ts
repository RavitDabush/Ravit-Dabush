import 'server-only';

import { getDurationMs } from '@/lib/theater/observability';
import { resolveSaleLifecycle } from '@/lib/theater/resolveSaleLifecycle';
import { collectHebrewTheaterRawPerformances } from './collectPerformances';
import { parseHebrewTheaterSeatAvailability } from './parseSeatAvailability';
import { HebrewTheaterScheduleEntry, HebrewTheaterSeatAvailabilityFetchResult, NormalizedPerformance } from './types';

export function normalizePerformance(
	entry: HebrewTheaterScheduleEntry,
	result: HebrewTheaterSeatAvailabilityFetchResult | undefined
): NormalizedPerformance {
	const parsedAvailability =
		result?.parsedAvailability ?? (result?.html ? parseHebrewTheaterSeatAvailability(result.html) : null);
	const saleLifecycle = resolveSaleLifecycle(entry, {
		soldout: entry.ticketsAvailable === false || entry.leftTicketsCount === 0,
		ticketSaleStart: entry.ticketSaleStart,
		ticketSaleStop: entry.ticketSaleStop
	});

	return {
		id: entry.id,
		showName: entry.showName,
		date: entry.date,
		time: entry.time,
		venue: entry.venue,
		purchaseUrl: entry.purchaseUrl,
		hasPreferredAvailability: parsedAvailability?.availableInPreferredRows ?? false,
		availabilityType: parsedAvailability?.availableInPreferredRows ? 'row' : 'unknown',
		matchedSections: parsedAvailability?.matchedSections ?? [],
		matchedRows: parsedAvailability?.matchedRows ?? [],
		matchedRowDisplayLabels: parsedAvailability?.matchedRowDisplayLabels,
		availableSeatCount: parsedAvailability?.availableSeatCount,
		sourceStatus: [entry.sourceStatus, result?.sourceStatus, parsedAvailability?.sourceStatus, ...(result?.errors ?? [])]
			.filter(Boolean)
			.join(' | '),
		sourceConfidence: parsedAvailability?.sourceConfidence ?? 'low',
		saleLifecycle
	};
}

export async function getNormalizedPreferredPerformances(): Promise<NormalizedPerformance[]> {
	const startedAt = Date.now();
	const collection = await collectHebrewTheaterRawPerformances();
	const resultMap = new Map(collection.availabilityResults.map(result => [result.eventId, result]));
	const performances = collection.entries
		.map(entry => normalizePerformance(entry, resultMap.get(entry.eventId)))
		.filter(performance => performance.hasPreferredAvailability)
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));

	console.info('[hebrew-theater-normalization]', {
		durationMs: getDurationMs(startedAt),
		discoveryDurationMs: collection.discoveryDurationMs,
		availabilityDurationMs: collection.availabilityDurationMs,
		showsCount: collection.showsCount,
		eventsCount: collection.eventsCount,
		rawPerformancesDiscoveredCount: collection.eventsCount,
		relevantPerformancesCount: collection.entries.length,
		availabilityCheckedCount: collection.availabilityResults.length,
		availabilityFailedCount: collection.availabilityFailedCount,
		performancesCount: performances.length,
		finalPerformancesCount: performances.length
	});

	return performances;
}
