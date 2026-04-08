import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { Heebo } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';
import { AnimatePresence } from 'framer-motion';
import AnimatedPage from '@/components/AnimatedPage';
import type { Metadata } from 'next';
import Header from '@/components/Header';

import '@/styles/globals.scss';

const heebo = Heebo({ subsets: ['latin', 'hebrew'] });

export function generateStaticParams() {
	return routing.locales.map(locale => ({ locale }));
}

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

/**
 * Global metadata + fallbacks:
 * - title.default = siteName (from DefaultMeta)
 * - title.template = "%s | siteName"  (page with title display as "Title | siteName")
 * - description = default site description (from DefaultMeta)
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params;
	const td = await getTranslations({ locale, namespace: 'defaultMeta' });
	const siteName = td('siteName');
	const defaultDescription = td('description');

	return {
		title: {
			default: siteName,
			template: `%s | ${siteName}`
		},
		description: defaultDescription,
		icons: {
			icon: [
				{ url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
				{ url: '/favicon.svg', type: 'image/svg+xml' }
			],
			shortcut: '/favicon.ico',
			apple: '/apple-touch-icon.png',
			other: [{ rel: 'manifest', url: '/site.webmanifest' }]
		},
		appleWebApp: {
			title: 'Ravit'
		}
	};
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;

	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	const messages = await getMessages({ locale });

	return (
		<html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'} className={heebo.className}>
			<body>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<Header />
					<AnimatePresence mode="wait">
						<AnimatedPage>{children}</AnimatedPage>
					</AnimatePresence>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
