import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type Heading4Props = {
	children: React.ReactNode;
	className?: string;
};

export default function Heading4({ children, className = '' }: Heading4Props) {
	return (
		<BaseTypography as="h4" className={clsx('heading-sm', className)}>
			{children}
		</BaseTypography>
	);
}
