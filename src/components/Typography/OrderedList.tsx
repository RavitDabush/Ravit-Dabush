import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type OrderedListProps = {
	children: React.ReactNode;
	className?: string;
};

export default function OrderedList({
	children,
	className = ''
}: OrderedListProps) {
	return (
		<BaseTypography
			as="ol"
			className={clsx('list-ordered', className)}
		>
			{children}
		</BaseTypography>
	);
}
