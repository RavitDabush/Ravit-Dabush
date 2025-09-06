'use client';

import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type Heading6Props = {
	children: React.ReactNode;
	className?: string;
};

export default function Heading6({ children, className = '' }: Heading6Props) {
	return (
		<BaseTypography as="h6" className={clsx('heading-xs', className)}>
			{children}
		</BaseTypography>
	);
}
