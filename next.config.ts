import withNextIntl from 'next-intl/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	turbopack: {
		rules: {
			'*.svg': {
				loaders: ['@svgr/webpack'],
				as: '*.js'
			}
		}
	}
};

export default withNextIntl('./src/i18n/request.ts')(nextConfig);
