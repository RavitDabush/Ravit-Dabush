import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type Heading1Props = {
	children: React.ReactNode;
	className?: string;
};

export default function Heading1({ children, className = '' }: Heading1Props) {
	return (
		<BaseTypography as="h1" className={clsx('heading-xl', className)}>
			{children}
		</BaseTypography>
	);
}
