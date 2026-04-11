import { Locale } from 'next-intl';
import { TheaterNormalizedPerformance, TheaterPerformanceGroup } from './types';

function formatDateLabel(date: string, locale: Locale): string {
	return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(`${date}T00:00:00`));
}

function comparePerformanceDateTime<TPerformance extends TheaterNormalizedPerformance>(
	left: TPerformance,
	right: TPerformance
): number {
	return `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`);
}

export function groupPerformancesByDate<TPerformance extends TheaterNormalizedPerformance>(
	performances: TPerformance[],
	locale: Locale
): TheaterPerformanceGroup<TPerformance>[] {
	const grouped = new Map<string, TPerformance[]>();

	for (const performance of performances) {
		const currentGroup = grouped.get(performance.date) ?? [];
		currentGroup.push(performance);
		grouped.set(performance.date, currentGroup);
	}

	return Array.from(grouped.entries())
		.sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
		.map(([date, items]) => ({
			date,
			label: formatDateLabel(date, locale),
			performances: [...items].sort(comparePerformanceDateTime)
		}));
}
