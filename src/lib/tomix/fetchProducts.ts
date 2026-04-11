import 'server-only';

import { TomixStoreProduct } from './types';

const TOMIX_THEATER_CATEGORY_ID = 903;
const TOMIX_PRODUCTS_URL = `https://www.to-mix.co.il/wp-json/wc/store/v1/products?category=${TOMIX_THEATER_CATEGORY_ID}&per_page=100`;

const DEFAULT_HEADERS = {
	accept: 'application/json',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

export async function fetchTomixTheaterProducts(): Promise<TomixStoreProduct[]> {
	const response = await fetch(TOMIX_PRODUCTS_URL, {
		headers: DEFAULT_HEADERS,
		next: { revalidate: 600 }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch TOMIX theater products: ${response.status}`);
	}

	const products = (await response.json()) as TomixStoreProduct[];

	return products.filter(product =>
		product.categories?.some(category => category.id === TOMIX_THEATER_CATEGORY_ID || category.slug === 'theatre')
	);
}
