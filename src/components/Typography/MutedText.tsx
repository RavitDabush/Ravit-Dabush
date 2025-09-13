import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type MutedTextProps = {
	children: React.ReactNode;
	className?: string;
};

export default function MutedText({
	children,
	className = ''
}: MutedTextProps) {
	return (
		<BaseTypography as="span" className={clsx('text-muted', className)}>
			{children}
		</BaseTypography>
	);
}
