import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { TheaterNormalizedPerformance } from '@/lib/theater/types';
import { collectHebrewTheaterPerformances } from '@/lib/theater/collectHebrewTheaterPerformances';
import { refreshTheaterCache } from '@/lib/theater/actions';
import HebrewTheaterPage from '@/views/HebrewTheaterPage';
import { parseTheaterViewMode } from '@/components/theater/theaterViewMode';

import '../style.scss';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
	searchParams?: Promise<{ view?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'hebrewTheaterPage');
}

export default async function LocaleHebrewTheaterPage({ params, searchParams }: Props) {
	const { locale } = await params;
	const resolvedSearchParams = await searchParams;
	setRequestLocale(locale);

	let performances: TheaterNormalizedPerformance[] = [];
	let collectedAt: string | undefined;
	let hasError = false;

	try {
		const preparedData = await collectHebrewTheaterPerformances();
		performances = preparedData.performances;
		collectedAt = preparedData.collectedAt;
	} catch {
		hasError = true;
	}

	const refreshCacheAction = refreshTheaterCache.bind(null, 'hebrew-theater', locale);

	return (
		<HebrewTheaterPage
			locale={locale}
			performances={performances}
			collectedAt={collectedAt}
			hasError={hasError}
			viewMode={parseTheaterViewMode(resolvedSearchParams?.view)}
			refreshCacheAction={refreshCacheAction}
		/>
	);
}
