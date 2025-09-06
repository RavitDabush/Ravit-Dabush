'use client';

import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type FancyTitleProps = {
	as?: React.ElementType;
	children: React.ReactNode;
	className?: string;
};

export default function FancyTitle({
	as: Component = 'h2',
	children,
	className = ''
}: FancyTitleProps) {
	return (
		<BaseTypography
			as={Component}
			className={clsx('fancy-title', className)}
		>
			{children}
		</BaseTypography>
	);
}
