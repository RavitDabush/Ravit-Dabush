import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert } from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import PerformanceList from '@/components/theater/PerformanceList';
import { FancyTitle, Paragraph } from '@/components/Typography';
import { getNormalizedPreferredPerformances } from '@/lib/habima/normalizePerformance';
import { NormalizedPerformance, SourceConfidence } from '@/lib/habima/types';
import { createPageMetadata } from '@/lib/metadata';

import '../style.scss';

export const revalidate = 600;

type Props = {
	params: Promise<{ locale: Locale }>;
};

type PerformanceGroup = {
	date: string;
	label: string;
	performances: NormalizedPerformance[];
};

function formatDateLabel(date: string, locale: Locale): string {
	return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(`${date}T00:00:00`));
}

function groupPerformancesByDate(performances: NormalizedPerformance[], locale: Locale): PerformanceGroup[] {
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
	return createPageMetadata(locale, 'habimaPage');
}

export default async function LocaleHabimaTheaterPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: 'habimaPage' });
	const confidenceValues: Record<SourceConfidence, string> = {
		high: t('confidence.high'),
		medium: t('confidence.medium'),
		low: t('confidence.low')
	};

	let groupedPerformances: PerformanceGroup[] | null = null;
	let performances: NormalizedPerformance[] = [];
	let hasError = false;

	try {
		performances = await getNormalizedPreferredPerformances();
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
				<PerformanceList
					performances={performances}
					groups={groupedPerformances ?? []}
					emptyState={{
						title: t('empty.title'),
						description: t('empty.description')
					}}
					filter={{
						label: t('filter.label'),
						allOption: t('filter.allOption')
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
				/>
			)}
		</PageLayout>
	);
}
