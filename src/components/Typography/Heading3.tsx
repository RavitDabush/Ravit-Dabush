import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type Heading3Props = {
	children: React.ReactNode;
	className?: string;
};

export default function Heading3({ children, className = '' }: Heading3Props) {
	return (
		<BaseTypography as="h3" className={clsx('heading-md', className)}>
			{children}
		</BaseTypography>
	);
}
