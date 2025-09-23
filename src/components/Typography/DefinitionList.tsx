'use client';

import BaseTypography from './BaseTypography';

type DefinitionListProps = {
	children: React.ReactNode;
	className?: string;
};

export default function DefinitionList({
	children,
	className
}: DefinitionListProps) {
	return (
		<BaseTypography as="dl" className={className}>
			{children}
		</BaseTypography>
	);
}
