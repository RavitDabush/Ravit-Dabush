import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePerformance } from './normalizePerformance';
import { parseTomixSeatAvailability } from './parseSeatAvailability';
import type {
	ParsedTomixSeatAvailability,
	TomixEventerSeat,
	TomixScheduleEntry,
	TomixSeatAvailabilityFetchResult
} from './types';

vi.mock('./parseSeatAvailability', () => ({
	parseTomixSeatAvailability: vi.fn()
}));

vi.mock('next/cache', () => ({
	unstable_cache: (callback: unknown) => callback
}));

const parseTomixSeatAvailabilityMock = vi.mocked(parseTomixSeatAvailability);

function createEntry(overrides: Partial<TomixScheduleEntry> = {}): TomixScheduleEntry {
	return {
		id: 'tomix-event-1',
		eventId: 'event-1',
		showName: 'TOMIX Show',
		date: '2026-04-12',
		time: '20:30',
		venue: 'TOMIX Venue',
		purchaseUrl: 'https://www.eventer.co.il/event-1',
		productUrl: 'https://www.to-mix.co.il/product/show/',
		ticketTypeIds: ['ticket-type-1'],
		sourceStatus: 'eventer:getData',
		...overrides
	};
}

function createSeatResult(overrides: Partial<TomixSeatAvailabilityFetchResult> = {}): TomixSeatAvailabilityFetchResult {
	return {
		eventId: 'event-1',
		seats: [{ _id: 'seat-1' } as TomixEventerSeat],
		sourceStatus: 'eventer-seats:ok',
		errors: [],
		...overrides
	};
}

function mockParsedAvailability(overrides: Partial<ParsedTomixSeatAvailability> = {}) {
	parseTomixSeatAvailabilityMock.mockReturnValue({
		availableInPreferredRows: true,
		matchedSections: ['1'],
		matchedRows: ['1', '3'],
		availableSeatCount: 12,
		sourceStatus: 'eventer-place:section_row_seat | venue-sections:TOMIX Venue:1',
		sourceConfidence: 'medium',
		...overrides
	});
}

beforeEach(() => {
	parseTomixSeatAvailabilityMock.mockReset();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('tomix normalizePerformance', () => {
	it('maps parsed seat availability into the shared performance model', () => {
		const entry = createEntry();
		const seatResult = createSeatResult();
		mockParsedAvailability();

		const result = normalizePerformance(entry, seatResult);

		expect(parseTomixSeatAvailabilityMock).toHaveBeenCalledWith(seatResult.seats, entry.venue, entry.ticketTypeIds);
		expect(result).toMatchObject({
			id: 'tomix-event-1',
			showName: 'TOMIX Show',
			date: '2026-04-12',
			time: '20:30',
			venue: 'TOMIX Venue',
			purchaseUrl: 'https://www.eventer.co.il/event-1',
			hasPreferredAvailability: true,
			availabilityType: 'row',
			matchedSections: ['1'],
			matchedRows: ['1', '3'],
			availableSeatCount: 12,
			sourceConfidence: 'medium',
			sourceStatus: 'eventer:getData | eventer-seats:ok | eventer-place:section_row_seat | venue-sections:TOMIX Venue:1'
		});
	});

	it('fails closed when the seat result is missing', () => {
		const result = normalizePerformance(createEntry(), undefined);

		expect(parseTomixSeatAvailabilityMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedSections: [],
			matchedRows: [],
			sourceConfidence: 'low',
			sourceStatus: 'eventer:getData'
		});
		expect(result.availableSeatCount).toBeUndefined();
	});

	it('stays unavailable when parsed seats have no preferred availability', () => {
		mockParsedAvailability({
			availableInPreferredRows: false,
			matchedSections: [],
			matchedRows: [],
			availableSeatCount: 0,
			sourceStatus: 'eventer-place:section_row_seat | venue-sections:fallback-row-only'
		});

		const result = normalizePerformance(createEntry(), createSeatResult());

		expect(result).toMatchObject({
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedSections: [],
			matchedRows: [],
			availableSeatCount: 0,
			sourceConfidence: 'medium'
		});
	});

	it('maps TOMIX lifecycle metadata into the final sale state', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-11T12:00:00+03:00'));

		const notStarted = normalizePerformance(
			createEntry({
				ticketSaleStart: '2026-04-12 10:00:00',
				ticketSaleStop: '2026-04-20 10:00:00'
			}),
			undefined
		);
		const ended = normalizePerformance(
			createEntry({
				ticketSaleStart: '2026-04-01 10:00:00',
				ticketSaleStop: '2026-04-10 10:00:00'
			}),
			undefined
		);
		const onSale = normalizePerformance(
			createEntry({
				ticketSaleStart: '2026-04-01 10:00:00',
				ticketSaleStop: '2026-04-20 10:00:00'
			}),
			undefined
		);
		const soldOut = normalizePerformance(
			createEntry({
				soldOut: true,
				ticketSaleStart: '2026-04-12 10:00:00',
				ticketSaleStop: '2026-04-20 10:00:00'
			}),
			undefined
		);

		expect(notStarted.saleLifecycle.saleState).toBe('not_started');
		expect(ended.saleLifecycle.saleState).toBe('ended');
		expect(onSale.saleLifecycle.saleState).toBe('on_sale');
		expect(soldOut.saleLifecycle.saleState).toBe('sold_out');
	});
});
