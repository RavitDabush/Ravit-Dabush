'use client';

import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type UnorderedListProps = {
	children: React.ReactNode;
	className?: string;
};

export default function UnorderedList({
	children,
	className = ''
}: UnorderedListProps) {
	return (
		<BaseTypography
			as="ul"
			className={clsx('list', className)}
		>
			{children}
		</BaseTypography>
	);
}
