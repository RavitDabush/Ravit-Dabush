'use client';

import { useId, useMemo, useState } from 'react';
import { Heading3, Paragraph } from '@/components/Typography';
import { SourceConfidence } from '@/lib/habima/types';
import PerformanceCard from './PerformanceCard';
import { Select } from '@/components/Select';

type Performance = {
	id: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl?: string;
	availableInPreferredRows: boolean;
	matchedRows: string[];
	availableSeatCount?: number;
	sourceStatus?: string;
	sourceConfidence: SourceConfidence;
};

type PerformanceGroup = {
	date: string;
	label: string;
	performances: Performance[];
};

type Props = {
	performances: Performance[];
	groups: PerformanceGroup[];
	emptyState: {
		title: string;
		description: string;
	};
	labels: {
		time: string;
		venue: string;
		rows: string;
		seats: string;
		confidence: string;
		purchase: string;
		confidenceValues: Record<SourceConfidence, string>;
	};
	filter: {
		label: string;
		allOption: string;
	};
};

function groupPerformances(performances: Performance[], groups: PerformanceGroup[]): PerformanceGroup[] {
	const allowedIds = new Set(performances.map(performance => performance.id));

	return groups
		.map(group => ({
			...group,
			performances: group.performances.filter(performance => allowedIds.has(performance.id))
		}))
		.filter(group => group.performances.length > 0);
}

export default function PerformanceList({ performances, groups, emptyState, labels, filter }: Props) {
	const selectId = useId();
	const [selectedShowName, setSelectedShowName] = useState('');

	const options = useMemo(
		() =>
			Array.from(new Set(performances.map(performance => performance.showName))).sort((left, right) =>
				left.localeCompare(right)
			),
		[performances]
	);

	const filteredPerformances = useMemo(() => {
		if (!selectedShowName) {
			return performances;
		}

		return performances.filter(performance => performance.showName === selectedShowName);
	}, [performances, selectedShowName]);

	const filteredGroups = useMemo(() => groupPerformances(filteredPerformances, groups), [filteredPerformances, groups]);

	return (
		<div className="theater-browser">
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

			{filteredGroups.length === 0 ? (
				<div className="theater-state theater-state-empty" role="status">
					<Heading3>{emptyState.title}</Heading3>
					<Paragraph>{emptyState.description}</Paragraph>
				</div>
			) : (
				<div className="theater-performance-list">
					{filteredGroups.map(group => (
						<section key={group.date} className="theater-date-group">
							<Heading3>{group.label}</Heading3>

							<div className="theater-date-group__grid">
								{group.performances.map(performance => (
									<PerformanceCard key={performance.id} performance={performance} labels={labels} />
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</div>
	);
}
