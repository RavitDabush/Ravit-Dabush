import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePerformance } from './normalizePerformance';
import { parseSeatAvailability } from './parseSeatAvailability';
import type {
	LessinPresentation,
	LessinScheduleEntry,
	LessinSeatAvailabilityFetchResult,
	LessinSeatStatusResponse,
	LessinSeatplanResponse,
	ParsedSeatAvailability
} from './types';

vi.mock('./parseSeatAvailability', () => ({
	parseSeatAvailability: vi.fn()
}));

const parseSeatAvailabilityMock = vi.mocked(parseSeatAvailability);

function createEntry(overrides: Partial<LessinScheduleEntry> = {}): LessinScheduleEntry {
	return {
		id: '101',
		showName: 'Discovery Show',
		date: '2026-04-12',
		time: '20:30',
		venue: 'Discovery Venue',
		purchaseUrl: 'https://lessin.presglobal.store/order/101',
		sourceStatus: 'ticketing-discovery',
		isSoldOut: false,
		ticketSaleStart: '2000-01-01 10:00:00',
		ticketSaleStop: '2999-01-01 10:00:00',
		...overrides
	};
}

function createPresentation(overrides: Partial<LessinPresentation> = {}): LessinPresentation {
	return {
		id: 101,
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
	overrides: Partial<LessinSeatAvailabilityFetchResult> = {}
): LessinSeatAvailabilityFetchResult {
	return {
		presentationId: '101',
		uuid: 'uuid-1',
		presentation: createPresentation(),
		seatplan: { S: {} } as LessinSeatplanResponse,
		seatStatus: { seats: {} } as LessinSeatStatusResponse,
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
		sectionDebugStatus: 'main-hall',
		hasStructuredSectionLabels: true,
		...overrides
	});
}

beforeEach(() => {
	parseSeatAvailabilityMock.mockReset();
});

describe('lessin normalizePerformance', () => {
	it('maps parsed seat availability into the shared performance model', () => {
		const entry = createEntry();
		const seatResult = createSeatResult();
		mockParsedAvailability();

		const result = normalizePerformance(entry, seatResult);

		expect(parseSeatAvailabilityMock).toHaveBeenCalledWith(seatResult.seatplan, seatResult.seatStatus);
		expect(result).toMatchObject({
			id: '101',
			showName: 'Presentation Show',
			date: '2026-04-13',
			time: '20:30',
			venue: 'Presentation Venue',
			purchaseUrl: 'https://lessin.presglobal.store/order/101',
			hasPreferredAvailability: true,
			availabilityType: 'row',
			matchedRows: ['1', '3'],
			matchedSections: ['Main Hall'],
			availableSeatCount: 8,
			sourceConfidence: 'high',
			sourceStatus: 'ticketing-discovery | seat-section:main-hall | matched-sections:Main Hall'
		});
	});

	it('keeps mapped availability but lowers confidence for ambiguous sections', () => {
		mockParsedAvailability({
			sectionDebugStatus: 'ambiguous',
			matchedSections: [],
			matchedRows: ['1'],
			availableSeatCount: 2,
			hasStructuredSectionLabels: false
		});

		const result = normalizePerformance(createEntry(), createSeatResult());

		expect(result).toMatchObject({
			hasPreferredAvailability: true,
			availabilityType: 'row',
			matchedSections: [],
			matchedRows: ['1'],
			availableSeatCount: 2,
			sourceConfidence: 'medium',
			sourceStatus: 'ticketing-discovery | seat-section:ambiguous'
		});
	});

	it('fails closed when seat data is missing while preserving entry fields', () => {
		const entry = createEntry();
		const seatResult = createSeatResult({
			presentation: createPresentation(),
			seatplan: null,
			seatStatus: null
		});

		const result = normalizePerformance(entry, seatResult);

		expect(parseSeatAvailabilityMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			id: '101',
			showName: 'Discovery Show',
			date: '2026-04-12',
			time: '20:30',
			venue: 'Discovery Venue',
			purchaseUrl: 'https://lessin.presglobal.store/order/101',
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedRows: [],
			matchedSections: [],
			sourceConfidence: 'medium',
			sourceStatus: 'ticketing-discovery'
		});
	});

	it('maps Lessin lifecycle metadata into the final sale state', () => {
		const notStarted = normalizePerformance(
			createEntry({
				ticketSaleStart: '2999-01-01 10:00:00',
				ticketSaleStop: '2999-02-01 10:00:00'
			}),
			undefined
		);
		const ended = normalizePerformance(
			createEntry({
				ticketSaleStart: '2000-01-01 10:00:00',
				ticketSaleStop: '2000-02-01 10:00:00'
			}),
			undefined
		);
		const onSale = normalizePerformance(
			createEntry({
				ticketSaleStart: '2000-01-01 10:00:00',
				ticketSaleStop: '2999-01-01 10:00:00'
			}),
			undefined
		);
		const soldOut = normalizePerformance(
			createEntry({
				isSoldOut: true,
				ticketSaleStart: '2999-01-01 10:00:00',
				ticketSaleStop: '2999-02-01 10:00:00'
			}),
			undefined
		);

		expect(notStarted.saleLifecycle.saleState).toBe('not_started');
		expect(ended.saleLifecycle.saleState).toBe('ended');
		expect(onSale.saleLifecycle.saleState).toBe('on_sale');
		expect(soldOut.saleLifecycle.saleState).toBe('sold_out');
	});
});
