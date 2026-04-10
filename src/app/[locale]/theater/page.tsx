import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import TheaterIndexPage from '@/views/TheaterIndexPage';

import './style.scss';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'theaterIndexPage');
}

export default async function LocaleTheaterIndexPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <TheaterIndexPage />;
}
