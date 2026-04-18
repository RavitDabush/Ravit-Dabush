import { describe, expect, it } from 'vitest';
import { parseHebrewTheaterSeatAvailability } from './parseSeatAvailability';

function createChair({
	row,
	status = 'empty',
	section = '56',
	sectionName = '',
	sectionType = 'marked',
	chair = '1'
}: {
	row?: string;
	status?: string;
	section?: string;
	sectionName?: string;
	sectionType?: string;
	chair?: string;
}): string {
	return `
		<div class="theater" data-area-id="${section}" data-area-name="${sectionName}" data-area-type-key="${sectionType}">
			<button
				class="chair ${status}"
				data-area="${section}"
				data-chair="${chair}"
				${row ? `data-row="${row}"` : ''}
				data-status="${status}">
			</button>
		</div>
	`;
}

function createSmarticketAnchorChair({
	row,
	status = 'empty',
	section = '69',
	sectionName = '\u05d0\u05d6\u05d5\u05e8 \u05d7\u05d3\u05e9',
	sectionType = 'marked',
	chair = '1'
}: {
	row?: string;
	status?: string;
	section?: string;
	sectionName?: string;
	sectionType?: string;
	chair?: string;
}): string {
	return `
		<div class="theater " data-show-theater="10872" data-area-id="${section}" data-area-type-key="${sectionType}" data-area-name="${sectionName}">
			<a
				href="#"
				role="button"
				class="chair ${status}"
				data-area="${section}"
				data-chair="${chair}"
				${row ? `data-row="${row}"` : ''}
				data-id="134996"
				data-chair-types="874"
				${status ? `data-status="${status}"` : ''}
				aria-label="\u05e9\u05d5\u05e8\u05d4 ${row} \u05db\u05d9\u05e1\u05d0 ${chair}">
			</a>
		</div>
	`;
}

