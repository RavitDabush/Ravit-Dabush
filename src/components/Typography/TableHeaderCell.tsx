'use client';

type TableHeaderCellProps = {
	children: React.ReactNode;
	className?: string;
	scope?: 'col' | 'row';
	colSpan?: number;
	rowSpan?: number;
};

export default function TableHeaderCell({
	children,
	className,
	scope = 'col',
	colSpan,
	rowSpan
}: TableHeaderCellProps) {
	return (
		<th scope={scope} className={className} colSpan={colSpan} rowSpan={rowSpan}>
			{children}
		</th>
	);
}
