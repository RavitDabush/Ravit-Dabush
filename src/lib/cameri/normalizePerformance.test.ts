import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePerformance } from './normalizePerformance';
import { parseSeatAvailability } from './parseSeatAvailability';
import type {
	CameriPresentation,
	CameriScheduleEntry,
	CameriSeatAvailabilityFetchResult,
	CameriSeatStatusResponse,
	CameriSeatplanResponse,
	ParsedSeatAvailability
} from './types';

vi.mock('./parseSeatAvailability', () => ({
	parseSeatAvailability: vi.fn()
}));

const parseSeatAvailabilityMock = vi.mocked(parseSeatAvailability);

function createEntry(overrides: Partial<CameriScheduleEntry> = {}): CameriScheduleEntry {
	return {
		id: '701',
		showName: 'Schedule Show',
		date: '2026-04-12',
		time: '20:30',
		venue: 'Schedule Venue',
		purchaseUrl: 'https://tickets.cameri.co.il/order/701',
		sourceStatus: 'ticketing_presentations',
		ticketSaleStart: '2000-01-01 10:00:00',
		ticketSaleStop: '2999-01-01 10:00:00',
		...overrides
	};
}

function createPresentation(overrides: Partial<CameriPresentation> = {}): CameriPresentation {
	return {
		id: 701,
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
	overrides: Partial<CameriSeatAvailabilityFetchResult> = {}
): CameriSeatAvailabilityFetchResult {
	return {
		presentationId: '701',
		uuid: 'uuid-1',
		presentation: createPresentation(),
		seatplan: { S: {} } as CameriSeatplanResponse,
		seatStatus: { seats: {} } as CameriSeatStatusResponse,
		sourceStatus: 'seat_status_available',
		errors: [],
		...overrides
	};
}

function mockParsedAvailability(overrides: Partial<ParsedSeatAvailability> = {}) {
	parseSeatAvailabilityMock.mockReturnValue({
		available: true,
		availabilityType: 'row',
		availableInPreferred: true,
		matchedRows: ['1', '3'],
		matchedSections: ['אולם'],
		availableSeatCount: 8,
		sourceStatus: 'preferred_sections_confirmed',
		sourceConfidence: 'high',
		...overrides
	});
}

beforeEach(() => {
	parseSeatAvailabilityMock.mockReset();
});

describe('cameri normalizePerformance', () => {
	it('maps parsed group A row availability into the shared performance model', () => {
		const entry = createEntry();
		const seatResult = createSeatResult();
		mockParsedAvailability();

		const result = normalizePerformance(entry, seatResult);

		expect(parseSeatAvailabilityMock).toHaveBeenCalledWith(seatResult.seatplan, seatResult.seatStatus);
		expect(result).toMatchObject({
			id: '701',
			showName: 'Presentation Show',
			date: '2026-04-13',
			time: '20:30',
			venue: 'Presentation Venue',
			purchaseUrl: 'https://tickets.cameri.co.il/order/701',
			hasPreferredAvailability: true,
			availabilityType: 'row',
			matchedRows: ['1', '3'],
			matchedSections: ['אולם'],
			availableSeatCount: 8,
			sourceStatus: 'seat_status_available | preferred_sections_confirmed',
			sourceConfidence: 'high'
		});
	});

	it('maps group B availability as section-based availability', () => {
		mockParsedAvailability({
			availabilityType: 'section',
			matchedRows: [],
			matchedSections: ['3'],
			availableSeatCount: 4
		});

		const result = normalizePerformance(createEntry(), createSeatResult());

		expect(result).toMatchObject({
			hasPreferredAvailability: true,
			availabilityType: 'section',
			matchedRows: [],
			matchedSections: ['3'],
			availableSeatCount: 4,
			sourceStatus: 'seat_status_available | preferred_sections_confirmed',
			sourceConfidence: 'high'
		});
	});

	it('maps ambiguous unavailable parser results without making the performance available', () => {
		mockParsedAvailability({
			available: false,
			availabilityType: 'unknown',
			availableInPreferred: false,
			matchedRows: [],
			matchedSections: [],
			availableSeatCount: 0,
			sourceStatus: 'ambiguous_section_labels',
			sourceConfidence: 'low'
		});

		const result = normalizePerformance(createEntry(), createSeatResult());

		expect(result).toMatchObject({
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedRows: [],
			matchedSections: [],
			availableSeatCount: 0,
			sourceStatus: 'seat_status_available | ambiguous_section_labels',
			sourceConfidence: 'low'
		});
	});

	it('fails closed when the seat result is missing while preserving entry fields', () => {
		const result = normalizePerformance(createEntry(), undefined);

		expect(parseSeatAvailabilityMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			id: '701',
			showName: 'Schedule Show',
			date: '2026-04-12',
			time: '20:30',
			venue: 'Schedule Venue',
			purchaseUrl: 'https://tickets.cameri.co.il/order/701',
			hasPreferredAvailability: false,
			availabilityType: 'unknown',
			matchedSections: [],
			matchedRows: [],
			sourceStatus: 'ticketing_presentations',
			sourceConfidence: 'low'
		});
	});

	it('maps Cameri lifecycle metadata into the final sale state', () => {
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
