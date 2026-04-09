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
			header: (await import(`../../messages/${locale}/header.json`)).default,
			footer: (await import(`../../messages/${locale}/footer.json`)).default,
			icons: (await import(`../../messages/${locale}/icons.json`)).default,
			colors: (await import(`../../messages/${locale}/colors.json`)).default,
			buttons: (await import(`../../messages/${locale}/buttons.json`)).default,
			iconExplorerPage: (await import(`../../messages/${locale}/iconExplorerPage.json`)).default,
			styleGuidePage: (await import(`../../messages/${locale}/styleGuidePage.json`)).default,
			homePage: (await import(`../../messages/${locale}/homePage.json`)).default,
			aboutPage: (await import(`../../messages/${locale}/aboutPage.json`)).default,
			journeyPage: (await import(`../../messages/${locale}/journeyPage.json`)).default,
			theaterPage: (await import(`../../messages/${locale}/theaterPage.json`)).default,
			habimaPage: (await import(`../../messages/${locale}/habimaPage.json`)).default
		}
	};
});
