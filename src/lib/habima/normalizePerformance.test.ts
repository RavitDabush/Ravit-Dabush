import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePerformance } from './normalizePerformance';
import { parseSeatAvailability } from './parseSeatAvailability';
import type {
	HabimaPresentation,
	HabimaScheduleEntry,
	HabimaSeatAvailabilityFetchResult,
	HabimaSeatStatusResponse,
	HabimaSeatplanResponse,
	ParsedSeatAvailability
} from './types';

vi.mock('./parseSeatAvailability', () => ({
	parseSeatAvailability: vi.fn()
}));

const parseSeatAvailabilityMock = vi.mocked(parseSeatAvailability);

function createEntry(overrides: Partial<HabimaScheduleEntry> = {}): HabimaScheduleEntry {
	return {
		id: '501',
		showName: 'Schedule Show',
		date: '2026-04-12',
		time: '20:30',
		venue: 'Schedule Venue',
		purchaseUrl: 'https://tickets.habima.co.il/order/501',
		sourceShowKey: 'show-key',
		...overrides
	};
}

function createPresentation(overrides: Partial<HabimaPresentation> = {}): HabimaPresentation {
	return {
		id: 501,
		businessDate: '2026-04-13',
		featureName: 'Presentation Show',
		featureId: 1,
		venueName: 'Presentation Venue',
		dateTime: '2026-04-13 20:30:00',
		venueTypeId: 1,
		venueId: 1,
		locationName: 'Main Location',
		seatplanId: 10,
		soldout: 0,
		isReserved: 1,
		isGA: 0,
		ticketSaleStart: '2000-01-01 10:00:00',
		ticketSaleStop: '2999-01-01 10:00:00',
		...overrides
	};
}

function createSeatResult(
	overrides: Partial<HabimaSeatAvailabilityFetchResult> = {}
): HabimaSeatAvailabilityFetchResult {
	return {
		presentationId: '501',
		uuid: 'uuid-1',
		presentation: createPresentation(),
		seatplan: { S: {} } as HabimaSeatplanResponse,
		seatStatus: { seats: {} } as HabimaSeatStatusResponse,
		sourceStatus: 'seat_status_available',
		errors: [],
		...overrides
	};
}

function mockParsedAvailability(overrides: Partial<ParsedSeatAvailability> = {}) {
	parseSeatAvailabilityMock.mockReturnValue({
		availableInPreferredRows: true,
		matchedRows: ['1', '3'],
		matchedSections: ['Main Hall'],
		availableSeatCount: 8,
		sourceStatus: 'confirmed_main_hall_preferred_rows',
		sourceConfidence: 'high',
		...overrides
	});
}

beforeEach(() => {
	parseSeatAvailabilityMock.mockReset();
});

describe('habima normalizePerformance', () => {
	it('maps parsed preferred hall availability into the shared performance model', () => {
		const entry = createEntry();
		const seatResult = createSeatResult();
		mockParsedAvailability();

		const result = normalizePerformance(entry, seatResult);

		expect(parseSeatAvailabilityMock).toHaveBeenCalledWith(seatResult.seatplan, seatResult.seatStatus);
		expect(result).toMatchObject({
			id: '501',
			showName: 'Presentation Show',
			date: '2026-04-13',
			time: '20:30',
			venue: 'Presentation Venue',
			purchaseUrl: 'https://tickets.habima.co.il/order/501',
			hasPreferredAvailability: true,
			availabilityType: 'row',
			matchedRows: ['1', '3'],
			matchedSections: ['Main Hall'],
			availableSeatCount: 8,
			sourceStatus: 'confirmed_main_hall_preferred_rows',
			sourceConfidence: 'high'
		});
	});

	it('maps preferred table sections as section-based availability', () => {
		mockParsedAvailability({
			matchedRows: [],
			matchedSections: ['Table Seats'],
			availableSeatCount: 3,
			sourceStatus: 'confirmed_table_preferred_seats',
			sourceConfidence: 'high'
		});

		const result = normalizePerformance(createEntry(), createSeatResult());

		expect(result).toMatchObject({
			hasPreferredAvailability: true,
			availabilityType: 'section',
			matchedRows: [],
			matchedSections: ['Table Seats'],
			availableSeatCount: 3,
			sourceStatus: 'confirmed_table_preferred_seats',
			sourceConfidence: 'high'
		});
	});

	it('does not infer section availability from empty matched rows alone', () => {
		mockParsedAvailability({
			matchedRows: [],
			matchedSections: ['Main Hall'],
			availableSeatCount: 3,
			sourceStatus: 'confirmed_main_hall_preferred_rows',
			sourceConfidence: 'high'
		});

		const result = normalizePerformance(createEntry(), createSeatResult());

		expect(result).toMatchObject({
			hasPreferredAvailability: true,
			availabilityType: 'row',
			matchedRows: [],
			matchedSections: ['Main Hall'],
			sourceStatus: 'confirmed_main_hall_preferred_rows'
		});
	});

	it('fails closed when the seat result is missing while preserving entry fields', () => {
		const result = normalizePerformance(createEntry(), undefined);

		expect(parseSeatAvailabilityMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			id: '501',
			showName: 'Schedule Show',
			date: '2026-04-12',
			time: '20:30',
			venue: 'Schedule Venue',
			purchaseUrl: 'https://tickets.habima.co.il/order/501',
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedRows: [],
			matchedSections: [],
			sourceConfidence: 'low'
		});
		expect(result.sourceStatus).toBeUndefined();
	});

	it('maps Habima lifecycle metadata into the final sale state', () => {
		const notStarted = normalizePerformance(
			createEntry(),
			createSeatResult({
				seatplan: null,
				seatStatus: null,
				presentation: createPresentation({
					ticketSaleStart: '2999-01-01 10:00:00',
					ticketSaleStop: '2999-02-01 10:00:00'
				})
			})
		);
		const ended = normalizePerformance(
			createEntry(),
			createSeatResult({
				seatplan: null,
				seatStatus: null,
				presentation: createPresentation({
					ticketSaleStart: '2000-01-01 10:00:00',
					ticketSaleStop: '2000-02-01 10:00:00'
				})
			})
		);
		const onSale = normalizePerformance(
			createEntry(),
			createSeatResult({
				seatplan: null,
				seatStatus: null,
				presentation: createPresentation({
					ticketSaleStart: '2000-01-01 10:00:00',
					ticketSaleStop: '2999-01-01 10:00:00'
				})
			})
		);
		const soldOut = normalizePerformance(
			createEntry(),
			createSeatResult({
				seatplan: null,
				seatStatus: null,
				presentation: createPresentation({
					soldout: 1,
					ticketSaleStart: '2999-01-01 10:00:00',
					ticketSaleStop: '2999-02-01 10:00:00'
				})
			})
		);

		expect(notStarted.saleLifecycle.saleState).toBe('not_started');
		expect(ended.saleLifecycle.saleState).toBe('ended');
		expect(onSale.saleLifecycle.saleState).toBe('on_sale');
		expect(soldOut.saleLifecycle.saleState).toBe('sold_out');
	});
});
