import { ParsedHebrewTheaterSeatAvailability } from './types';

const PREFERRED_ROW_MIN = 1;
const PREFERRED_ROW_MAX = 7;
const FORBIDDEN_SECTION_TERMS = [
	'יציע',
	'מרפסת',
	'בלקון',
	'balcony',
	'box',
	'boxes',
	'תא',
	'תאים',
	'מיוחד',
	'special',
	'immersive'
];

type ParsedAttributes = Record<string, string>;

type CurrentSection = {
	id: string | null;
	name: string | null;
	type: string | null;
};

function decodeHtmlAttribute(value: string): string {
	return value
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.trim();
}

function parseAttributes(tag: string): ParsedAttributes {
	const attributes: ParsedAttributes = {};
	const matches = tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g);

	for (const match of matches) {
		attributes[match[1].toLowerCase()] = decodeHtmlAttribute(match[2] ?? match[3] ?? match[4] ?? '');
	}

	return attributes;
}

function hasClass(attributes: ParsedAttributes, className: string): boolean {
	return attributes.class?.split(/\s+/).includes(className) ?? false;
}

function normalizeText(value: string | null | undefined): string {
	return (value ?? '').replace(/\s+/g, ' ').trim();
}

function containsForbiddenSectionTerm(value: string | null | undefined): boolean {
	const normalized = normalizeText(value).toLowerCase();

	return Boolean(normalized) && FORBIDDEN_SECTION_TERMS.some(term => normalized.includes(term));
}

function parsePreferredRowNumber(rowLabel: string | null | undefined): number | null {
	const normalized = normalizeText(rowLabel);

	if (!normalized || containsForbiddenSectionTerm(normalized)) {
		return null;
	}

	const rowMatch = normalized.match(/^(?:שורה\s*)?([1-9]\d*)$/u);

	return rowMatch ? Number(rowMatch[1]) : null;
}

function isPreferredRow(rowNumber: number): boolean {
	return rowNumber >= PREFERRED_ROW_MIN && rowNumber <= PREFERRED_ROW_MAX;
}

function getSectionLabel(section: CurrentSection): string | null {
	return section.name || section.id;
}

function isMainHallSection(section: CurrentSection): boolean {
	const sectionLabel = getSectionLabel(section);

	if (!sectionLabel) {
		return false;
	}

	if (containsForbiddenSectionTerm(section.name) || containsForbiddenSectionTerm(section.type)) {
		return false;
	}

	return true;
}

function sortLabels(left: string, right: string): number {
	return left.localeCompare(right, 'he', { numeric: true });
}

export function parseHebrewTheaterSeatAvailability(html: string): ParsedHebrewTheaterSeatAvailability {
	const matchedSections = new Set<string>();
	const matchedRows = new Set<string>();
	const matchedRowDisplayLabels = new Set<string>();
	let availableSeatCount = 0;
	let sawChairMap = false;
	let currentSection: CurrentSection = {
		id: null,
		name: null,
		type: null
	};

	try {
		for (const match of html.matchAll(/<(?:a|div|button|span|td)\b[^>]*>/gi)) {
			const attributes = parseAttributes(match[0]);

			if (hasClass(attributes, 'theater') || attributes['data-area-id']) {
				currentSection = {
					id: normalizeText(attributes['data-area-id'] || attributes['data-area']) || currentSection.id,
					name: normalizeText(attributes['data-area-name']) || currentSection.name,
					type: normalizeText(attributes['data-area-type-key']) || currentSection.type
				};
			}

			if (!hasClass(attributes, 'chair')) {
				continue;
			}

			sawChairMap = true;

			if (attributes['data-status'] !== 'empty' || !hasClass(attributes, 'empty')) {
				continue;
			}

			if (!isMainHallSection(currentSection)) {
				continue;
			}

			const displayRow = normalizeText(attributes['data-row']);
			const preferredRowNumber = parsePreferredRowNumber(displayRow);

			if (!preferredRowNumber || !isPreferredRow(preferredRowNumber)) {
				continue;
			}

			const sectionLabel = getSectionLabel(currentSection);

			if (!sectionLabel) {
				continue;
			}

			availableSeatCount += 1;
			matchedSections.add(sectionLabel);
			matchedRows.add(displayRow);
			matchedRowDisplayLabels.add(displayRow);
		}
	} catch {
		return {
			availableInPreferredRows: false,
			matchedSections: [],
			matchedRows: [],
			matchedRowDisplayLabels: [],
			availableSeatCount: 0,
			sourceStatus: 'smarticket-chairmap:parse-error',
			sourceConfidence: 'low'
		};
	}

	return {
		availableInPreferredRows: availableSeatCount > 0,
		matchedSections: Array.from(matchedSections).sort(sortLabels),
		matchedRows: Array.from(matchedRows).sort(sortLabels),
		matchedRowDisplayLabels: Array.from(matchedRowDisplayLabels).sort(sortLabels),
		availableSeatCount,
		sourceStatus: sawChairMap
			? 'smarticket-chairmap:data-row:data-status | venue-sections:main-hall-only'
			: 'smarticket-chairmap:missing-seat-map',
		sourceConfidence: sawChairMap ? 'medium' : 'low'
	};
}
