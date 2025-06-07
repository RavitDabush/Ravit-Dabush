import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import HomePage from '@/pages/HomePage';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export default function LocaleHomePage({ params }: Props) {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <HomePage />;
}
