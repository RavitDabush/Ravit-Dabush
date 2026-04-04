import clsx from 'clsx';

type DividerProps = {
	className?: string;
	ariaLabel?: string;
	decorative?: boolean;
};

export default function Divider({
	className = '',
	ariaLabel,
	decorative = false
}: DividerProps) {
	return (
		<hr
			role={
				decorative ? 'presentation' : 'separator'
			}
			aria-hidden={decorative ? true : undefined}
			aria-label={decorative ? undefined : ariaLabel}
			className={clsx('divider', className)}
		/>
	);
}
