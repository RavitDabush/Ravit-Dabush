import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchEventerData, fetchEventerEventDetailsByLinkName, resolveEventerSource } from './fetchEventerPerformances';
import { fetchTomixTheaterProducts } from './fetchProducts';
import { fetchTomixSeatAvailabilityBatch } from './fetchSeatAvailability';
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
	fetchEventerData: vi.fn(),
	fetchEventerEventDetailsByLinkName: vi.fn()
}));

vi.mock('./fetchSeatAvailability', () => ({
	fetchTomixSeatAvailabilityBatch: vi.fn()
}));

vi.mock('./parseSeatAvailability', () => ({
	parseTomixSeatAvailability: vi.fn()
}));

import { getNormalizedPreferredPerformances } from './normalizePerformance';

const fetchTomixTheaterProductsMock = vi.mocked(fetchTomixTheaterProducts);
const resolveEventerSourceMock = vi.mocked(resolveEventerSource);
const fetchEventerDataMock = vi.mocked(fetchEventerData);
const fetchEventerEventDetailsByLinkNameMock = vi.mocked(fetchEventerEventDetailsByLinkName);
const fetchTomixSeatAvailabilityBatchMock = vi.mocked(fetchTomixSeatAvailabilityBatch);
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
	fetchEventerEventDetailsByLinkNameMock.mockReset();
	fetchTomixSeatAvailabilityBatchMock.mockReset();
	parseTomixSeatAvailabilityMock.mockReset();

	resolveEventerSourceMock.mockImplementation(async product => createSource(product));
	fetchEventerDataMock.mockResolvedValue(createEventData([]));
	fetchEventerEventDetailsByLinkNameMock.mockResolvedValue(null);
	fetchTomixSeatAvailabilityBatchMock.mockImplementation(async entries =>
		entries.map(entry => createSeatResult(entry.eventId, [{ _id: `seat-${entry.eventId}` } as TomixEventerSeat]))
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
		expect(fetchTomixSeatAvailabilityBatchMock).toHaveBeenCalledWith(
			[expect.objectContaining({ eventId: 'event-1' })],
			8
		);
	});

	it('enriches missing Eventer arena metadata before parsing seat availability', async () => {
		const product = createProduct(1);
		const arena = {
			svg: {
				sections: [{ sectionId: 2, lines: [{ lineNumber: 1, lineName: '\u05e9\u05d5\u05e8\u05d4 \u05d0' }] }]
			}
		};
		fetchTomixTheaterProductsMock.mockResolvedValue([product]);
		fetchEventerDataMock.mockResolvedValue(createEventData(['event-1']));
		fetchEventerEventDetailsByLinkNameMock.mockResolvedValue({
			_id: 'event-1',
			arena
		});
		parseTomixSeatAvailabilityMock.mockReturnValue({
			...AVAILABLE_PARSE_RESULT,
			matchedRows: ['1'],
			matchedRowDisplayLabels: ['\u05d0']
		});

		const result = await getNormalizedPreferredPerformances();

		expect(fetchEventerEventDetailsByLinkNameMock).toHaveBeenCalledWith('event-event-1');
		expect(parseTomixSeatAvailabilityMock).toHaveBeenCalledWith(
			[{ _id: 'seat-event-1' }],
			'TOMIX Venue',
			['ticket-event-1'],
			arena
		);
		expect(result[0].matchedRows).toEqual(['1']);
		expect(result[0].matchedRowDisplayLabels).toEqual(['\u05d0']);
	});

	it('excludes a performance when seat fetching fails closed and keeps other valid performances', async () => {
		fetchTomixTheaterProductsMock.mockResolvedValue([createProduct(1)]);
		fetchEventerDataMock.mockResolvedValue(createEventData(['event-1', 'event-2']));
		fetchTomixSeatAvailabilityBatchMock.mockResolvedValue([
			createSeatResult('event-1', []),
			createSeatResult('event-2', [{ _id: 'seat-event-2' } as TomixEventerSeat])
		]);

		const result = await getNormalizedPreferredPerformances();

		expect(result.map(performance => performance.id)).toEqual(['tomix-event-2']);
	});

	it('excludes a performance when the seat payload is empty or unusable', async () => {
		fetchTomixTheaterProductsMock.mockResolvedValue([createProduct(1)]);
		fetchEventerDataMock.mockResolvedValue(createEventData(['event-1']));
		fetchTomixSeatAvailabilityBatchMock.mockResolvedValue([createSeatResult('event-1', [])]);

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
		fetchTomixSeatAvailabilityBatchMock.mockImplementation(async entries =>
			entries.map(entry =>
				createSeatResult(
					entry.eventId,
					entry.eventId === 'event-1' ? [] : ([{ _id: `seat-${entry.eventId}` }] as TomixEventerSeat[])
				)
			)
		);

		const result = await getNormalizedPreferredPerformances();

		expect(result.map(performance => performance.id)).toEqual(['tomix-event-3']);
	});

	it('returns an empty list when product discovery has no matches', async () => {
		fetchTomixTheaterProductsMock.mockResolvedValue([]);

		const result = await getNormalizedPreferredPerformances();

		expect(result).toEqual([]);
		expect(resolveEventerSourceMock).not.toHaveBeenCalled();
		expect(fetchTomixSeatAvailabilityBatchMock).toHaveBeenCalledWith([], 8);
	});
});
