'use client';

import BaseTypography from './BaseTypography';

type CaptionProps = {
	children: React.ReactNode;
	className?: string;
};

export default function Caption({
	children,
	className
}: CaptionProps) {
	return (
		<BaseTypography
			as="figcaption"
			className={className}
		>
			{children}
		</BaseTypography>
	);
}
