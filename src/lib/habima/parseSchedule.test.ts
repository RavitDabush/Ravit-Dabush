import { describe, expect, it } from 'vitest';
import { parseSchedule } from './parseSchedule';
import type { HabimaScheduleJson } from './types';

function timestampSeconds(value: string): number {
	return Math.floor(new Date(value).getTime() / 1000);
}

describe('habima parseSchedule', () => {
	it('normalizes timestamps and builds purchase URLs', () => {
		const schedule: HabimaScheduleJson = {
			presentations: {
				he: {
					showA: [{ id: 501, time: timestampSeconds('2026-04-12T20:30:00Z'), venue_id: 10 }]
				}
			},
			venues: {
				he: { '10': 'Main Venue' }
			},
			shows: {
				he: {
					showA: { ID: 1, title: 'Show A', url: '/show-a' }
				}
			}
		};

		const result = parseSchedule(schedule);

		expect(result[0]).toMatchObject({
			id: '501',
			showName: 'Show A',
			date: '2026-04-12',
			time: '20:30',
			venue: 'Main Venue',
			purchaseUrl: 'https://tickets.habima.co.il/order/501',
			showUrl: '/show-a',
			sourceShowKey: 'showA'
		});
	});

	it('sorts entries by date and time', () => {
		const schedule: HabimaScheduleJson = {
			presentations: {
				he: {
					later: [{ id: 2, time: timestampSeconds('2026-04-13T21:00:00Z'), venue_id: 10 }],
					earlier: [{ id: 1, time: timestampSeconds('2026-04-12T19:00:00Z'), venue_id: 10 }]
				}
			},
			venues: {
				he: { '10': 'Main Venue' }
			},
			shows: {
				he: {
					later: { ID: 2, title: 'Later Show' },
					earlier: { ID: 1, title: 'Earlier Show' }
				}
			}
		};

		const result = parseSchedule(schedule);

		expect(result.map(entry => entry.id)).toEqual(['1', '2']);
	});

	it('falls back to the source show key when the show title is missing', () => {
		const schedule: HabimaScheduleJson = {
			presentations: {
				he: {
					missingTitle: [{ id: 601, time: timestampSeconds('2026-04-12T20:30:00Z'), venue_id: 10 }]
				}
			},
			venues: {
				he: { '10': 'Main Venue' }
			},
			shows: {
				he: {}
			}
		};

		const result = parseSchedule(schedule);

		expect(result[0].showName).toBe('missingTitle');
	});
});
