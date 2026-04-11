import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTomixTheaterProducts } from './fetchProducts';
import type { TomixStoreProduct } from './types';

function createProduct(id: number, categories: TomixStoreProduct['categories']): TomixStoreProduct {
	return {
		id,
		name: `Product ${id}`,
		slug: `product-${id}`,
		permalink: `https://www.to-mix.co.il/product/product-${id}/`,
		categories
	};
}

function createJsonResponse(body: unknown, ok = true, status = 200): Response {
	return {
		ok,
		status,
		json: async () => body
	} as Response;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('tomix fetchTomixTheaterProducts', () => {
	it('keeps only TOMIX theater products from category id 903 and theatre slug', async () => {
		const products = [
			createProduct(1, [{ id: 903, slug: 'theatre' }]),
			createProduct(2, [{ id: 100, slug: 'theatre' }]),
			createProduct(3, [{ id: 903, slug: 'music' }]),
			createProduct(4, [{ id: 904, slug: 'music' }]),
			createProduct(5, undefined)
		];
		const fetchMock = vi.fn().mockResolvedValue(createJsonResponse(products));
		vi.stubGlobal('fetch', fetchMock);

		const result = await fetchTomixTheaterProducts();

		expect(result.map(product => product.id)).toEqual([1]);
		expect(fetchMock).toHaveBeenCalledWith(
			'https://www.to-mix.co.il/wp-json/wc/store/v1/products?category=903&per_page=100',
			expect.objectContaining({
				next: { revalidate: 600 }
			})
		);
	});

	it('throws when the WooCommerce response is not OK', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse([], false, 500)));

		await expect(fetchTomixTheaterProducts()).rejects.toThrow('Failed to fetch TOMIX theater products: 500');
	});
});
