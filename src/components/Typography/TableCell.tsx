type TableCellProps = {
	children: React.ReactNode;
	className?: string;
	colSpan?: number;
	rowSpan?: number;
};

export default function TableCell({ children, className, colSpan, rowSpan }: TableCellProps) {
	return (
		<td className={className} colSpan={colSpan} rowSpan={rowSpan}>
			{children}
		</td>
	);
}
