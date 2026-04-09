'use client';

import { useEffect, useRef, useState } from 'react';
import { IconProps } from '@phosphor-icons/react';
import IconTile from './IconTile';

type Props = {
	icons: [string, React.FC<IconProps>][];
	weights: IconProps['weight'][];
	color: string;
};

const pageSize = 60;

export default function IconGrid({ icons, weights, color }: Props) {
	const [gridState, setGridState] = useState(() => ({
		lastIcons: icons,
		visibleCount: pageSize
	}));
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	if (gridState.lastIcons !== icons) {
		setGridState({
			lastIcons: icons,
			visibleCount: pageSize
		});
	}

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setGridState(currentState => ({
						...currentState,
						visibleCount: Math.min(currentState.visibleCount + pageSize, icons.length)
					}));
				}
			},
			{ rootMargin: '200px' }
		);

		const sentinel = sentinelRef.current;
		if (sentinel) observer.observe(sentinel);
		return () => {
			if (sentinel) observer.unobserve(sentinel);
		};
	}, [icons.length]);

	const visibleIcons = icons.slice(0, gridState.visibleCount);

	return (
		<div className="grid">
			{visibleIcons.map(([name, Icon]) =>
				weights.map(weight => <IconTile key={`${name}-${weight}`} name={name} Icon={Icon} color={color} weight={weight} />)
			)}
			<div ref={sentinelRef} style={{ height: '1px' }} />
		</div>
	);
}
