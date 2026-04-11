import { describe, expect, it } from 'vitest';
import { parsePresentations } from './parsePresentations';
import type { CameriPresentationListItem } from './types';

const NOW = new Date('2026-04-11T12:00:00');

function createPresentation(overrides: Partial<CameriPresentationListItem>): CameriPresentationListItem {
	return {
		id: 1,
		featureName: 'Source Show',
		businessDate: '2026-04-12',
		dateTime: '2026-04-12 20:30:00',
		venueName: 'Main Venue',
		seatplanId: 10,
		soldout: 0,
		ticketSaleStart: '2026-04-01 10:00:00',
		ticketSaleStop: '2026-04-12 18:00:00',
		...overrides
	};
}

describe('cameri parsePresentations', () => {
	it('filters sold-out, missing required fields, sale-ended, and duplicate presentations', () => {
		const presentations = [
			createPresentation({ id: 1 }),
			createPresentation({ id: 2, soldout: 1 }),
			createPresentation({ id: 3, featureName: '' }),
			createPresentation({ id: 4, businessDate: '' }),
			createPresentation({ id: 5, dateTime: '' }),
			createPresentation({ id: 6, ticketSaleStop: '2026-04-11 12:00:00' }),
			createPresentation({ id: 1, featureName: 'Duplicate Show' })
		];

		const result = parsePresentations({ presentations }, NOW);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: '1',
			showName: 'Source Show'
		});
	});

	it('normalizes time, trims fields, and builds purchase URLs', () => {
		const presentations = [
			createPresentation({
				id: 7,
				featureName: '  Trimmed Show  ',
				businessDate: ' 2026-04-12 ',
				dateTime: '2026-04-12 21:45:00',
				venueName: '  Trimmed Venue  '
			})
		];

		const result = parsePresentations({ presentations }, NOW);

		expect(result[0]).toMatchObject({
			id: '7',
			showName: 'Trimmed Show',
			date: '2026-04-12',
			time: '21:45',
			venue: 'Trimmed Venue',
			purchaseUrl: 'https://tickets.cameri.co.il/order/7',
			sourceStatus: 'ticketing_presentations'
		});
	});
});
