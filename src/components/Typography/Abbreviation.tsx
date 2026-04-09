import BaseTypography from './BaseTypography';

type AbbreviationProps = {
	className?: string;
	children: React.ReactNode;
	title: string;
};

export default function Abbreviation({ className, children, title }: AbbreviationProps) {
	return (
		<BaseTypography as="abbr" className={className} title={title}>
			{children}
		</BaseTypography>
	);
}
