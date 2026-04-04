import BaseTypography from './BaseTypography';
type DeletedTextProps = {
	className?: string;
	children: React.ReactNode;
	dateTime?: string;
};

export default function DeletedText({
	className,
	children,
	dateTime
}: DeletedTextProps) {
	return (
		<BaseTypography
			as="del"
			className={className}
			dateTime={dateTime}
		>
			{children}
		</BaseTypography>
	);
}
