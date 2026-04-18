import 'server-only';

import { unstable_cache } from 'next/cache';
import { getDurationMs, logTheaterFetch } from '@/lib/theater/observability';
import { TomixEventerDataResponse, TomixEventerEvent, TomixEventerSource, TomixStoreProduct } from './types';

const EVENTER_HOST = 'www.eventer.co.il';
const TOMIX_PRODUCT_EVENTBUZZ_REVALIDATE_SECONDS = 600;
const TOMIX_EVENTER_DATA_REVALIDATE_SECONDS = 300;
const TOMIX_DISCOVERY_CACHE_TAG = 'theater:tomix:discovery';
const TOMIX_EVENTER_DATA_CACHE_TAG = 'theater:tomix:eventer-data';
const TOMIX_PRODUCT_EVENTBUZZ_CACHE_TAGS = [TOMIX_DISCOVERY_CACHE_TAG];
const TOMIX_EVENTER_DATA_CACHE_TAGS = [TOMIX_DISCOVERY_CACHE_TAG, TOMIX_EVENTER_DATA_CACHE_TAG];

const DEFAULT_HEADERS = {
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
};

type RuntimeCacheEntry<T> = {
	value: Promise<T>;
	expiresAtMs: number;
};

const runtimeProductEventbuzzHtmlCache = new Map<string, RuntimeCacheEntry<string>>();
const runtimeEventerDataCache = new Map<string, RuntimeCacheEntry<TomixEventerDataResponse>>();

function getRuntimeCachedValue<T>(
	cache: Map<string, RuntimeCacheEntry<T>>,
	key: string,
	revalidateSeconds: number,
	loader: () => Promise<T>
): Promise<T> {
	const now = Date.now();
	const cacheEntry = cache.get(key);

	if (cacheEntry && cacheEntry.expiresAtMs > now) {
		return cacheEntry.value;
	}

	if (cacheEntry) {
		cache.delete(key);
	}

	const value = loader().catch(error => {
		cache.delete(key);
		throw error;
	});

	cache.set(key, {
		value,
		expiresAtMs: now + revalidateSeconds * 1000
	});

	return value;
}

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

async function fetchProductEventbuzzHtmlByUrl(eventbuzzUrl: string): Promise<string> {
	const startedAt = Date.now();
	const response = await fetch(eventbuzzUrl, {
		headers: DEFAULT_HEADERS,
		next: {
			revalidate: TOMIX_PRODUCT_EVENTBUZZ_REVALIDATE_SECONDS,
			tags: TOMIX_PRODUCT_EVENTBUZZ_CACHE_TAGS
		}
	});
	logTheaterFetch({
		source: 'tomix.productEventbuzzHtml',
		durationMs: getDurationMs(startedAt),
		status: response.status
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch TOMIX product page ${eventbuzzUrl}: ${response.status}`);
	}

	return response.text();
}

const fetchCachedProductEventbuzzHtmlByUrl = unstable_cache(
	fetchProductEventbuzzHtmlByUrl,
	['theater', 'tomix', 'product-eventbuzz-html', 'v1'],
	{ revalidate: TOMIX_PRODUCT_EVENTBUZZ_REVALIDATE_SECONDS, tags: TOMIX_PRODUCT_EVENTBUZZ_CACHE_TAGS }
);

export async function resolveEventerSource(product: TomixStoreProduct): Promise<TomixEventerSource | null> {
	const eventbuzzUrl = appendEventbuzz(product.permalink);
	const html = await getRuntimeCachedValue(
		runtimeProductEventbuzzHtmlCache,
		eventbuzzUrl,
		TOMIX_PRODUCT_EVENTBUZZ_REVALIDATE_SECONDS,
		() => fetchCachedProductEventbuzzHtmlByUrl(eventbuzzUrl)
	);
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

async function fetchEventerDataByUrl(getDataUrl: string): Promise<TomixEventerDataResponse> {
	const startedAt = Date.now();
	const response = await fetch(getDataUrl, {
		headers: {
			...DEFAULT_HEADERS,
			accept: 'application/json'
		},
		next: {
			revalidate: TOMIX_EVENTER_DATA_REVALIDATE_SECONDS,
			tags: TOMIX_EVENTER_DATA_CACHE_TAGS
		}
	});
	logTheaterFetch({ source: 'tomix.eventerData', durationMs: getDurationMs(startedAt), status: response.status });

	if (!response.ok) {
		throw new Error(`Failed to fetch Eventer data for TOMIX source ${getDataUrl}: ${response.status}`);
	}

	return response.json();
}

const fetchCachedEventerDataByUrl = unstable_cache(fetchEventerDataByUrl, ['theater', 'tomix', 'eventer-data', 'v1'], {
	revalidate: TOMIX_EVENTER_DATA_REVALIDATE_SECONDS,
	tags: TOMIX_EVENTER_DATA_CACHE_TAGS
});

export async function fetchEventerData(source: TomixEventerSource): Promise<TomixEventerDataResponse> {
	return getRuntimeCachedValue(runtimeEventerDataCache, source.getDataUrl, TOMIX_EVENTER_DATA_REVALIDATE_SECONDS, () =>
		fetchCachedEventerDataByUrl(source.getDataUrl)
	);
}

type TomixEventerExplainNamesResponse = {
	event?: TomixEventerEvent;
};

async function fetchEventerEventDetailsByLinkNameRaw(linkName: string): Promise<TomixEventerEvent | null> {
	const startedAt = Date.now();
	const response = await fetch(`https://${EVENTER_HOST}/events/explainNames/${linkName}.js?group=a`, {
		headers: {
			...DEFAULT_HEADERS,
			accept: 'application/json'
		},
		next: {
			revalidate: TOMIX_EVENTER_DATA_REVALIDATE_SECONDS,
			tags: TOMIX_EVENTER_DATA_CACHE_TAGS
		}
	});
	logTheaterFetch({
		source: 'tomix.eventerEventDetails',
		durationMs: getDurationMs(startedAt),
		status: response.status
	});

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as TomixEventerExplainNamesResponse;

	return data.event ?? null;
}

const fetchCachedEventerEventDetailsByLinkName = unstable_cache(
	fetchEventerEventDetailsByLinkNameRaw,
	['theater', 'tomix', 'eventer-event-details', 'v1'],
	{
		revalidate: TOMIX_EVENTER_DATA_REVALIDATE_SECONDS,
		tags: TOMIX_EVENTER_DATA_CACHE_TAGS
	}
);

export async function fetchEventerEventDetailsByLinkName(linkName: string): Promise<TomixEventerEvent | null> {
	return fetchCachedEventerEventDetailsByLinkName(linkName);
}
