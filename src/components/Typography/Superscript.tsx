'use client';

import BaseTypography from './BaseTypography';
type SuperscriptProps = {
	className?: string;
	children: React.ReactNode;
};

export default function Superscript({
	className,
	children
}: SuperscriptProps) {
	return (
		<BaseTypography as="sup" className={className}>
			{children}
		</BaseTypography>
	);
}
