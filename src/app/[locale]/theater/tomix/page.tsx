import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { TheaterNormalizedPerformance } from '@/lib/theater/types';
import { collectTomixPerformances } from '@/lib/theater/collectTomixPerformances';
import TomixTheaterPage from '@/views/TomixTheaterPage';

import '../style.scss';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'tomixPage');
}

export default async function LocaleTomixTheaterPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	let performances: TheaterNormalizedPerformance[] = [];
	let hasError = false;

	try {
		const preparedData = await collectTomixPerformances();
		performances = preparedData.performances;
	} catch {
		hasError = true;
	}

	return <TomixTheaterPage locale={locale} performances={performances} hasError={hasError} />;
}
