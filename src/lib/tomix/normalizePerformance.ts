import 'server-only';

import { fetchEventerData, fetchEventerEventDetailsByLinkName, resolveEventerSource } from './fetchEventerPerformances';
import { fetchTomixTheaterProducts } from './fetchProducts';
import { fetchTomixSeatAvailabilityBatch } from './fetchSeatAvailability';
import { parseTomixSeatAvailability } from './parseSeatAvailability';
import { getDurationMs } from '@/lib/theater/observability';
import { resolveSaleLifecycle } from '@/lib/theater/resolveSaleLifecycle';
import {
	NormalizedPerformance,
	TomixEventerEvent,
	TomixEventerSource,
	TomixScheduleEntry,
	TomixSeatAvailabilityFetchResult,
	TomixStoreProduct
} from './types';

const TOMIX_EVENT_DISCOVERY_CONCURRENCY = 3;
const TOMIX_SEAT_FETCH_CONCURRENCY = 8;

type TomixCollectionResult = {
	products: Awaited<ReturnType<typeof fetchTomixTheaterProducts>>;
	entries: TomixScheduleEntry[];
	productsDurationMs: number;
	performancesDurationMs: number;
	discoveryDurationMs: number;
	sourceResolvedCount: number;
	sourceSkippedCount: number;
	sourceFailedCount: number;
	eventDataFailedCount: number;
	rawPerformancesDiscoveredCount: number;
	relevantPerformancesCount: number;
	irrelevantPerformancesCount: number;
	duplicatePerformanceCount: number;
};

type ProductDiscoveryResult = {
	entries: TomixScheduleEntry[];
	sourceResolved: boolean;
	sourceFailed: boolean;
	eventDataFailed: boolean;
	rawPerformancesDiscoveredCount: number;
};

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

function toDatePart(value: string | undefined): string {
	if (!value) {
		return '';
	}

	return value.includes('T') ? value.slice(0, 10) : value.split(' ')[0];
}

function toTimePart(value: string | undefined): string {
	if (!value) {
		return '';
	}

	if (value.includes('T')) {
		return value.slice(11, 16);
	}

	return value.split(' ')[1]?.slice(0, 5) ?? '';
}

function getTicketSaleStop(event: TomixEventerEvent): string | undefined {
	const stops =
		event.ticketTypes
			?.map(ticketType => ticketType.toDate)
			.filter((value): value is string => Boolean(value))
			.sort() ?? [];

	return stops[0];
}

function getTicketTypeIds(event: TomixEventerEvent): string[] {
	return event.ticketTypes?.map(ticketType => ticketType._id).filter(Boolean) ?? [];
}

function getPurchaseUrl(event: TomixEventerEvent, source: TomixEventerSource): string {
	return event.linkName ? `https://www.eventer.co.il/${event.linkName}` : source.iframeUrl;
}

function mapEventToEntry(source: TomixEventerSource, event: TomixEventerEvent): TomixScheduleEntry | null {
	const start = event.schedule?.start ?? event.start;
	const date = toDatePart(start);
	const time = toTimePart(start);

	if (!event._id || !date || !time) {
		return null;
	}

	return {
		id: `tomix-${event._id}`,
		eventId: event._id,
		showName: event.name || source.product.name,
		date,
		time,
		venue: event.locationDescription,
		purchaseUrl: getPurchaseUrl(event, source),
		productUrl: source.product.permalink,
		ticketTypeIds: getTicketTypeIds(event),
		sourceStatus: 'eventer:getData',
		ticketSaleStop: getTicketSaleStop(event),
		soldOut: event.soldOut,
		arena: event.arena
	};
}

async function enrichEventWithArenaMetadata(event: TomixEventerEvent): Promise<TomixEventerEvent> {
	if (event.arena || !event.linkName) {
		return event;
	}

	try {
		const detailedEvent = await fetchEventerEventDetailsByLinkName(event.linkName);

		if (detailedEvent?._id === event._id && detailedEvent.arena) {
			return {
				...event,
				arena: detailedEvent.arena
			};
		}
	} catch {
		return event;
	}

	return event;
}

function countDuplicatePerformanceIds(entries: TomixScheduleEntry[]): number {
	const counts = new Map<string, number>();

	for (const entry of entries) {
		counts.set(entry.eventId, (counts.get(entry.eventId) ?? 0) + 1);
	}

	return Array.from(counts.values()).filter(count => count > 1).length;
}

