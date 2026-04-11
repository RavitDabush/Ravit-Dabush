import 'server-only';

import { SaleLifecycle, TheaterNormalizedPerformance } from './types';

export type SaleLifecycleMetadata = {
	soldout?: number | boolean | null;
	ticketSaleStart?: string | null;
	ticketSaleStop?: string | null;
};

function parseSourceDate(value: string | null | undefined): Date | null {
	if (!value) {
		return null;
	}

	const normalizedValue = value.replace(' ', 'T');
	const parsedDate = new Date(normalizedValue);

	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isSoldOut(value: number | boolean | null | undefined): boolean {
	return value === true || value === 1;
}

export function resolveSaleLifecycle(
	_performance: Pick<TheaterNormalizedPerformance, 'id' | 'date' | 'time'>,
	metadata: SaleLifecycleMetadata,
	now: Date = new Date()
): SaleLifecycle {
	const ticketSaleStart = metadata.ticketSaleStart ?? undefined;
	const ticketSaleStop = metadata.ticketSaleStop ?? undefined;
	const saleStartDate = parseSourceDate(ticketSaleStart);
	const saleStopDate = parseSourceDate(ticketSaleStop);

	if (isSoldOut(metadata.soldout)) {
		return {
			saleState: 'sold_out',
			ticketSaleStart,
			ticketSaleStop
		};
	}

	if (saleStopDate && saleStopDate <= now) {
		return {
			saleState: 'ended',
			ticketSaleStart,
			ticketSaleStop
		};
	}

	if (saleStartDate && saleStartDate > now) {
		return {
			saleState: 'not_started',
			ticketSaleStart,
			ticketSaleStop
		};
	}

	if (saleStartDate && saleStartDate <= now && saleStopDate && saleStopDate > now) {
		return {
			saleState: 'on_sale',
			ticketSaleStart,
			ticketSaleStop
		};
	}

	return {
		saleState: 'unknown',
		ticketSaleStart,
		ticketSaleStop
	};
}
