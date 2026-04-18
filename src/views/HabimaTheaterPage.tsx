import { Alert } from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import LastUpdated from '@/components/theater/LastUpdated';
import RefreshTheaterCacheForm from '@/components/theater/RefreshTheaterCacheForm';
import TheaterPerformancesView from '@/components/theater/TheaterPerformancesView';
import { regularTheaterTableConfig } from '@/components/theater/theaterTableConfig';
import type { TheaterViewMode } from '@/components/theater/theaterViewMode';
import { FancyTitle, Paragraph } from '@/components/Typography';
import { Locale, useTranslations } from 'next-intl';
import { SaleState, TheaterNormalizedPerformance, TheaterSourceConfidence } from '@/lib/theater/types';
import { groupPerformancesByDate } from '@/lib/theater/groupPerformancesByDate';

type Props = {
	locale: Locale;
	performances: TheaterNormalizedPerformance[];
	collectedAt?: string;
	hasError: boolean;
	viewMode: TheaterViewMode;
	refreshCacheAction: () => Promise<void>;
};

export default function HabimaTheaterPage({
	locale,
	performances,
	collectedAt,
	hasError,
	viewMode,
	refreshCacheAction
}: Props) {
	const t = useTranslations('habimaPage');
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
	const groupedPerformances = groupPerformancesByDate(performances, locale);

	return (
		<PageLayout>
			<section className="theater-page-intro">
				<FancyTitle>{t('title')}</FancyTitle>
				<Paragraph>{t('description')}</Paragraph>
				<div className="theater-page-intro__actions">
					<RefreshTheaterCacheForm
						action={refreshCacheAction}
						label={t('refreshCache.label')}
						pendingLabel={t('refreshCache.pendingLabel')}
						hint={t('refreshCache.hint')}
					/>
					<LastUpdated collectedAt={collectedAt} label={t('lastUpdated')} />
				</div>
			</section>

			{hasError ? (
				<Alert variant="error" title={t('error.title')} className="theater-state theater-state-error">
					<Paragraph>{t('error.description')}</Paragraph>
				</Alert>
			) : (
				<TheaterPerformancesView
					performances={performances}
					groups={groupedPerformances}
					currentViewMode={viewMode}
					emptyState={{
						title: t('empty.title'),
						description: t('empty.description')
					}}
					filter={{
						label: t('filter.label'),
						allOption: t('filter.allOption')
					}}
					cardLabels={{
						time: t('labels.time'),
						venue: t('labels.venue'),
						sections: t('labels.sections'),
						rows: t('labels.rows'),
						availability: t('labels.availability'),
						seats: t('labels.seats'),
						confidence: t('labels.confidence'),
						status: t('labels.status'),
						notAvailable: t('labels.notAvailable'),
						purchase: t('labels.purchase'),
						availabilityValues: {
							row: t('availability.row'),
							section: t('availability.section'),
							general: t('availability.general'),
							unknown: t('availability.unknown')
						},
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
						availabilityValues: {
							row: t('availability.row'),
							section: t('availability.section'),
							general: t('availability.general'),
							unknown: t('availability.unknown')
						},
						saleStateValues,
						purchaseAriaLabel: theaterViewT('table.purchaseAriaLabel', {
							showName: '{showName}',
							date: '{date}',
							time: '{time}',
							location: '{location}'
						})
					}}
					tableConfig={regularTheaterTableConfig}
				/>
			)}
		</PageLayout>
	);
}
