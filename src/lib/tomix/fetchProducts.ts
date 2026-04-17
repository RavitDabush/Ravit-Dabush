import 'server-only';

import { getTheaterCacheTags } from '@/lib/theater/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import { TomixStoreProduct } from './types';

const TOMIX_THEATER_CATEGORY_ID = 903;
const TOMIX_PRODUCTS_URL = `https://www.to-mix.co.il/wp-json/wc/store/v1/products?category=${TOMIX_THEATER_CATEGORY_ID}&per_page=100`;

const DEFAULT_HEADERS = {
	accept: 'application/json',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

export async function fetchTomixTheaterProducts(): Promise<TomixStoreProduct[]> {
	const startedAt = Date.now();
	const response = await fetch(TOMIX_PRODUCTS_URL, {
		headers: DEFAULT_HEADERS,
		next: { revalidate: 600, tags: getTheaterCacheTags('tomix') }
	});
	const fetchDurationMs = getDurationMs(startedAt);

	logTheaterFetch({ source: 'tomix.products', durationMs: fetchDurationMs, status: response.status });

	if (!response.ok) {
		throw new Error(`Failed to fetch TOMIX theater products: ${response.status}`);
	}

	const products = (await response.json()) as TomixStoreProduct[];
	const theaterProducts = products.filter(product =>
		product.categories?.some(category => category.id === TOMIX_THEATER_CATEGORY_ID && category.slug === 'theatre')
	);

	console.info('[tomix-products-batch]', {
		productsCount: theaterProducts.length,
		durationMs: getDurationMs(startedAt)
	});

	return theaterProducts;
}
