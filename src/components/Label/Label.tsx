import clsx from 'clsx';

type LabelProps = {
	htmlFor: string;
	children: React.ReactNode;
	required?: boolean;
	className?: string;
};

export default function Label({ htmlFor, children, required, className }: LabelProps) {
	return (
		<label htmlFor={htmlFor} className={clsx('input-label', className)}>
			{children}
			{required && (
				<span className="input-label-required" aria-hidden="true">
					*
				</span>
			)}
		</label>
	);
}
