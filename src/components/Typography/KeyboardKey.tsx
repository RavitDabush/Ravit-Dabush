'use client';

import BaseTypography from './BaseTypography';
type KeyboardKeyProps = {
	className?: string;
	children: React.ReactNode;
};

export default function KeyboardKey({
	className,
	children
}: KeyboardKeyProps) {
	return (
		<BaseTypography as="kbd" className={className}>
			{children}
		</BaseTypography>
	);
}
