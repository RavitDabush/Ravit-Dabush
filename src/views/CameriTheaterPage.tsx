import { Alert } from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import PerformanceList from '@/components/theater/PerformanceList';
import { FancyTitle, Paragraph } from '@/components/Typography';
import { Locale, useTranslations } from 'next-intl';
import { NormalizedPerformance, SourceConfidence } from '@/lib/cameri/types';
import { groupPerformancesByDate } from '@/lib/theater/groupPerformancesByDate';

type Props = {
	locale: Locale;
	performances: NormalizedPerformance[];
	hasError: boolean;
};

export default function CameriTheaterPage({ locale, performances, hasError }: Props) {
	const t = useTranslations('cameriPage');
	const confidenceValues: Record<SourceConfidence, string> = {
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
					filter={{
						label: t('filter.label'),
						allOption: t('filter.allOption')
					}}
					labels={{
						time: t('labels.time'),
						venue: t('labels.venue'),
						rows: t('labels.rows'),
						zones: t('labels.zones'),
						availability: t('labels.availability'),
						seats: t('labels.seats'),
						confidence: t('labels.confidence'),
						purchase: t('labels.purchase'),
						availabilityValues: {
							row: t('availability.row'),
							zone: t('availability.zone'),
							general: t('availability.general'),
							unknown: t('availability.unknown')
						},
						confidenceValues
					}}
				/>
			)}
		</PageLayout>
	);
}
