import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type HighlightProps = {
	children: React.ReactNode;
	className?: string;
};

export default function Highlight({
	children,
	className = ''
}: HighlightProps) {
	return (
		<BaseTypography
			as="span"
			className={clsx('highlight', className)}
		>
			{children}
		</BaseTypography>
	);
}
