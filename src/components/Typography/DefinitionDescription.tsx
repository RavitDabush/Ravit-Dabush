import BaseTypography from './BaseTypography';

type DefinitionDescriptionProps = {
	children: React.ReactNode;
	className?: string;
};

export default function DefinitionDescription({
	children,
	className
}: DefinitionDescriptionProps) {
	return (
		<BaseTypography as="dd" className={className}>
			{children}
		</BaseTypography>
	);
}
