type TableProps = {
	children: React.ReactNode;
	className?: string;
	caption?: string; // for visual caption
	ariaLabel?: string; // for screen readers only
};

export default function Table({
	children,
	className,
	caption,
	ariaLabel
}: TableProps) {
	return (
		<div className="table-wrapper" role="region" aria-label={ariaLabel}>
			<table className={className}>
				{caption && <caption>{caption}</caption>}
				{children}
			</table>
		</div>
	);
}
