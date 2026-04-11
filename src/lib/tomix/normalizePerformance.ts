import 'server-only';

import { fetchEventerData, resolveEventerSource } from './fetchEventerPerformances';
import { fetchTomixTheaterProducts } from './fetchProducts';
import { fetchTomixSeatAvailability } from './fetchSeatAvailability';
import { parseTomixSeatAvailability } from './parseSeatAvailability';
import { resolveSaleLifecycle } from '@/lib/theater/resolveSaleLifecycle';
import {
	NormalizedPerformance,
	TomixEventerEvent,
	TomixEventerSource,
	TomixScheduleEntry,
	TomixSeatAvailabilityFetchResult
} from './types';

const TOMIX_EVENT_DISCOVERY_CONCURRENCY = 3;
const TOMIX_SEAT_FETCH_CONCURRENCY = 8;

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
		soldOut: event.soldOut
	};
}

export function normalizePerformance(
	entry: TomixScheduleEntry,
	result: TomixSeatAvailabilityFetchResult | undefined
): NormalizedPerformance {
	const parsedAvailability = result ? parseTomixSeatAvailability(result.seats, entry.venue, entry.ticketTypeIds) : null;
	const saleLifecycle = resolveSaleLifecycle(entry, {
		soldout: entry.soldOut,
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
		availableSeatCount: parsedAvailability?.availableSeatCount,
		sourceStatus: [entry.sourceStatus, result?.sourceStatus, parsedAvailability?.sourceStatus, ...(result?.errors ?? [])]
			.filter(Boolean)
			.join(' | '),
		sourceConfidence: parsedAvailability?.sourceConfidence ?? 'low',
		saleLifecycle
	};
}

async function collectEntries(): Promise<TomixScheduleEntry[]> {
	const products = await fetchTomixTheaterProducts();

	const entryGroups = await mapWithConcurrency(products, TOMIX_EVENT_DISCOVERY_CONCURRENCY, async product => {
		const source = await resolveEventerSource(product);

		if (!source) {
			return [];
		}

		const eventerData = await fetchEventerData(source);
		const entries: TomixScheduleEntry[] = [];

		for (const event of eventerData.events ?? []) {
			const entry = mapEventToEntry(source, event);

			if (entry) {
				entries.push(entry);
			}
		}

		return entries;
	});

	return entryGroups.flat();
}

export async function getNormalizedPreferredPerformances(): Promise<NormalizedPerformance[]> {
	const entries = await collectEntries();
	const performances = await mapWithConcurrency(entries, TOMIX_SEAT_FETCH_CONCURRENCY, async entry => {
		const availability = await fetchTomixSeatAvailability(entry.eventId);

		return normalizePerformance(entry, availability);
	});

	return performances
		.filter(performance => performance.hasPreferredAvailability)
		.sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`));
}
