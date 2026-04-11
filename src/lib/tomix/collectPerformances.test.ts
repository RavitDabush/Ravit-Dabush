import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchEventerData, resolveEventerSource } from './fetchEventerPerformances';
import { fetchTomixTheaterProducts } from './fetchProducts';
import { fetchTomixSeatAvailability } from './fetchSeatAvailability';
import { parseTomixSeatAvailability } from './parseSeatAvailability';
import type {
	ParsedTomixSeatAvailability,
	TomixEventerDataResponse,
	TomixEventerSeat,
	TomixEventerSource,
	TomixSeatAvailabilityFetchResult,
	TomixStoreProduct
} from './types';

vi.mock('./fetchProducts', () => ({
	fetchTomixTheaterProducts: vi.fn()
}));

vi.mock('./fetchEventerPerformances', () => ({
	resolveEventerSource: vi.fn(),
	fetchEventerData: vi.fn()
}));

vi.mock('./fetchSeatAvailability', () => ({
	fetchTomixSeatAvailability: vi.fn()
}));

vi.mock('./parseSeatAvailability', () => ({
	parseTomixSeatAvailability: vi.fn()
}));

import { getNormalizedPreferredPerformances } from './normalizePerformance';

const fetchTomixTheaterProductsMock = vi.mocked(fetchTomixTheaterProducts);
const resolveEventerSourceMock = vi.mocked(resolveEventerSource);
const fetchEventerDataMock = vi.mocked(fetchEventerData);
const fetchTomixSeatAvailabilityMock = vi.mocked(fetchTomixSeatAvailability);
const parseTomixSeatAvailabilityMock = vi.mocked(parseTomixSeatAvailability);

function createProduct(id: number): TomixStoreProduct {
	return {
		id,
		name: `Product ${id}`,
		slug: `product-${id}`,
		permalink: `https://www.to-mix.co.il/product/product-${id}/`,
		categories: [{ id: 903, slug: 'theatre' }]
	};
}

function createSource(product: TomixStoreProduct): TomixEventerSource {
	return {
		product,
		iframeUrl: `https://www.eventer.co.il/user/tomix?tag=${product.slug}`,
		getDataUrl: `https://www.eventer.co.il/user/tomix/getData?tag=${product.slug}&hideExcludedEvents=true`
	};
}

function createEventData(eventIds: string[]): TomixEventerDataResponse {
	return {
		events: eventIds.map(eventId => ({
			_id: eventId,
			name: `Event ${eventId}`,
			locationDescription: 'TOMIX Venue',
			schedule: {
				start: `2026-05-${eventId.slice(-1).padStart(2, '0')}T20:30:00`
			},
			ticketTypes: [{ _id: `ticket-${eventId}`, toDate: '2026-05-30T18:00:00' }],
			linkName: `event-${eventId}`
		}))
	};
}

function createSeatResult(eventId: string, seats: TomixEventerSeat[]): TomixSeatAvailabilityFetchResult {
	return {
		eventId,
		seats,
		sourceStatus: 'eventer-seats:ok',
		errors: []
	};
}

const AVAILABLE_PARSE_RESULT: ParsedTomixSeatAvailability = {
	availableInPreferredRows: true,
	matchedSections: ['1'],
	matchedRows: ['1'],
	availableSeatCount: 2,
	sourceStatus: 'eventer-place:section_row_seat',
	sourceConfidence: 'medium'
};

const UNAVAILABLE_PARSE_RESULT: ParsedTomixSeatAvailability = {
	availableInPreferredRows: false,
	matchedSections: [],
	matchedRows: [],
	availableSeatCount: 0,
	sourceStatus: 'eventer-place:unusable',
	sourceConfidence: 'low'
};

beforeEach(() => {
	fetchTomixTheaterProductsMock.mockReset();
	resolveEventerSourceMock.mockReset();
	fetchEventerDataMock.mockReset();
	fetchTomixSeatAvailabilityMock.mockReset();
	parseTomixSeatAvailabilityMock.mockReset();

	resolveEventerSourceMock.mockImplementation(async product => createSource(product));
	fetchEventerDataMock.mockResolvedValue(createEventData([]));
	fetchTomixSeatAvailabilityMock.mockImplementation(async eventId =>
		createSeatResult(eventId, [{ _id: `seat-${eventId}` } as TomixEventerSeat])
	);
	parseTomixSeatAvailabilityMock.mockImplementation(seats =>
		seats.length > 0 ? AVAILABLE_PARSE_RESULT : UNAVAILABLE_PARSE_RESULT
	);
});

