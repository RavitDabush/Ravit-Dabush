import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type Heading5Props = {
	children: React.ReactNode;
	className?: string;
};

export default function Heading5({ children, className = '' }: Heading5Props) {
	return (
		<BaseTypography as="h5" className={clsx('heading-xs', className)}>
			{children}
		</BaseTypography>
	);
}
