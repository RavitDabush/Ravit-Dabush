'use client';

import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type ParagraphSmallProps = {
	children: React.ReactNode;
	className?: string;
};

export default function ParagraphSmall({
	children,
	className = ''
}: ParagraphSmallProps) {
	return (
		<BaseTypography as="p" className={clsx('paragraph-sm', className)}>
			{children}
		</BaseTypography>
	);
}
