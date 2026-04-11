import 'server-only';

import { TomixEventerDataResponse, TomixEventerSource, TomixStoreProduct } from './types';

const EVENTER_HOST = 'www.eventer.co.il';

const DEFAULT_HEADERS = {
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

function appendEventbuzz(permalink: string): string {
	const url = new URL(permalink);
	url.searchParams.set('eventbuzz', 'true');

	return url.toString();
}

function decodeHtmlAttribute(value: string): string {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

function extractEventerIframeUrl(html: string): string | null {
	const iframeMatches = html.matchAll(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi);

	for (const match of iframeMatches) {
		const src = decodeHtmlAttribute(match[1]);

		if (src.includes(`https://${EVENTER_HOST}/user/`)) {
			return src;
		}
	}

	return null;
}

function buildGetDataUrl(iframeUrl: string): string {
	const url = new URL(iframeUrl);
	const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;

	url.pathname = `${pathname}/getData`;
	url.searchParams.set('hideExcludedEvents', 'true');

	return url.toString();
}

async function fetchProductEventbuzzHtml(product: TomixStoreProduct): Promise<string> {
	const response = await fetch(appendEventbuzz(product.permalink), {
		headers: DEFAULT_HEADERS,
		next: { revalidate: 600 }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch TOMIX product page ${product.id}: ${response.status}`);
	}

	return response.text();
}

export async function resolveEventerSource(product: TomixStoreProduct): Promise<TomixEventerSource | null> {
	const html = await fetchProductEventbuzzHtml(product);
	const iframeUrl = extractEventerIframeUrl(html);

	if (!iframeUrl) {
		return null;
	}

	return {
		product,
		iframeUrl,
		getDataUrl: buildGetDataUrl(iframeUrl)
	};
}

export async function fetchEventerData(source: TomixEventerSource): Promise<TomixEventerDataResponse> {
	const response = await fetch(source.getDataUrl, {
		headers: {
			...DEFAULT_HEADERS,
			accept: 'application/json'
		},
		next: { revalidate: 300 }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Eventer data for TOMIX product ${source.product.id}: ${response.status}`);
	}

	return response.json();
}
