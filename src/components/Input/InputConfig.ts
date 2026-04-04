export const inputTypes = [
	'text',
	'email',
	'password',
	'number',
	'search',
	'url',
	'tel'
] as const;

export type InputType = (typeof inputTypes)[number];

export type InputProps = {
	id: string;
	name: string;
	label?: string;
	type?: InputType;
	value?: string;
	defaultValue?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	error?: string;
	className?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export function getInputClassNames(
	disabled: boolean = false,
	readOnly: boolean = false,
	hasError: boolean = false
): string {
	const classes = ['input-field'];
	if (disabled) classes.push('disabled');
	if (readOnly) classes.push('readonly');
	if (hasError) classes.push('has-error');
	return classes.join(' ');
}
