import withNextIntl from 'next-intl/plugin';

const pluginConfig = {};

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

export default withNextIntl(pluginConfig)(nextConfig);
