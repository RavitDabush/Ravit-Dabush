import BaseTypography from './BaseTypography';

type ListItemProps = {
	children: React.ReactNode;
	className?: string;
};

export default function ListItem({ children, className = '' }: ListItemProps) {
	return (
		<BaseTypography as="li" className={className}>
			{children}
		</BaseTypography>
	);
}
