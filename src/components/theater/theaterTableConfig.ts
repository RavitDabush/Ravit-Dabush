export type TheaterTableColumn =
	| 'date'
	| 'time'
	| 'show'
	| 'theater'
	| 'venue'
	| 'availableAreas'
	| 'availableSeats'
	| 'saleState'
	| 'action';

export type TheaterTableConfig = {
	columns: TheaterTableColumn[];
};

export const regularTheaterTableConfig = {
	columns: ['date', 'time', 'show', 'venue', 'availableAreas', 'availableSeats', 'action']
} satisfies TheaterTableConfig;

export const comingSoonTheaterTableConfig = {
	columns: ['date', 'time', 'show', 'theater', 'venue', 'saleState', 'action']
} satisfies TheaterTableConfig;

export const aggregatedTheaterTableConfig = {
	columns: ['date', 'time', 'show', 'theater', 'venue', 'availableAreas', 'availableSeats', 'saleState', 'action']
} satisfies TheaterTableConfig;
