import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { TheaterNormalizedPerformance } from '@/lib/theater/types';
import { collectCameriPerformances } from '@/lib/theater/collectCameriPerformances';
import { refreshTheaterCache } from '@/lib/theater/actions';
import CameriTheaterPage from '@/views/CameriTheaterPage';

import '../style.scss';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'cameriPage');
}

export default async function LocaleCameriTheaterPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	let performances: TheaterNormalizedPerformance[] = [];
	let collectedAt: string | undefined;
	let hasError = false;

	try {
		const preparedData = await collectCameriPerformances();
		performances = preparedData.performances;
		collectedAt = preparedData.collectedAt;
	} catch {
		hasError = true;
	}

	const refreshCacheAction = refreshTheaterCache.bind(null, 'cameri', locale);

	return (
		<CameriTheaterPage
			locale={locale}
			performances={performances}
			collectedAt={collectedAt}
			hasError={hasError}
			refreshCacheAction={refreshCacheAction}
		/>
	);
}
