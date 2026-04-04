import clsx from 'clsx';
import Label from '@/components/Label/Label';
import { getInputClassNames } from '@/components/Input/InputConfig';

type TextareaProps = {
	id: string;
	name: string;
	label?: string;
	value?: string;
	defaultValue?: string;
	placeholder?: string;
	rows?: number;
	required?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	error?: string;
	className?: string;
	onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
};

export default function Textarea({
	id,
	name,
	label,
	value,
	defaultValue,
	placeholder,
	rows = 4,
	required,
	disabled,
	readOnly,
	error,
	className,
	onChange,
	onBlur
}: TextareaProps) {
	const errorId = error ? `${id}-error` : undefined;

	return (
		<div className={clsx('input-wrapper', className)}>
			{label && (
				<Label htmlFor={id} required={required}>
					{label}
				</Label>
			)}
			<textarea
				id={id}
				name={name}
				value={value}
				defaultValue={defaultValue}
				placeholder={placeholder}
				rows={rows}
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
