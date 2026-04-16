import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { TheaterNormalizedPerformance } from '@/lib/theater/types';
import { collectHabimaPerformances } from '@/lib/theater/collectHabimaPerformances';
import { refreshTheaterCache } from '@/lib/theater/actions';
import HabimaTheaterPage from '@/views/HabimaTheaterPage';

import '../style.scss';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'habimaPage');
}

export default async function LocaleHabimaTheaterPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	let performances: TheaterNormalizedPerformance[] = [];
	let hasError = false;

	try {
		const preparedData = await collectHabimaPerformances();
		performances = preparedData.performances;
	} catch {
		hasError = true;
	}

	const refreshCacheAction = refreshTheaterCache.bind(null, 'habima', locale);

	return (
		<HabimaTheaterPage
			locale={locale}
			performances={performances}
			hasError={hasError}
			refreshCacheAction={refreshCacheAction}
		/>
	);
}
