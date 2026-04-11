import { Alert } from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import PerformanceCard from '@/components/theater/PerformanceCard';
import { FancyTitle, Heading3, Paragraph } from '@/components/Typography';
import { Locale, useTranslations } from 'next-intl';
import type { ComingSoonPerformance } from '@/lib/theater/collectComingSoonPerformances';
import type { TheaterId, TheaterSourceConfidence } from '@/lib/theater/types';

type Props = {
	locale: Locale;
	performances: ComingSoonPerformance[];
	hasError: boolean;
};

type ComingSoonGroup = {
	date: string;
	label: string;
	performances: ComingSoonPerformance[];
};

function getSaleStartDate(performance: ComingSoonPerformance): string {
	return performance.saleLifecycle.ticketSaleStart?.slice(0, 10) || 'unknown';
}

function formatDateLabel(date: string, locale: Locale): string {
	if (date === 'unknown') {
		return date;
	}

	return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(`${date}T00:00:00`));
}

function groupBySaleStart(performances: ComingSoonPerformance[], locale: Locale): ComingSoonGroup[] {
	const grouped = new Map<string, ComingSoonPerformance[]>();

	for (const performance of performances) {
		const date = getSaleStartDate(performance);
		const currentGroup = grouped.get(date) ?? [];
		currentGroup.push(performance);
		grouped.set(date, currentGroup);
	}

	return Array.from(grouped.entries()).map(([date, items]) => ({
		date,
		label: formatDateLabel(date, locale),
		performances: items
	}));
}

export default function ComingSoonTheaterPage({ locale, performances, hasError }: Props) {
	const t = useTranslations('comingSoonPage');
	const confidenceValues: Record<TheaterSourceConfidence, string> = {
		high: t('confidence.high'),
		medium: t('confidence.medium'),
		low: t('confidence.low')
	};
	const theaterNames: Record<TheaterId, string> = {
		lessin: t('theaters.lessin'),
		habima: t('theaters.habima'),
		cameri: t('theaters.cameri'),
		tomix: t('theaters.tomix')
	};
	const groups = groupBySaleStart(performances, locale);

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
			) : groups.length === 0 ? (
				<div className="theater-state theater-state-empty" role="status">
					<Heading3>{t('empty.title')}</Heading3>
					<Paragraph>{t('empty.description')}</Paragraph>
				</div>
			) : (
				<div className="theater-performance-list">
					{groups.map(group => (
						<section key={group.date} className="theater-date-group">
							<Heading3>{group.label}</Heading3>

							<div className="theater-date-group__grid">
								{group.performances.map(performance => (
									<PerformanceCard
										key={`${performance.theaterId}-${performance.id}`}
										performance={performance}
										theaterName={theaterNames[performance.theaterId]}
										hideAvailabilityDetails
										labels={{
											date: t('labels.performanceDate'),
											time: t('labels.time'),
											venue: t('labels.venue'),
											theater: t('labels.theater'),
											saleStart: t('labels.saleStart'),
											sections: t('labels.sections'),
											rows: t('labels.rows'),
											seats: t('labels.seats'),
											confidence: t('labels.confidence'),
											status: t('labels.status'),
											notAvailable: t('labels.notAvailable'),
											purchase: t('labels.purchase'),
											confidenceValues
										}}
									/>
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</PageLayout>
	);
}
