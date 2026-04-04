import clsx from 'clsx';
import Label from '@/components/Label/Label';
import { InputProps, getInputClassNames } from './InputConfig';

export default function Input({
	id,
	name,
	label,
	type = 'text',
	value,
	defaultValue,
	placeholder,
	required,
	disabled,
	readOnly,
	error,
	className,
	onChange,
	onBlur
}: InputProps) {
	const errorId = error ? `${id}-error` : undefined;

	return (
		<div className={clsx('input-wrapper', className)}>
			{label && (
				<Label htmlFor={id} required={required}>
					{label}
				</Label>
			)}
			<input
				id={id}
				name={name}
				type={type}
				value={value}
				defaultValue={defaultValue}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				readOnly={readOnly}
				aria-invalid={!!error}
				aria-describedby={errorId}
				className={getInputClassNames(disabled, readOnly, !!error)}
				onChange={onChange}
				onBlur={onBlur}
			/>
			{error && (
				<span id={errorId} className="input-error" role="alert">
					{error}
				</span>
			)}
		</div>
	);
}
