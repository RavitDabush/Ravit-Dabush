import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { collectComingSoonPerformances, ComingSoonPerformance } from '@/lib/theater/collectComingSoonPerformances';
import ComingSoonTheaterPage from '@/views/ComingSoonTheaterPage';
import { parseTheaterViewMode } from '@/components/theater/theaterViewMode';

import '../style.scss';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
	searchParams?: Promise<{ view?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'comingSoonPage');
}

export default async function LocaleComingSoonTheaterPage({ params, searchParams }: Props) {
	const { locale } = await params;
	const resolvedSearchParams = await searchParams;
	setRequestLocale(locale);

	let performances: ComingSoonPerformance[] = [];
	let hasError = false;

	try {
		performances = await collectComingSoonPerformances();
	} catch {
		hasError = true;
	}

	return (
		<ComingSoonTheaterPage
			locale={locale}
			performances={performances}
			hasError={hasError}
			viewMode={parseTheaterViewMode(resolvedSearchParams?.view)}
		/>
	);
}
