import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import JourneyPage from '@/pages/JourneyPage';
import './style.scss';
import { createPageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'journeyPage');
}

export default async function LocaleJourneyPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <JourneyPage />;
}
