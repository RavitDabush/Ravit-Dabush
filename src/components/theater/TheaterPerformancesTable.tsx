import { LinkButton } from '@/components/Typography';
import type {
	SaleState,
	TheaterAvailabilityType,
	TheaterId,
	TheaterNormalizedPerformance,
	TheaterPerformanceGroup
} from '@/lib/theater/types';
import type { TheaterTableColumn, TheaterTableConfig } from './theaterTableConfig';

type TheaterTableLabels = {
	caption: string;
	headers: Record<TheaterTableColumn, string>;
	notAvailable: string;
	unavailableFallback: string;
	purchase: string;
	purchaseAriaLabel: string;
	availabilityValues?: Partial<Record<TheaterAvailabilityType, string>>;
	saleStateValues: Record<SaleState, string>;
};

type Props<TPerformance extends TheaterNormalizedPerformance> = {
	groups: TheaterPerformanceGroup<TPerformance>[];
	config: TheaterTableConfig;
	labels: TheaterTableLabels;
	theaterNames?: Partial<Record<TheaterId, string>>;
};

function getTheaterId(performance: TheaterNormalizedPerformance): TheaterId | undefined {
	const theaterId = 'theaterId' in performance ? performance.theaterId : undefined;

	return typeof theaterId === 'string' ? (theaterId as TheaterId) : undefined;
}

function formatTheater(
	performance: TheaterNormalizedPerformance,
	theaterNames: Partial<Record<TheaterId, string>> | undefined,
	unavailableFallback: string
): string {
	const theaterId = getTheaterId(performance);

	return theaterId ? (theaterNames?.[theaterId] ?? theaterId) : unavailableFallback;
}

function formatPurchaseAriaLabel(
	template: string,
	performance: TheaterNormalizedPerformance,
	locationText: string
): string {
	return template
		.replace('{showName}', performance.showName)
		.replace('{date}', performance.date)
		.replace('{time}', performance.time)
		.replace('{location}', locationText);
}

function formatLocationText(config: TheaterTableConfig, theaterText: string, venueText: string): string {
	const locationParts = config.columns
		.filter(column => column === 'theater' || column === 'venue')
		.map(column => (column === 'theater' ? theaterText : venueText))
		.filter(Boolean);

	return locationParts.join(', ');
}

function getRowKey(performance: TheaterNormalizedPerformance): string {
	const theaterId = getTheaterId(performance);

	return theaterId ? `${theaterId}-${performance.id}` : performance.id;
}

function formatAvailableAreas(performance: TheaterNormalizedPerformance, unavailableFallback: string): string {
	const matchedRows = performance.matchedRowDisplayLabels?.length
		? performance.matchedRowDisplayLabels
		: performance.matchedRows;

	if (performance.availabilityType === 'row' && matchedRows.length > 0) {
		return matchedRows.join(', ');
	}

	if (performance.availabilityType === 'section' && performance.matchedSections.length > 0) {
		return performance.matchedSections.join(', ');
	}

	if (matchedRows.length > 0) {
		return matchedRows.join(', ');
	}

	if (performance.matchedSections.length > 0) {
		return performance.matchedSections.join(', ');
	}

	return unavailableFallback;
}

function renderColumnValue<TPerformance extends TheaterNormalizedPerformance>(
	column: TheaterTableColumn,
	performance: TPerformance,
	labels: TheaterTableLabels,
	theaterNames: Props<TPerformance>['theaterNames']
): string {
	switch (column) {
		case 'date':
			return performance.date;
		case 'time':
			return performance.time;
		case 'show':
			return performance.showName;
		case 'theater':
			return formatTheater(performance, theaterNames, labels.unavailableFallback);
		case 'venue':
			return performance.venue ?? labels.unavailableFallback;
		case 'availableAreas':
			return formatAvailableAreas(performance, labels.unavailableFallback);
		case 'availableSeats':
			return typeof performance.availableSeatCount === 'number'
				? String(performance.availableSeatCount)
				: labels.unavailableFallback;
		case 'saleState':
			return labels.saleStateValues[performance.saleLifecycle.saleState];
		case 'action':
			return '';
	}
}

export default function TheaterPerformancesTable<TPerformance extends TheaterNormalizedPerformance>({
	groups,
	config,
	labels,
	theaterNames
}: Props<TPerformance>) {
	return (
		<div className="theater-table-scroll" tabIndex={0}>
			<table className="theater-performances-table">
				<caption>{labels.caption}</caption>
				<thead>
					<tr>
						{config.columns.map(column => (
							<th key={column} scope="col">
								{labels.headers[column]}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{groups.flatMap(group =>
						group.performances.map(performance => {
							const theaterText = formatTheater(performance, theaterNames, labels.unavailableFallback);
							const venueText = performance.venue ?? labels.unavailableFallback;
							const locationText = formatLocationText(config, theaterText, venueText);

							return (
								<tr key={`${group.date}-${getRowKey(performance)}`}>
									{config.columns.map(column =>
										column === 'show' ? (
											<th key={column} scope="row">
												{performance.showName}
											</th>
										) : column === 'action' ? (
											<td key={column}>
												{performance.purchaseUrl ? (
													<LinkButton
														href={performance.purchaseUrl}
														buttonType="outline"
														ariaLabel={formatPurchaseAriaLabel(
															labels.purchaseAriaLabel,
															performance,
															locationText || labels.unavailableFallback
														)}
														className="theater-table-action"
													>
														{labels.purchase}
													</LinkButton>
												) : (
													<span>{labels.notAvailable}</span>
												)}
											</td>
										) : (
											<td key={column}>{renderColumnValue(column, performance, labels, theaterNames)}</td>
										)
									)}
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
}
