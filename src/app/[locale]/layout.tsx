import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';
import { AnimatePresence } from 'framer-motion';
import AnimatedPage from '@/components/AnimatedPage';

import '@/styles/globals.scss';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
	return routing.locales.map(locale => ({ locale }));
}

type Props = {
	children: ReactNode;
	params: { locale: string };
};

export const metadata = {
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

export default async function LocaleLayout({ children, params }: Props) {
	const locale = (await params).locale;

	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	const messages = await getMessages({ locale });

	return (
		<html
			lang={locale}
			dir={locale === 'he' ? 'rtl' : 'ltr'}
			className={inter.className}
		>
			<body>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<AnimatePresence mode="wait">
						<AnimatedPage>{children}</AnimatedPage>
					</AnimatePresence>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
