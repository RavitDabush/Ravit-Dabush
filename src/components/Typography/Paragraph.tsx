import BaseTypography from './BaseTypography';
import clsx from 'clsx';

type ParagraphProps = {
	children: React.ReactNode;
	className?: string;
};

export default function Paragraph({
	children,
	className = ''
}: ParagraphProps) {
	return (
		<BaseTypography as="p" className={clsx('paragraph-md', className)}>
			{children}
		</BaseTypography>
	);
}
