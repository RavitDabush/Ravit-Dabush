import BaseTypography from './BaseTypography';
type InsertedTextProps = {
	className?: string;
	children: React.ReactNode;
	dateTime?: string;
};

export default function InsertedText({
	className,
	children,
	dateTime
}: InsertedTextProps) {
	return (
		<BaseTypography
			as="ins"
			className={className}
			dateTime={dateTime}
		>
			{children}
		</BaseTypography>
	);
}
