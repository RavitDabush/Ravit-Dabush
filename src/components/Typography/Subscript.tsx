import BaseTypography from './BaseTypography';
type SubscriptProps = {
	className?: string;
	children: React.ReactNode;
};

export default function Subscript({
	className,
	children
}: SubscriptProps) {
	return (
		<BaseTypography as="sub" className={className}>
			{children}
		</BaseTypography>
	);
}
