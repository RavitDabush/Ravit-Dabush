import { Alert } from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import PerformanceList from '@/components/theater/PerformanceList';
import RefreshTheaterCacheForm from '@/components/theater/RefreshTheaterCacheForm';
import { FancyTitle, Paragraph } from '@/components/Typography';
import { Locale, useTranslations } from 'next-intl';
import { TheaterNormalizedPerformance, TheaterSourceConfidence } from '@/lib/theater/types';
import { groupPerformancesByDate } from '@/lib/theater/groupPerformancesByDate';

type Props = {
	locale: Locale;
	performances: TheaterNormalizedPerformance[];
	hasError: boolean;
	refreshCacheAction: () => Promise<void>;
};

export default function LessinTheaterPage({ locale, performances, hasError, refreshCacheAction }: Props) {
	const t = useTranslations('theaterPage');
	const confidenceValues: Record<TheaterSourceConfidence, string> = {
		high: t('confidence.high'),
		medium: t('confidence.medium'),
		low: t('confidence.low')
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
				</div>
			</section>

			{hasError ? (
				<Alert variant="error" title={t('error.title')} className="theater-state theater-state-error">
					<Paragraph>{t('error.description')}</Paragraph>
				</Alert>
			) : (
				<PerformanceList
					performances={performances}
					groups={groupedPerformances}
					emptyState={{
						title: t('empty.title'),
						description: t('empty.description')
					}}
					labels={{
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
					filter={{
						label: t('filter.label'),
						allOption: t('filter.allOption')
					}}
				/>
			)}
		</PageLayout>
	);
}
