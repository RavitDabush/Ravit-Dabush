import clsx from 'clsx';
import Label from '@/components/Label/Label';
import { SelectProps, getSelectClassNames } from './SelectConfig';

export default function Select({
	id,
	name,
	label,
	value,
	defaultValue,
	options,
	placeholder,
	required,
	disabled,
	error,
	className,
	onChange,
	onBlur
}: SelectProps) {
	const errorId = error ? `${id}-error` : undefined;
	const hasPlaceholder = typeof placeholder === 'string' && placeholder.length > 0;

	return (
		<div className={clsx('input-wrapper', className)}>
			{label && (
				<Label htmlFor={id} required={required}>
					{label}
				</Label>
			)}

			<div className="select-wrapper">
				<select
					id={id}
					name={name}
					value={value}
					defaultValue={defaultValue}
					required={required}
					disabled={disabled}
					aria-invalid={!!error}
					aria-describedby={errorId}
					className={getSelectClassNames(disabled, !!error)}
					onChange={onChange}
					onBlur={onBlur}
				>
					{hasPlaceholder && <option value="">{placeholder}</option>}

					{options.map(option => (
						<option key={option.value} value={option.value} disabled={option.disabled}>
							{option.label}
						</option>
					))}
				</select>

				<span className="select-wrapper__icon" aria-hidden="true">
					<svg viewBox="0 0 12 8" focusable="false">
						<path d="M1 1.5L6 6.5L11 1.5" />
					</svg>
				</span>
			</div>

			{error && (
				<span id={errorId} className="input-error" role="alert">
					{error}
				</span>
			)}
		</div>
	);
}
