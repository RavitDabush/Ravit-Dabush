import 'server-only';

import { TheaterId } from './types';

export const THEATER_CACHE_TAG = 'theater';

export function getTheaterCacheTag(theaterId: TheaterId): string {
	return `${THEATER_CACHE_TAG}:${theaterId}`;
}

export function getTheaterCacheTags(theaterId: TheaterId): string[] {
	return [THEATER_CACHE_TAG, getTheaterCacheTag(theaterId)];
}
