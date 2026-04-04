type TableRowProps = {
	children: React.ReactNode;
	className?: string;
};

export default function TableRow({ children, className }: TableRowProps) {
	return <tr className={className}>{children}</tr>;
}
