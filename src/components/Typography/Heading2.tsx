import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type Heading2Props = {
	children: React.ReactNode;
	className?: string;
};

export default function Heading2({ children, className = '' }: Heading2Props) {
	return (
		<BaseTypography as="h2" className={clsx('heading-lg', className)}>
			{children}
		</BaseTypography>
	);
}
