import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type UnderlineTextProps = {
	children: React.ReactNode;
	className?: string;
};

export default function UnderlineText({
	children,
	className = ''
}: UnderlineTextProps) {
	return (
		<BaseTypography as="u" className={clsx('text-underline', className)}>
			{children}
		</BaseTypography>
	);
}
