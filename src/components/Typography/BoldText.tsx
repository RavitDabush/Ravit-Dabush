import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type BoldTextProps = {
	children: React.ReactNode;
	className?: string;
};

export default function BoldText({ children, className = '' }: BoldTextProps) {
	return (
		<BaseTypography as="strong" className={clsx('text-bold', className)}>
			{children}
		</BaseTypography>
	);
}
