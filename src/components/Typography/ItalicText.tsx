import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type ItalicTextProps = {
	children: React.ReactNode;
	className?: string;
};

export default function ItalicText({ children, className = '' }: ItalicTextProps) {
	return (
		<BaseTypography as="em" className={clsx('text-italic', className)}>
			{children}
		</BaseTypography>
	);
}
