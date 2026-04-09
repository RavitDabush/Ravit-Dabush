import 'server-only';
import { LessinScheduleEntry } from './types';

const ROW_PATTERN =
	/<tr class="showlistitem"(?![^>]*monthtitle)[^>]*data-date="([^"]+)"[^>]*data-show="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;

function decodeHtml(value: string): string {
	return value
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

function stripTags(value: string): string {
	return decodeHtml(value.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
		.replace(/\s+/g, ' ')
		.trim();
}

function toIsoDate(value: string): string {
	const [day, month, year] = value.split('-');
	return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function normalizeTime(value: string): string {
	const match = value.match(/(\d{1,2}):(\d{2})/);

	if (!match) {
		return value.trim();
	}

	return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function extractTableCells(rowHtml: string): string[] {
	return Array.from(rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g), match => match[1]);
}

function extractPresentationId(rowHtml: string): string | null {
	const match = rowHtml.match(/https:\/\/lessin\.pres\.global\/eWeb\/event\/(\d+)/);
	return match?.[1] ?? null;
}

export function parseSchedule(html: string): LessinScheduleEntry[] {
	const entries: LessinScheduleEntry[] = [];

	for (const match of html.matchAll(ROW_PATTERN)) {
		const [, rawDate, sourceShowId, rowHtml] = match;
		const cells = extractTableCells(rowHtml);

		if (cells.length < 6) {
			continue;
		}

		const presentationId = extractPresentationId(rowHtml);
		const day = stripTags(cells[0] ?? '');
		const date = toIsoDate(rawDate);
		const time = normalizeTime(stripTags(cells[2] ?? ''));
		const venue = stripTags(cells[3] ?? cells[4] ?? '') || undefined;
		const showName = stripTags(cells[5] ?? '');
		const sourceStatus = stripTags(cells[cells.length - 1] ?? '');
		const isSoldOut = !presentationId || sourceStatus.includes('\u05d0\u05d6\u05dc');
		const purchaseUrl = presentationId ? `https://lessin.presglobal.store/order/${presentationId}` : undefined;

		entries.push({
			id: presentationId ?? `${sourceShowId}-${rawDate}-${time}`,
			showName,
			date,
			time,
			venue,
			purchaseUrl,
			sourceStatus,
			sourceDay: day,
			sourceShowId,
			isSoldOut
		});
	}

	return entries.filter(entry => !entry.isSoldOut);
}
