import 'server-only';

import { fetchSchedule } from './fetchSchedule';
import { fetchPresentationMetadata, fetchSeatAvailabilityBatch } from './fetchSeatAvailability';
import { parseSchedule } from './parseSchedule';
import { parseSeatAvailability } from './parseSeatAvailability';
import { getDurationMs } from '@/lib/theater/observability';
import { resolveSaleLifecycle } from '@/lib/theater/resolveSaleLifecycle';
import {
	HabimaScheduleEntry,
	HabimaPresentation,
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

function resolveHabimaLifecycle(entry: HabimaScheduleEntry, presentation: HabimaPresentation | null | undefined) {
	return resolveSaleLifecycle(entry, {
		soldout: presentation?.soldout,
		ticketSaleStart: presentation?.ticketSaleStart,
		ticketSaleStop: presentation?.ticketSaleStop
	});
}

export function normalizePerformance(
	entry: HabimaScheduleEntry,
	result: HabimaSeatAvailabilityFetchResult | undefined
): NormalizedPerformance {
	const saleLifecycle = resolveHabimaLifecycle(entry, result?.presentation);

	if (result?.presentation && result.seatplan && result.seatStatus) {
		const parsedAvailability = parseSeatAvailability(result.seatplan, result.seatStatus);
		const availabilityType = parsedAvailability.availableInPreferredRows
			? parsedAvailability.sourceStatus === 'confirmed_table_preferred_seats'
				? 'section'
				: 'row'
			: 'unknown';

		return {
			id: entry.id,
			showName: result.presentation.featureName || entry.showName,
			date: result.presentation.businessDate || entry.date,
			time: entry.time,
			venue: result.presentation.venueName || entry.venue,
			purchaseUrl: entry.purchaseUrl,
			hasPreferredAvailability: parsedAvailability.availableInPreferredRows,
			availabilityType,
			matchedRows: parsedAvailability.matchedRows,
			matchedSections: parsedAvailability.matchedSections,
			availableSeatCount: parsedAvailability.availableSeatCount,
			sourceStatus: parsedAvailability.sourceStatus,
			sourceConfidence: parsedAvailability.sourceConfidence,
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
		sourceStatus: result?.sourceStatus,
		sourceConfidence: result ? getSourceConfidence(result) : 'low',
		saleLifecycle
	};
}

export async function getNormalizedPreferredPerformances(): Promise<NormalizedPerformance[]> {
	const startedAt = Date.now();
	const scheduleStartedAt = Date.now();
	const schedule = await fetchSchedule();
	const scheduleDurationMs = getDurationMs(scheduleStartedAt);
	const discoveryStartedAt = Date.now();
	const scheduleEntries = parseSchedule(schedule);
	const discoveryDurationMs = getDurationMs(discoveryStartedAt);
	const availabilityStartedAt = Date.now();
	const availabilityResults = await fetchSeatAvailabilityBatch(scheduleEntries);
	const availabilityDurationMs = getDurationMs(availabilityStartedAt);
	const resultMap = new Map(availabilityResults.map(result => [result.presentationId, result]));

	const performances = scheduleEntries
		.map(entry => normalizePerformance(entry, resultMap.get(entry.id)))
		.filter(performance => performance.hasPreferredAvailability)
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));

	console.info('[habima-normalization]', {
		durationMs: getDurationMs(startedAt),
		scheduleDurationMs,
		discoveryDurationMs,
		availabilityDurationMs,
		scheduleCount: Object.values(schedule.presentations.he ?? {}).reduce((count, presentations) => {
			return count + presentations.length;
		}, 0),
		discoveryCount: scheduleEntries.length,
		performancesCount: performances.length
	});

	return performances;
}

async function normalizeLifecycleEntry(entry: HabimaScheduleEntry): Promise<NormalizedPerformance> {
	try {
		const response = await fetchPresentationMetadata(entry.id);
		const presentation = response.presentation ?? null;

		return {
			id: entry.id,
			showName: presentation?.featureName || entry.showName,
			date: presentation?.businessDate || entry.date,
			time: entry.time,
			venue: presentation?.venueName || entry.venue,
			purchaseUrl: entry.purchaseUrl,
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedRows: [],
			matchedSections: [],
			sourceStatus: presentation ? 'presentation_metadata' : 'missing_presentation',
			sourceConfidence: presentation ? 'medium' : 'low',
			saleLifecycle: resolveHabimaLifecycle(entry, presentation)
		};
	} catch {
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
			sourceStatus: 'presentation_metadata_unavailable',
			sourceConfidence: 'low',
			saleLifecycle: resolveHabimaLifecycle(entry, null)
		};
	}
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let nextIndex = 0;

	async function worker() {
		while (nextIndex < items.length) {
			const currentIndex = nextIndex++;
			results[currentIndex] = await mapper(items[currentIndex]);
		}
	}

	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));

	return results;
}

export async function getNormalizedSaleLifecyclePerformances(): Promise<NormalizedPerformance[]> {
	const schedule = await fetchSchedule();
	const scheduleEntries = parseSchedule(schedule);
	const performances = await mapWithConcurrency(scheduleEntries, 3, normalizeLifecycleEntry);

	return performances.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
