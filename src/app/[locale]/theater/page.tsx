import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageLayout from '@/components/PageLayout';
import { Alert } from '@/components/Alert';
import { FancyTitle, Paragraph } from '@/components/Typography';
import { createPageMetadata } from '@/lib/metadata';
import { getNormalizedPreferredPerformances } from '@/lib/lessin/normalizePerformance';
import { NormalizedPerformance, SourceConfidence } from '@/lib/lessin/types';
import TheaterBrowser from '@/components/theater/TheaterBrowser';

import './style.scss';

export const revalidate = 300;

type Props = {
	params: Promise<{ locale: Locale }>;
};

function formatDateLabel(date: string, locale: Locale): string {
	return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(`${date}T00:00:00`));
}

function groupPerformancesByDate(performances: NormalizedPerformance[], locale: Locale) {
	const grouped = new Map<string, NormalizedPerformance[]>();

	for (const performance of performances) {
		const currentGroup = grouped.get(performance.date) ?? [];
		currentGroup.push(performance);
		grouped.set(performance.date, currentGroup);
	}

	return Array.from(grouped.entries()).map(([date, items]) => ({
		date,
		label: formatDateLabel(date, locale),
		performances: items
	}));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'theaterPage');
}

export default async function LocaleTheaterPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: 'theaterPage' });
	const confidenceValues: Record<SourceConfidence, string> = {
		high: t('confidence.high'),
		medium: t('confidence.medium'),
		low: t('confidence.low')
	};
	let groupedPerformances = null as ReturnType<typeof groupPerformancesByDate> | null;
	let hasError = false;

	try {
		const performances = await getNormalizedPreferredPerformances();
		groupedPerformances = groupPerformancesByDate(performances, locale);
	} catch {
		hasError = true;
	}

	return (
		<PageLayout>
			<section className="theater-page-intro">
				<FancyTitle>{t('title')}</FancyTitle>
				<Paragraph>{t('description')}</Paragraph>
			</section>

			{hasError ? (
				<Alert variant="error" title={t('error.title')} className="theater-state theater-state-error">
					<Paragraph>{t('error.description')}</Paragraph>
				</Alert>
			) : (
				<TheaterBrowser
					performances={groupedPerformances?.flatMap(group => group.performances) ?? []}
					groups={groupedPerformances ?? []}
					emptyState={{
						title: t('empty.title'),
						description: t('empty.description')
					}}
					labels={{
						time: t('labels.time'),
						venue: t('labels.venue'),
						rows: t('labels.rows'),
						seats: t('labels.seats'),
						confidence: t('labels.confidence'),
						purchase: t('labels.purchase'),
						confidenceValues
					}}
					filter={{
						label: t('filter.label'),
						allOption: t('filter.allOption')
					}}
				/>
			)}
		</PageLayout>
	);
}
