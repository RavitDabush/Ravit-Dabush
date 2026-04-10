export type SelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

export type SelectProps = {
	id: string;
	name?: string;
	label?: string;
	value?: string;
	defaultValue?: string;
	options: SelectOption[];
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	error?: string;
	className?: string;
	onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
};

export function getSelectClassNames(disabled: boolean = false, hasError: boolean = false): string {
	const classes = ['input-field', 'select-field'];

	if (disabled) classes.push('disabled');
	if (hasError) classes.push('has-error');

	return classes.join(' ');
}
