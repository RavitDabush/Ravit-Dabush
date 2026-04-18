export function formatPerformanceDate(date: string): string {
	const [year, month, day] = date.split('-');

	return year && month && day ? `${day}.${month}.${year}` : date;
}