describe('tomix collectPerformances', () => {
	it('returns a normalized preferred performance for the happy path', async () => {
		const product = createProduct(1);
		fetchTomixTheaterProductsMock.mockResolvedValue([product]);
		fetchEventerDataMock.mockResolvedValue(createEventData(['event-1']));

		const result = await getNormalizedPreferredPerformances();

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: 'tomix-event-1',
			showName: 'Event event-1',
			date: '2026-05-01',
			time: '20:30',
			venue: 'TOMIX Venue',
			purchaseUrl: 'https://www.eventer.co.il/event-event-1',
			hasPreferredAvailability: true,
			matchedRows: ['1'],
			matchedSections: ['1']
		});
		expect(fetchTomixTheaterProductsMock).toHaveBeenCalledTimes(1);
		expect(resolveEventerSourceMock).toHaveBeenCalledWith(product);
		expect(fetchTomixSeatAvailabilityMock).toHaveBeenCalledWith('event-1');
	});

	it('excludes a performance when seat fetching throws and keeps other valid performances', async () => {
		fetchTomixTheaterProductsMock.mockResolvedValue([createProduct(1)]);
		fetchEventerDataMock.mockResolvedValue(createEventData(['event-1', 'event-2']));
		fetchTomixSeatAvailabilityMock.mockImplementation(async eventId => {
			if (eventId === 'event-1') {
				throw new Error('Seat fetch failed');
			}

			return createSeatResult(eventId, [{ _id: `seat-${eventId}` } as TomixEventerSeat]);
		});

		const result = await getNormalizedPreferredPerformances();

		expect(result.map(performance => performance.id)).toEqual(['tomix-event-2']);
	});

	it('excludes a performance when the seat payload is empty or unusable', async () => {
		fetchTomixTheaterProductsMock.mockResolvedValue([createProduct(1)]);
		fetchEventerDataMock.mockResolvedValue(createEventData(['event-1']));
		fetchTomixSeatAvailabilityMock.mockResolvedValue(createSeatResult('event-1', []));

		const result = await getNormalizedPreferredPerformances();

		expect(result).toEqual([]);
	});

	it('skips products that cannot resolve a usable Eventer source', async () => {
		const skippedProduct = createProduct(1);
		const validProduct = createProduct(2);
		fetchTomixTheaterProductsMock.mockResolvedValue([skippedProduct, validProduct]);
		resolveEventerSourceMock.mockImplementation(async product =>
			product.id === skippedProduct.id ? null : createSource(product)
		);
		fetchEventerDataMock.mockResolvedValue(createEventData(['event-2']));

		const result = await getNormalizedPreferredPerformances();

		expect(result.map(performance => performance.id)).toEqual(['tomix-event-2']);
		expect(fetchEventerDataMock).toHaveBeenCalledTimes(1);
	});

	it('keeps only valid performances when products fail at different orchestration stages', async () => {
		const sourceFailureProduct = createProduct(1);
		const eventDataFailureProduct = createProduct(2);
		const mixedProduct = createProduct(3);
		fetchTomixTheaterProductsMock.mockResolvedValue([sourceFailureProduct, eventDataFailureProduct, mixedProduct]);
		resolveEventerSourceMock.mockImplementation(async product => {
			if (product.id === sourceFailureProduct.id) {
				throw new Error('Source resolution failed');
			}

			return createSource(product);
		});
		fetchEventerDataMock.mockImplementation(async source => {
			if (source.product.id === eventDataFailureProduct.id) {
				throw new Error('Eventer data failed');
			}

			return createEventData(['event-1', 'event-3']);
		});
		fetchTomixSeatAvailabilityMock.mockImplementation(async eventId =>
			createSeatResult(eventId, eventId === 'event-1' ? [] : ([{ _id: `seat-${eventId}` }] as TomixEventerSeat[]))
		);

		const result = await getNormalizedPreferredPerformances();

		expect(result.map(performance => performance.id)).toEqual(['tomix-event-3']);
	});

	it('returns an empty list when product discovery has no matches', async () => {
		fetchTomixTheaterProductsMock.mockResolvedValue([]);

		const result = await getNormalizedPreferredPerformances();

		expect(result).toEqual([]);
		expect(resolveEventerSourceMock).not.toHaveBeenCalled();
		expect(fetchTomixSeatAvailabilityMock).not.toHaveBeenCalled();
	});
});
