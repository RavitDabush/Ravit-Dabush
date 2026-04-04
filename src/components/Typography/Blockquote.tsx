import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type BlockquoteProps = {
	children: React.ReactNode;
	className?: string;
};

export default function Blockquote({
	children,
	className = ''
}: BlockquoteProps) {
	return (
		<BaseTypography
			as="blockquote"
			className={clsx('blockquote', className)}
		>
			{children}
		</BaseTypography>
	);
}