describe('hebrewTheater parseSeatAvailability', () => {
	it('counts available main-hall seats in preferred rows', () => {
		const html = [
			createChair({ row: '1', chair: '1' }),
			createChair({ row: '7', chair: '2' }),
			createChair({ row: '8', chair: '3' }),
			createChair({ row: '3', status: 'taken', chair: '4' })
		].join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['56']);
		expect(result.matchedRows).toEqual(['1', '7']);
		expect(result.matchedRowDisplayLabels).toEqual(['1', '7']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('accepts a real Smarticket anchor seat in row 3', () => {
		const html = createSmarticketAnchorChair({ row: '3', section: '56', sectionName: '', chair: '27' });

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['56']);
		expect(result.matchedRows).toEqual(['3']);
		expect(result.availableSeatCount).toBe(1);
	});

	it('accepts a real Smarticket anchor seat in row 4 with generic Smarticket area metadata', () => {
		const html = createSmarticketAnchorChair({ row: '4', section: '69', chair: '32' });

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['\u05d0\u05d6\u05d5\u05e8 \u05d7\u05d3\u05e9']);
		expect(result.matchedRows).toEqual(['4']);
		expect(result.availableSeatCount).toBe(1);
	});

	it('accepts a real Smarticket anchor seat in row 7', () => {
		const html = createSmarticketAnchorChair({ row: '7', section: '72', chair: '1' });

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['\u05d0\u05d6\u05d5\u05e8 \u05d7\u05d3\u05e9']);
		expect(result.matchedRows).toEqual(['7']);
		expect(result.availableSeatCount).toBe(1);
	});

	it('does not require Smarticket section names to match TOMIX venue allowlists', () => {
		const html = createSmarticketAnchorChair({ row: '4', section: '69', chair: '25' });

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual(['\u05d0\u05d6\u05d5\u05e8 \u05d7\u05d3\u05e9']);
		expect(result.availableSeatCount).toBe(1);
	});

	it('deduplicates repeated Smarticket rows while still counting available seats', () => {
		const html = [
			createSmarticketAnchorChair({ row: '3', chair: '1' }),
			createSmarticketAnchorChair({ row: '3', chair: '2' }),
			createSmarticketAnchorChair({ row: '3', chair: '3' })
		].join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedRows).toEqual(['3']);
		expect(result.matchedRowDisplayLabels).toEqual(['3']);
		expect(result.availableSeatCount).toBe(3);
	});

	it('keeps a preferred row available when unavailable Smarticket seats appear in the same row', () => {
		const html = [
			createSmarticketAnchorChair({ row: '3', status: 'taken', chair: '1' }),
			createSmarticketAnchorChair({ row: '3', chair: '2' }),
			createSmarticketAnchorChair({ row: '3', status: 'reserved', chair: '3' })
		].join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedRows).toEqual(['3']);
		expect(result.availableSeatCount).toBe(1);
	});

	it('parses anchor-only Smarticket chairmaps', () => {
		const html = createSmarticketAnchorChair({ row: '4', chair: '9' });

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedRows).toEqual(['4']);
		expect(result.sourceStatus).toBe('smarticket-chairmap:data-row:data-status | venue-sections:main-hall-only');
	});

	it('accepts every preferred Smarticket row and rejects row 8 even when seats are available', () => {
		const html = Array.from({ length: 8 }, (_, index) =>
			createSmarticketAnchorChair({ row: String(index + 1), chair: String(index + 1) })
		).join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedRows).toEqual(['1', '2', '3', '4', '5', '6', '7']);
		expect(result.matchedRowDisplayLabels).toEqual(['1', '2', '3', '4', '5', '6', '7']);
		expect(result.availableSeatCount).toBe(7);
	});

	it('keeps Smarticket section context isolated between mixed sections', () => {
		const html = [
			createSmarticketAnchorChair({
				row: '3',
				section: 'main-1',
				sectionName: '\u05d0\u05d5\u05dc\u05dd',
				chair: '10'
			}),
			createSmarticketAnchorChair({
				row: '4',
				section: 'gallery',
				sectionName: '\u05d9\u05e6\u05d9\u05e2',
				chair: '11'
			}),
			createSmarticketAnchorChair({
				row: '5',
				section: 'main-2',
				sectionName: '\u05d0\u05d5\u05dc\u05dd \u05ea\u05d7\u05ea\u05d5\u05df',
				chair: '12'
			})
		].join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedSections).toEqual([
			'\u05d0\u05d5\u05dc\u05dd',
			'\u05d0\u05d5\u05dc\u05dd \u05ea\u05d7\u05ea\u05d5\u05df'
		]);
		expect(result.matchedRows).toEqual(['3', '5']);
		expect(result.availableSeatCount).toBe(2);
	});

	it('fails closed when real Smarticket anchor seats are missing row or status metadata', () => {
		const html = [
			createSmarticketAnchorChair({ row: undefined, chair: '1' }),
			`
				<div class="theater " data-show-theater="10872" data-area-id="69" data-area-type-key="marked" data-area-name="\u05d0\u05d6\u05d5\u05e8 \u05d7\u05d3\u05e9">
					<a
						href="#"
						role="button"
						class="chair empty"
						data-area="69"
						data-chair="2"
						data-row="4"
						data-id="134997"
						data-chair-types="874">
					</a>
				</div>
			`
		].join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
	});

	it('uses the displayed row label and excludes balcony rows even when the raw row starts with a preferred number', () => {
		const html = [
			createChair({ row: '3 יציע', chair: '1' }),
			createChair({ row: '4 מרפסת', chair: '2' }),
			createChair({ row: '2', chair: '3' })
		].join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(true);
		expect(result.matchedRows).toEqual(['2']);
		expect(result.availableSeatCount).toBe(1);
	});

	it('excludes balcony, box, and special sections', () => {
		const html = [
			createChair({ row: '1', section: '1', sectionName: 'יציע' }),
			createChair({ row: '2', section: '2', sectionName: 'Box right' }),
			createChair({ row: '3', section: '3', sectionName: 'Special area' })
		].join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.matchedSections).toEqual([]);
		expect(result.matchedRows).toEqual([]);
		expect(result.availableSeatCount).toBe(0);
	});

	it('fails closed when rows are missing or malformed', () => {
		const html = [
			createChair({ chair: '1' }),
			createChair({ row: 'A', chair: '2' }),
			createChair({ row: 'שורה אחורית', chair: '3' })
		].join('');

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.availableSeatCount).toBe(0);
	});

	it('fails closed when section metadata is unknown', () => {
		const html = `
			<button class="chair empty" data-row="1" data-chair="1" data-status="empty"></button>
		`;

		const result = parseHebrewTheaterSeatAvailability(html);

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.availableSeatCount).toBe(0);
	});

	it('fails closed for malformed non-chairmap HTML', () => {
		const result = parseHebrewTheaterSeatAvailability('<main>not a chairmap</main>');

		expect(result.availableInPreferredRows).toBe(false);
		expect(result.sourceStatus).toBe('smarticket-chairmap:missing-seat-map');
		expect(result.sourceConfidence).toBe('low');
	});
});
