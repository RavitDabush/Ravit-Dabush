type ListItemProps = {
	children: React.ReactNode;
	className?: string;
};

export default function ListItem({ children, className = '' }: ListItemProps) {
	return <li className={className}>{children}</li>;
}
