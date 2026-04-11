import { describe, expect, it } from 'vitest';
import { resolveSaleLifecycle } from './resolveSaleLifecycle';

const PERFORMANCE = {
	id: 'presentation-1',
	date: '2026-04-11',
	time: '20:30'
};

const NOW = new Date('2026-04-11T12:00:00');

describe('theater resolveSaleLifecycle', () => {
	it('gives sold out precedence over sale dates', () => {
		const result = resolveSaleLifecycle(
			PERFORMANCE,
			{
				soldout: 1,
				ticketSaleStart: '2026-04-12 10:00:00',
				ticketSaleStop: '2026-04-10 10:00:00'
			},
			NOW
		);

		expect(result.saleState).toBe('sold_out');
	});

	it('returns not started when ticket sale start is in the future', () => {
		const result = resolveSaleLifecycle(
			PERFORMANCE,
			{
				ticketSaleStart: '2026-04-12 10:00:00',
				ticketSaleStop: '2026-04-20 10:00:00'
			},
			NOW
		);

		expect(result.saleState).toBe('not_started');
	});

	it('returns ended when ticket sale stop is in the past or equal to now', () => {
		const pastResult = resolveSaleLifecycle(
			PERFORMANCE,
			{
				ticketSaleStart: '2026-04-01 10:00:00',
				ticketSaleStop: '2026-04-10 10:00:00'
			},
			NOW
		);
		const equalResult = resolveSaleLifecycle(
			PERFORMANCE,
			{
				ticketSaleStart: '2026-04-01 10:00:00',
				ticketSaleStop: '2026-04-11 12:00:00'
			},
			NOW
		);

		expect(pastResult.saleState).toBe('ended');
		expect(equalResult.saleState).toBe('ended');
	});

	it('returns on sale when now is inside the sale window', () => {
		const result = resolveSaleLifecycle(
			PERFORMANCE,
			{
				ticketSaleStart: '2026-04-01 10:00:00',
				ticketSaleStop: '2026-04-20 10:00:00'
			},
			NOW
		);

		expect(result.saleState).toBe('on_sale');
	});

	it('returns unknown when sale dates are missing or invalid', () => {
		const missingResult = resolveSaleLifecycle(PERFORMANCE, {}, NOW);
		const invalidResult = resolveSaleLifecycle(
			PERFORMANCE,
			{
				ticketSaleStart: 'not-a-date',
				ticketSaleStop: 'also-not-a-date'
			},
			NOW
		);

		expect(missingResult.saleState).toBe('unknown');
		expect(invalidResult.saleState).toBe('unknown');
	});
});
