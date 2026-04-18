import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
	locales: ['en', 'he'],
	defaultLocale: 'he',
	localePrefix: 'as-needed',
	pathnames: {
		'/': '/',
		'/about': '/about',
		'/journey': '/journey',
		'/theater': '/theater',
		'/theater/coming-soon': '/theater/coming-soon',
		'/theater/lessin': '/theater/lessin',
		'/theater/habima': '/theater/habima',
		'/theater/cameri': '/theater/cameri',
		'/theater/tomix': '/theater/tomix',
		'/theater/hebrew-theater': '/theater/hebrew-theater',
		'/style-guide': '/style-guide',
		'/icons-explorer': '/icons-explorer'
	}
});
