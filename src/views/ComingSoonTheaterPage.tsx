import { Alert } from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import TheaterPerformancesView from '@/components/theater/TheaterPerformancesView';
import { comingSoonTheaterTableConfig } from '@/components/theater/theaterTableConfig';
import type { TheaterViewMode } from '@/components/theater/theaterViewMode';
import { FancyTitle, Paragraph } from '@/components/Typography';
import { Locale, useTranslations } from 'next-intl';
import type { ComingSoonPerformance } from '@/lib/theater/collectComingSoonPerformances';
import type { SaleState, TheaterId, TheaterSourceConfidence } from '@/lib/theater/types';

type Props = {
	locale: Locale;
	performances: ComingSoonPerformance[];
	hasError: boolean;
	viewMode: TheaterViewMode;
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

export default function ComingSoonTheaterPage({ locale, performances, hasError, viewMode }: Props) {
	const t = useTranslations('comingSoonPage');
	const theaterViewT = useTranslations('theaterView');
	const confidenceValues: Record<TheaterSourceConfidence, string> = {
		high: t('confidence.high'),
		medium: t('confidence.medium'),
		low: t('confidence.low')
	};
	const saleStateValues: Record<SaleState, string> = {
		not_started: theaterViewT('table.saleState.not_started'),
		on_sale: theaterViewT('table.saleState.on_sale'),
		sold_out: theaterViewT('table.saleState.sold_out'),
		ended: theaterViewT('table.saleState.ended'),
		unknown: theaterViewT('table.saleState.unknown')
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
			) : (
				<TheaterPerformancesView
					groups={groups}
					currentViewMode={viewMode}
					emptyState={{
						title: t('empty.title'),
						description: t('empty.description')
					}}
					theaterNames={theaterNames}
					hideAvailabilityDetails
					cardLabels={{
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
					tableLabels={{
						caption: theaterViewT('table.caption'),
						headers: {
							date: theaterViewT('table.headers.date'),
							time: theaterViewT('table.headers.time'),
							show: theaterViewT('table.headers.show'),
							theater: theaterViewT('table.headers.theater'),
							venue: theaterViewT('table.headers.venue'),
							availableAreas: theaterViewT('table.headers.availableAreas'),
							availableSeats: theaterViewT('table.headers.availableSeats'),
							saleState: theaterViewT('table.headers.saleState'),
							action: theaterViewT('table.headers.action')
						},
						notAvailable: t('labels.notAvailable'),
						unavailableFallback: theaterViewT('table.unavailableFallback'),
						purchase: t('labels.purchase'),
						saleStateValues,
						purchaseAriaLabel: theaterViewT('table.purchaseAriaLabel', {
							showName: '{showName}',
							date: '{date}',
							time: '{time}',
							location: '{location}'
						})
					}}
					tableConfig={comingSoonTheaterTableConfig}
				/>
			)}
		</PageLayout>
	);
}
