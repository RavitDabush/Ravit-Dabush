import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePerformance } from './normalizePerformance';
import { parseHebrewTheaterSeatAvailability } from './parseSeatAvailability';
import type {
	HebrewTheaterScheduleEntry,
	HebrewTheaterSeatAvailabilityFetchResult,
	ParsedHebrewTheaterSeatAvailability
} from './types';

vi.mock('./parseSeatAvailability', () => ({
	parseHebrewTheaterSeatAvailability: vi.fn()
}));

vi.mock('next/cache', () => ({
	unstable_cache: (callback: unknown) => callback
}));

const parseSeatAvailabilityMock = vi.mocked(parseHebrewTheaterSeatAvailability);

function createEntry(overrides: Partial<HebrewTheaterScheduleEntry> = {}): HebrewTheaterScheduleEntry {
	return {
		id: 'hebrew-theater-10950',
		eventId: '10950',
		showName: 'עפרה - פתח תקווה',
		date: '2026-04-18',
		time: '21:00',
		venue: 'היכל התרבות פתח תקווה',
		purchaseUrl: 'https://thehebrewtheater.smarticket.co.il/event/10950',
		sourceStatus: 'smarticket:api/shows',
		ticketsAvailable: true,
		leftTicketsCount: 8,
		...overrides
	};
}

function createSeatResult(
	overrides: Partial<HebrewTheaterSeatAvailabilityFetchResult> = {}
): HebrewTheaterSeatAvailabilityFetchResult {
	return {
		eventId: '10950',
		html: '<button class="chair empty" data-row="1" data-status="empty"></button>',
		sourceStatus: 'smarticket-chairmap:ok',
		errors: [],
		...overrides
	};
}

function mockParsedAvailability(overrides: Partial<ParsedHebrewTheaterSeatAvailability> = {}) {
	parseSeatAvailabilityMock.mockReturnValue({
		availableInPreferredRows: true,
		matchedSections: ['56'],
		matchedRows: ['1', '3'],
		matchedRowDisplayLabels: ['1', '3'],
		availableSeatCount: 6,
		sourceStatus: 'smarticket-chairmap:data-row:data-status | venue-sections:main-hall-only',
		sourceConfidence: 'medium',
		...overrides
	});
}

beforeEach(() => {
	parseSeatAvailabilityMock.mockReset();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('hebrewTheater normalizePerformance', () => {
	it('maps parsed seat availability into the shared performance model', () => {
		const entry = createEntry();
		const seatResult = createSeatResult();
		mockParsedAvailability();

		const result = normalizePerformance(entry, seatResult);

		expect(parseSeatAvailabilityMock).toHaveBeenCalledWith(seatResult.html);
		expect(result).toMatchObject({
			id: 'hebrew-theater-10950',
			showName: 'עפרה - פתח תקווה',
			date: '2026-04-18',
			time: '21:00',
			venue: 'היכל התרבות פתח תקווה',
			purchaseUrl: 'https://thehebrewtheater.smarticket.co.il/event/10950',
			hasPreferredAvailability: true,
			availabilityType: 'row',
			matchedSections: ['56'],
			matchedRows: ['1', '3'],
			matchedRowDisplayLabels: ['1', '3'],
			availableSeatCount: 6,
			sourceConfidence: 'medium',
			sourceStatus:
				'smarticket:api/shows | smarticket-chairmap:ok | smarticket-chairmap:data-row:data-status | venue-sections:main-hall-only'
		});
	});

	it('fails closed when the seat result is missing', () => {
		const result = normalizePerformance(createEntry(), undefined);

		expect(parseSeatAvailabilityMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedSections: [],
			matchedRows: [],
			sourceConfidence: 'low',
			sourceStatus: 'smarticket:api/shows'
		});
		expect(result.availableSeatCount).toBeUndefined();
	});

	it('fails closed and preserves chairmap errors when the seat fetch returned no HTML', () => {
		const result = normalizePerformance(
			createEntry(),
			createSeatResult({
				html: '',
				sourceStatus: 'smarticket-chairmap:500',
				errors: ['Failed to fetch Hebrew Theater chairmap 10950: 500']
			})
		);

		expect(parseSeatAvailabilityMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedSections: [],
			matchedRows: [],
			sourceConfidence: 'low',
			sourceStatus: 'smarticket:api/shows | smarticket-chairmap:500 | Failed to fetch Hebrew Theater chairmap 10950: 500'
		});
		expect(result.availableSeatCount).toBeUndefined();
	});

	it('stays unavailable when parsed seats have no preferred availability', () => {
		mockParsedAvailability({
			availableInPreferredRows: false,
			matchedSections: [],
			matchedRows: [],
			matchedRowDisplayLabels: [],
			availableSeatCount: 0
		});

		const result = normalizePerformance(createEntry(), createSeatResult());

		expect(result).toMatchObject({
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedSections: [],
			matchedRows: [],
			matchedRowDisplayLabels: [],
			availableSeatCount: 0,
			sourceConfidence: 'medium'
		});
	});

	it('maps Smarticket sale metadata into the final sale state', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-11T12:00:00+03:00'));

		const soldOut = normalizePerformance(createEntry({ ticketsAvailable: false, leftTicketsCount: 0 }), undefined);
		const notStarted = normalizePerformance(
			createEntry({
				ticketSaleStart: '2026-04-12 10:00:00',
				ticketSaleStop: '2026-04-20 10:00:00'
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

		expect(soldOut.saleLifecycle.saleState).toBe('sold_out');
		expect(notStarted.saleLifecycle.saleState).toBe('not_started');
		expect(onSale.saleLifecycle.saleState).toBe('on_sale');
	});
});
