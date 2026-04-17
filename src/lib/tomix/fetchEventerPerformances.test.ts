import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchEventerData, resolveEventerSource } from './fetchEventerPerformances';
import type { TomixStoreProduct } from './types';

vi.mock('next/cache', () => ({
	unstable_cache: (callback: unknown) => callback
}));

const PRODUCT: TomixStoreProduct = {
	id: 10,
	name: 'TOMIX Show',
	slug: 'tomix-show',
	permalink: 'https://www.to-mix.co.il/product/tomix-show/',
	categories: [{ id: 903, slug: 'theatre' }]
};

function createTextResponse(body: string, ok = true, status = 200): Response {
	return {
		ok,
		status,
		text: async () => body
	} as Response;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('tomix resolveEventerSource', () => {
	it('extracts the Eventer iframe URL and builds the matching getData endpoint', async () => {
		const iframeUrl =
			'https://www.eventer.co.il/user/tomix?tag=modlove&amp;colorScheme=%23FFFFFF&amp;lpsec_purchaseBox_2=0';
		const html = `<main><iframe src="${iframeUrl}"></iframe></main>`;
		const fetchMock = vi.fn().mockResolvedValue(createTextResponse(html));
		vi.stubGlobal('fetch', fetchMock);

		const result = await resolveEventerSource(PRODUCT);

		expect(result?.iframeUrl).toBe(
			'https://www.eventer.co.il/user/tomix?tag=modlove&colorScheme=%23FFFFFF&lpsec_purchaseBox_2=0'
		);
		expect(result?.getDataUrl).toBe(
			'https://www.eventer.co.il/user/tomix/getData?tag=modlove&colorScheme=%23FFFFFF&lpsec_purchaseBox_2=0&hideExcludedEvents=true'
		);
		expect(result?.product).toBe(PRODUCT);
		expect(fetchMock).toHaveBeenCalledWith(
			'https://www.to-mix.co.il/product/tomix-show/?eventbuzz=true',
			expect.objectContaining({
				next: { revalidate: 600, tags: ['theater:tomix:discovery'] }
			})
		);
	});

	it('returns null when the product page has no Eventer iframe', async () => {
		const productWithoutIframe = {
			...PRODUCT,
			id: 11,
			slug: 'tomix-show-without-iframe',
			permalink: 'https://www.to-mix.co.il/product/tomix-show-without-iframe/'
		};
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createTextResponse('<main>No iframe here</main>')));

		const result = await resolveEventerSource(productWithoutIframe);

		expect(result).toBeNull();
	});

	it('reuses product Eventbuzz HTML cache by product URL', async () => {
		const product = {
			...PRODUCT,
			id: 12,
			slug: 'cached-tomix-show',
			permalink: 'https://www.to-mix.co.il/product/cached-tomix-show/'
		};
		const html = '<main><iframe src="https://www.eventer.co.il/user/tomix?tag=cached"></iframe></main>';
		const fetchMock = vi.fn().mockResolvedValue(createTextResponse(html));
		vi.stubGlobal('fetch', fetchMock);

		await resolveEventerSource(product);
		await resolveEventerSource(product);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('fetches Eventer getData with the dedicated TOMIX discovery cache tag', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ events: [] })
		} as Response);
		vi.stubGlobal('fetch', fetchMock);

		await fetchEventerData({
			product: PRODUCT,
			iframeUrl: 'https://www.eventer.co.il/user/tomix?tag=data',
			getDataUrl: 'https://www.eventer.co.il/user/tomix/getData?tag=data&hideExcludedEvents=true'
		});

		expect(fetchMock).toHaveBeenCalledWith(
			'https://www.eventer.co.il/user/tomix/getData?tag=data&hideExcludedEvents=true',
			expect.objectContaining({
				next: {
					revalidate: 300,
					tags: ['theater:tomix:discovery', 'theater:tomix:eventer-data']
				}
			})
		);
	});
});
