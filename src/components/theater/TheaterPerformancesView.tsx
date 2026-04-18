'use client';

import { useId, useMemo, useState } from 'react';
import { Heading3, Paragraph } from '@/components/Typography';
import { Select } from '@/components/Select';
import PerformanceCard from './PerformanceCard';
import TheaterPerformancesTable from './TheaterPerformancesTable';
import TheaterViewToggle from './TheaterViewToggle';
import type { TheaterTableColumn, TheaterTableConfig } from './theaterTableConfig';
import type { TheaterViewMode } from './theaterViewMode';
import type {
	SaleState,
	TheaterAvailabilityType,
	TheaterId,
	TheaterNormalizedPerformance,
	TheaterPerformanceGroup,
	TheaterSourceConfidence
} from '@/lib/theater/types';

type CardLabels = {
	date?: string;
	time: string;
	venue: string;
	theater?: string;
	saleStart?: string;
	sections: string;
	rows: string;
	availability?: string;
	seats: string;
	confidence: string;
	status: string;
	notAvailable: string;
	purchase: string;
	availabilityValues?: Partial<Record<TheaterAvailabilityType, string>>;
	confidenceValues: Record<TheaterSourceConfidence, string>;
};

type TableLabels = {
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
	performances?: TPerformance[];
	groups: TheaterPerformanceGroup<TPerformance>[];
	currentViewMode: TheaterViewMode;
	emptyState: {
		title: string;
		description: string;
	};
	cardLabels: CardLabels;
	tableLabels: TableLabels;
	tableConfig: TheaterTableConfig;
	theaterNames?: Partial<Record<TheaterId, string>>;
	hideAvailabilityDetails?: boolean;
	filter?: {
		label: string;
		allOption: string;
	};
};

function groupPerformances<TPerformance extends TheaterNormalizedPerformance>(
	performances: TPerformance[],
	groups: TheaterPerformanceGroup<TPerformance>[]
): TheaterPerformanceGroup<TPerformance>[] {
	const allowedIds = new Set(performances.map(performance => performance.id));

	return groups
		.map(group => ({
			...group,
			performances: group.performances.filter(performance => allowedIds.has(performance.id))
		}))
		.filter(group => group.performances.length > 0);
}

function getPerformanceKey(performance: TheaterNormalizedPerformance): string {
	const theaterId = 'theaterId' in performance ? performance.theaterId : undefined;

	return typeof theaterId === 'string' ? `${theaterId}-${performance.id}` : performance.id;
}

function getPerformanceTheaterName(
	performance: TheaterNormalizedPerformance,
	theaterNames?: Partial<Record<TheaterId, string>>
): string | undefined {
	const theaterId = 'theaterId' in performance ? performance.theaterId : undefined;

	return theaterId && typeof theaterId === 'string' ? theaterNames?.[theaterId as TheaterId] : undefined;
}

export default function TheaterPerformancesView<TPerformance extends TheaterNormalizedPerformance>({
	performances,
	groups,
	currentViewMode,
	emptyState,
	cardLabels,
	tableLabels,
	tableConfig,
	theaterNames,
	hideAvailabilityDetails = false,
	filter
}: Props<TPerformance>) {
	const selectId = useId();
	const [selectedShowName, setSelectedShowName] = useState('');
	const filterPerformances = performances ?? groups.flatMap(group => group.performances);
	const options = useMemo(
		() =>
			Array.from(new Set(filterPerformances.map(performance => performance.showName))).sort((left, right) =>
				left.localeCompare(right)
			),
		[filterPerformances]
	);
	const filteredPerformances = useMemo(() => {
		if (!selectedShowName) {
			return filterPerformances;
		}

		return filterPerformances.filter(performance => performance.showName === selectedShowName);
	}, [filterPerformances, selectedShowName]);
	const visibleGroups = useMemo(
		() => (filter ? groupPerformances(filteredPerformances, groups) : groups),
		[filter, filteredPerformances, groups]
	);

	return (
		<div className="theater-performances-view">
			<div className="theater-view-controls">
				{filter ? (
					<div className="input-wrapper theater-filter">
						<Select
							id={selectId}
							label={filter.label}
							value={selectedShowName}
							placeholder={filter.allOption}
							options={options.map(showName => ({
								value: showName,
								label: showName
							}))}
							className="theater-filter"
							onChange={event => setSelectedShowName(event.target.value)}
						/>
					</div>
				) : null}

				<TheaterViewToggle currentViewMode={currentViewMode} />
			</div>

			{visibleGroups.length === 0 ? (
				<div className="theater-state theater-state-empty" role="status">
					<Heading3>{emptyState.title}</Heading3>
					<Paragraph>{emptyState.description}</Paragraph>
				</div>
			) : currentViewMode === 'table' ? (
				<TheaterPerformancesTable
					groups={visibleGroups}
					config={tableConfig}
					labels={tableLabels}
					theaterNames={theaterNames}
				/>
			) : (
				<div className="theater-performance-list">
					{visibleGroups.map(group => (
						<section key={group.date} className="theater-date-group">
							<Heading3>{group.label}</Heading3>

							<div className="theater-card-grid">
								{group.performances.map(performance => (
									<PerformanceCard
										key={getPerformanceKey(performance)}
										performance={performance}
										theaterName={getPerformanceTheaterName(performance, theaterNames)}
										hideAvailabilityDetails={hideAvailabilityDetails}
										labels={cardLabels}
									/>
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</div>
	);
}
