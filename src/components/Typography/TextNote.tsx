'use client';

import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type TextNoteProps = {
	children: React.ReactNode;
	className?: string;
};

export default function TextNote({ children, className = '' }: TextNoteProps) {
	return (
		<BaseTypography as="small" className={clsx('text-note', className)}>
			{children}
		</BaseTypography>
	);
}
