import BaseTypography from './BaseTypography';
type MarkTextProps = {
	className?: string;
	children: React.ReactNode;
};

export default function MarkText({ className, children }: MarkTextProps) {
	return (
		<BaseTypography as="mark" className={className}>
			{children}
		</BaseTypography>
	);
}
