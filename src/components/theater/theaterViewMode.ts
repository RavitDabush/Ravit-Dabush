export const theaterViewModes = ['cards', 'table'] as const;

export type TheaterViewMode = (typeof theaterViewModes)[number];

export function parseTheaterViewMode(value: string | string[] | undefined): TheaterViewMode {
	const normalizedValue = Array.isArray(value) ? value[0] : value;

	return normalizedValue === 'cards' ? 'cards' : 'table';
}
