'use client';

import BaseTypography from './BaseTypography';

type VisuallyHiddenProps = {
	children: React.ReactNode;
};

export default function VisuallyHidden({
	children
}: VisuallyHiddenProps) {
	return (
		<BaseTypography
			as="span"
			className="visually-hidden"
		>
			{children}
		</BaseTypography>
	);
}
