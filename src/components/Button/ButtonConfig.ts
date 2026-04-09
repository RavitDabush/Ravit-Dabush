// Available button variants
export const buttonVariants = ['primary', 'outline', 'light', 'success', 'error', 'toggle', 'copy'] as const;

export type Variant = (typeof buttonVariants)[number];

// Props for the Button component
export type ButtonProps = {
	variant?: Variant;
	isLoading?: boolean;
	isDisabled?: boolean;
	isSelected?: boolean;
	children: React.ReactNode;
	onClick?: () => void;
	type?: 'button' | 'submit' | 'reset';
	ariaLabel?: string;
	style?: React.CSSProperties;
	title?: string;
};

// Generate className based on button props
export function getButtonClassNames(
	variant: Variant = 'primary',
	isLoading: boolean = false,
	isSelected: boolean = false
): string {
	// Special case: 'copy' button has its own unique style
	if (variant === 'copy') {
		return 'copy-button';
	}

	const classes = ['btn', variant];

	// Toggle button - if selected, add 'active' class
	if (variant === 'toggle' && isSelected) {
		classes.push('active');
	}

	// Loading state - add 'btn-loading' class
	if (isLoading) {
		classes.push('loading');
	}

	return classes.join(' ').trim();
}
