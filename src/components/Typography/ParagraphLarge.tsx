'use client';

import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type ParagraphLargeProps = {
	children: React.ReactNode;
	className?: string;
};

export default function ParagraphLarge({
	children,
	className = ''
}: ParagraphLargeProps) {
	return (
		<BaseTypography as="p" className={clsx('paragraph-lg', className)}>
			{children}
		</BaseTypography>
	);
}
