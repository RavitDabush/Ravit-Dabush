import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import StyleGuidePage from '@/views/StyleGuidePage';
import './style.scss';
import { createPageMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'styleGuidePage');
}

export default async function LocaleStyleGuidePage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <StyleGuidePage />;
}
