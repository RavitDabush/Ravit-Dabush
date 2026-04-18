'use server';

import { Locale } from 'next-intl';
import { revalidatePath, updateTag } from 'next/cache';
import { getTheaterCacheTag } from './cache';
import { getDurationMs, logTheaterRefresh } from './observability';
import { TheaterId } from './types';

const theaterPathById: Record<TheaterId, string> = {
	habima: '/theater/habima',
	lessin: '/theater/lessin',
	cameri: '/theater/cameri',
	tomix: '/theater/tomix',
	'hebrew-theater': '/theater/hebrew-theater'
};

function getLocalizedPath(path: string, locale: Locale): string {
	return locale === 'he' ? path : `/${locale}${path}`;
}

export async function refreshTheaterCache(theaterId: TheaterId, locale: Locale): Promise<void> {
	const startedAt = Date.now();

	logTheaterRefresh({ phase: 'start', theaterId, locale, durationMs: 0 });

	updateTag(getTheaterCacheTag(theaterId));
	revalidatePath(getLocalizedPath(theaterPathById[theaterId], locale), 'page');

	logTheaterRefresh({ phase: 'end', theaterId, locale, durationMs: getDurationMs(startedAt) });
}
