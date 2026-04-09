'use client';

import { Dispatch, SetStateAction } from 'react';
import { IconProps } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { textColors } from './textColors';

type Props = {
	search: string;
	setSearch: Dispatch<SetStateAction<string>>;
	selectedWeights: IconProps['weight'][];
	toggleWeight: (weight: IconProps['weight']) => void;
	color: string;
	setColor: Dispatch<SetStateAction<string>>;
};

const allWeights: IconProps['weight'][] = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'];

export default function IconFilters({ search, setSearch, selectedWeights, toggleWeight, color, setColor }: Props) {
	return (
		<div className="icon-filters">
			<div className="search">
				<input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search icons…" />
			</div>

			<div className="weight-filter multi">
				{allWeights.map(weight => (
					<Button
						key={weight}
						variant="toggle"
						isSelected={selectedWeights.includes(weight)}
						onClick={() => toggleWeight(weight)}
					>
						{weight}
					</Button>
				))}
			</div>

			<div className="color-select">
				{textColors.map(({ label, value }) => (
					<Button
						key={label}
						variant="toggle"
						isSelected={color === value}
						onClick={() => setColor(value)}
						style={{ backgroundColor: `var(${value})` }}
						title={label}
					>
						{label}
					</Button>
				))}
			</div>
		</div>
	);
}
