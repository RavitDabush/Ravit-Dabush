import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
	// Typically corresponds to the `[locale]` segment
	const requested = await requestLocale;
	const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

	return {
		locale,
		messages: {
			defaultMeta: (await import(`../../messages/${locale}/defaultMeta.json`)).default,
			homePage: (await import(`../../messages/${locale}/homePage.json`)).default,
			aboutPage: (await import(`../../messages/${locale}/aboutPage.json`)).default,
			journeyPage: (await import(`../../messages/${locale}/journeyPage.json`)).default
		}
	};
});
