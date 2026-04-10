import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { NormalizedPerformance } from '@/lib/cameri/types';
import { createPageMetadata } from '@/lib/metadata';
import { collectCameriPerformances } from '@/lib/theater/collectCameriPerformances';
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

	let performances: NormalizedPerformance[] = [];
	let hasError = false;

	try {
		const preparedData = await collectCameriPerformances();
		performances = preparedData.performances;
	} catch {
		hasError = true;
	}

	return <CameriTheaterPage locale={locale} performances={performances} hasError={hasError} />;
}
