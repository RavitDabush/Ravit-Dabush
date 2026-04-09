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
	const [visibleCount, setVisibleCount] = useState(pageSize);
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setVisibleCount(pageSize); // Reset visible icons when filters change
	}, [icons]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisibleCount(prev => Math.min(prev + pageSize, icons.length));
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

	const visibleIcons = icons.slice(0, visibleCount);

	return (
		<div className="grid">
			{visibleIcons.map(([name, Icon]) =>
				weights.map(weight => <IconTile key={`${name}-${weight}`} name={name} Icon={Icon} color={color} weight={weight} />)
			)}
			<div ref={sentinelRef} style={{ height: '1px' }} />
		</div>
	);
}
