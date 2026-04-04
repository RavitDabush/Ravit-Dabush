import BaseTypography from './BaseTypography';
type TimeTagProps = {
	className?: string;
	children: React.ReactNode;
	dateTime: string;
};

export default function TimeTag({
	className,
	children,
	dateTime
}: TimeTagProps) {
	return (
		<BaseTypography
			as="time"
			className={className}
			dateTime={dateTime}
		>
			{children}
		</BaseTypography>
	);
}