export function normalizePerformance(
	entry: TomixScheduleEntry,
	result: TomixSeatAvailabilityFetchResult | undefined
): NormalizedPerformance {
	const parsedAvailability = result
		? parseTomixSeatAvailability(result.seats, entry.venue, entry.ticketTypeIds, entry.arena)
		: null;
	const saleLifecycle = resolveSaleLifecycle(entry, {
		soldout: entry.soldOut,
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

async function collectEntries(): Promise<TomixCollectionResult> {
	const productsStartedAt = Date.now();
	const products = await fetchTomixTheaterProducts();
	const productsDurationMs = getDurationMs(productsStartedAt);
	const discoveryStartedAt = Date.now();

	const productDiscoveryResults = await mapWithConcurrency<TomixStoreProduct, ProductDiscoveryResult>(
		products,
		TOMIX_EVENT_DISCOVERY_CONCURRENCY,
		async product => {
			let source: TomixEventerSource | null = null;

			try {
				source = await resolveEventerSource(product);

				if (!source) {
					return {
						entries: [],
						sourceResolved: false,
						sourceFailed: false,
						eventDataFailed: false,
						rawPerformancesDiscoveredCount: 0
					};
				}
			} catch {
				return {
					entries: [],
					sourceResolved: false,
					sourceFailed: true,
					eventDataFailed: false,
					rawPerformancesDiscoveredCount: 0
				};
			}

			try {
				const eventerData = await fetchEventerData(source);
				const entries: TomixScheduleEntry[] = [];
				const rawPerformancesDiscoveredCount = eventerData.events?.length ?? 0;

				for (const event of eventerData.events ?? []) {
					const entry = mapEventToEntry(source, await enrichEventWithArenaMetadata(event));

					if (entry) {
						entries.push(entry);
					}
				}

				return {
					entries,
					sourceResolved: true,
					sourceFailed: false,
					eventDataFailed: false,
					rawPerformancesDiscoveredCount
				};
			} catch {
				return {
					entries: [],
					sourceResolved: true,
					sourceFailed: false,
					eventDataFailed: true,
					rawPerformancesDiscoveredCount: 0
				};
			}
		}
	);
	const entries = productDiscoveryResults.flatMap(result => result.entries);
	const discoveryDurationMs = getDurationMs(discoveryStartedAt);
	const sourceResolvedCount = productDiscoveryResults.filter(result => result.sourceResolved).length;
	const sourceFailedCount = productDiscoveryResults.filter(result => result.sourceFailed).length;
	const eventDataFailedCount = productDiscoveryResults.filter(result => result.eventDataFailed).length;
	const rawPerformancesDiscoveredCount = productDiscoveryResults.reduce(
		(sum, result) => sum + result.rawPerformancesDiscoveredCount,
		0
	);
	const relevantPerformancesCount = entries.length;
	const irrelevantPerformancesCount = rawPerformancesDiscoveredCount - relevantPerformancesCount;
	const duplicatePerformanceCount = countDuplicatePerformanceIds(entries);
	const sourceSkippedCount = products.length - sourceResolvedCount - sourceFailedCount;

	console.info('[tomix-discovery]', {
		productsCount: products.length,
		sourceResolvedCount,
		sourceSkippedCount,
		sourceFailedCount,
		eventDataFailedCount,
		rawPerformancesDiscoveredCount,
		relevantPerformancesCount,
		irrelevantPerformancesCount,
		duplicatePerformanceCount
	});
	console.info('[tomix-performances-batch]', {
		productsCount: products.length,
		rawPerformancesDiscoveredCount,
		relevantPerformancesCount,
		durationMs: discoveryDurationMs,
		concurrencyLimit: TOMIX_EVENT_DISCOVERY_CONCURRENCY
	});

	return {
		products,
		entries,
		productsDurationMs,
		performancesDurationMs: discoveryDurationMs,
		discoveryDurationMs,
		sourceResolvedCount,
		sourceSkippedCount,
		sourceFailedCount,
		eventDataFailedCount,
		rawPerformancesDiscoveredCount,
		relevantPerformancesCount,
		irrelevantPerformancesCount,
		duplicatePerformanceCount
	};
}

export async function getNormalizedPreferredPerformances(): Promise<NormalizedPerformance[]> {
	const startedAt = Date.now();
	const collection = await collectEntries();
	const availabilityStartedAt = Date.now();
	const availabilityResults = await fetchTomixSeatAvailabilityBatch(collection.entries, TOMIX_SEAT_FETCH_CONCURRENCY);
	const availabilityDurationMs = getDurationMs(availabilityStartedAt);
	const seatFilteringStartedAt = Date.now();
	const performances = collection.entries.map((entry, index) => normalizePerformance(entry, availabilityResults[index]));
	const finalPerformances = performances
		.filter(performance => performance.hasPreferredAvailability)
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
	const seatFilteringDurationMs = getDurationMs(seatFilteringStartedAt);

	console.info('[tomix-normalization]', {
		durationMs: getDurationMs(startedAt),
		productsDurationMs: collection.productsDurationMs,
		performancesDurationMs: collection.performancesDurationMs,
		discoveryDurationMs: collection.discoveryDurationMs,
		availabilityDurationMs,
		seatFilteringDurationMs,
		productsCount: collection.products.length,
		rawPerformancesDiscoveredCount: collection.rawPerformancesDiscoveredCount,
		relevantPerformancesCount: collection.relevantPerformancesCount,
		availabilityCheckedCount: performances.length,
		finalPerformancesCount: finalPerformances.length
	});

	return finalPerformances;
}
