import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveEventerSource } from './fetchEventerPerformances';
import type { TomixStoreProduct } from './types';

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
				next: { revalidate: 600 }
			})
		);
	});

	it('returns null when the product page has no Eventer iframe', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createTextResponse('<main>No iframe here</main>')));

		const result = await resolveEventerSource(PRODUCT);

		expect(result).toBeNull();
	});
});
