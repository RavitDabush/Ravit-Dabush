import { describe, expect, it } from 'vitest';
import { parseTicketingDiscovery } from './parseDiscovery';
import type { LessinFeature, LessinPresentationSummary } from './types';

const NOW = new Date('2026-04-11T12:00:00');

function createPresentation(overrides: Partial<LessinPresentationSummary>): LessinPresentationSummary {
	return {
		id: 1,
		businessDate: '2026-04-12',
		dateTime: '2026-04-12 20:30:00',
		featureName: 'Source Show',
		featureId: 101,
		venueName: 'Main Venue',
		seatplanId: 10,
		soldout: 0,
		ticketSaleStart: '2026-04-01 10:00:00',
		ticketSaleStop: '2026-04-12 18:00:00',
		...overrides
	};
}

describe('lessin parseTicketingDiscovery', () => {
	it('keeps only future, not sold-out, sale-open presentations', () => {
		const presentations = [
			createPresentation({ id: 1 }),
			createPresentation({ id: 2, dateTime: '2026-04-10 20:30:00' }),
			createPresentation({ id: 3, soldout: 1 })
		];

		const result = parseTicketingDiscovery([], presentations, NOW);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: '1',
			showName: 'Source Show',
			date: '2026-04-12',
			time: '20:30',
			purchaseUrl: 'https://lessin.presglobal.store/order/1'
		});
	});

	it('filters presentations when ticket sale stop is in the past or equal to now', () => {
		const presentations = [
			createPresentation({ id: 1, ticketSaleStop: '2026-04-10 10:00:00' }),
			createPresentation({ id: 2, ticketSaleStop: '2026-04-11 12:00:00' }),
			createPresentation({ id: 3, ticketSaleStop: '2026-04-12 18:00:00' })
		];

		const result = parseTicketingDiscovery([], presentations, NOW);

		expect(result.map(entry => entry.id)).toEqual(['3']);
	});

	it('dedupes presentations by id', () => {
		const presentations = [
			createPresentation({ id: 1, featureName: 'First Name' }),
			createPresentation({ id: 1, featureName: 'Latest Name' })
		];

		const result = parseTicketingDiscovery([], presentations, NOW);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: '1',
			showName: 'Latest Name'
		});
	});

	it('falls back from empty featureName to the feature map name', () => {
		const features: LessinFeature[] = [{ id: 101, name: 'Feature Map Name' }];
		const presentations = [createPresentation({ id: 1, featureName: '' })];

		const result = parseTicketingDiscovery(features, presentations, NOW);

		expect(result[0].showName).toBe('Feature Map Name');
	});
});
