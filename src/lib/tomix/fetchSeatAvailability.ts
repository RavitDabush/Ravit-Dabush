import 'server-only';

import { TomixEventerSeat, TomixSeatAvailabilityFetchResult } from './types';

const EVENTER_SEATS_BASE_URL = 'https://www.eventer.co.il/arenas';

const DEFAULT_HEADERS = {
	accept: 'application/json,*/*;q=0.8',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

export async function fetchTomixSeatAvailability(eventId: string): Promise<TomixSeatAvailabilityFetchResult> {
	const errors: string[] = [];

	try {
		const response = await fetch(`${EVENTER_SEATS_BASE_URL}/${eventId}/seats.js`, {
			headers: DEFAULT_HEADERS,
			next: { revalidate: 180 }
		});

		if (!response.ok) {
			return {
				eventId,
				seats: [],
				sourceStatus: `eventer-seats:${response.status}`,
				errors: [`Failed to fetch TOMIX Eventer seats ${eventId}: ${response.status}`]
			};
		}

		return {
			eventId,
			seats: (await response.json()) as TomixEventerSeat[],
			sourceStatus: 'eventer-seats:ok',
			errors
		};
	} catch (error) {
		errors.push(error instanceof Error ? error.message : 'Unknown TOMIX seat availability error');

		return {
			eventId,
			seats: [],
			sourceStatus: 'eventer-seats:error',
			errors
		};
	}
}
