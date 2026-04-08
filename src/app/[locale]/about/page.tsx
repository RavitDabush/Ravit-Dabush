import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import AboutPage from '@/views/AboutPage';
import './style.scss';
import { createPageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'aboutPage');
}

export default async function LocaleAboutPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <AboutPage />;
}
