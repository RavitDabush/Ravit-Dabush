import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
	locales: ['en', 'he'],
	defaultLocale: 'he',
	localePrefix: 'as-needed',
	pathnames: {
		'/': '/',
		'/about': '/about',
		'/journey': '/journey'
	}
});
