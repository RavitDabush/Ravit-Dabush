import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type SmallTextProps = {
	children: React.ReactNode;
	className?: string;
};

export default function SmallText({
	children,
	className = ''
}: SmallTextProps) {
	return (
		<BaseTypography
			as="small"
			className={clsx('text-small', className)}
		>
			{children}
		</BaseTypography>
	);
}
