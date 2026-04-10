import { Alert } from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
import TheaterBrowser from '@/components/theater/TheaterBrowser';
import { FancyTitle, Paragraph } from '@/components/Typography';
import { Locale, useTranslations } from 'next-intl';
import { NormalizedPerformance, SourceConfidence } from '@/lib/lessin/types';
import { groupPerformancesByDate } from '@/lib/theater/groupPerformancesByDate';

type Props = {
	locale: Locale;
	performances: NormalizedPerformance[];
	hasError: boolean;
};

export default function LessinTheaterPage({ locale, performances, hasError }: Props) {
	const t = useTranslations('theaterPage');
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
				<TheaterBrowser
					performances={performances}
					groups={groupedPerformances}
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
