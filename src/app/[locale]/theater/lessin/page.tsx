import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { NormalizedPerformance } from '@/lib/lessin/types';
import { createPageMetadata } from '@/lib/metadata';
import { collectLessinPerformances } from '@/lib/theater/collectLessinPerformances';
import LessinTheaterPage from '@/views/LessinTheaterPage';

import '../style.scss';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'theaterPage');
}

export default async function LocaleLessinTheaterPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	let performances: NormalizedPerformance[] = [];
	let hasError = false;

	try {
		const preparedData = await collectLessinPerformances();
		performances = preparedData.performances;
	} catch {
		hasError = true;
	}

	return <LessinTheaterPage locale={locale} performances={performances} hasError={hasError} />;
}
