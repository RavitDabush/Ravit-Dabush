import BaseTypography from './BaseTypography';

type DefinitionTermProps = {
	children: React.ReactNode;
	className?: string;
};

export default function DefinitionTerm({
	children,
	className
}: DefinitionTermProps) {
	return (
		<BaseTypography as="dt" className={className}>
			{children}
		</BaseTypography>
	);
}
