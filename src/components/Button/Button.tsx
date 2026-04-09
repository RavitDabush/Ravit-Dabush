'use client';

import { ButtonProps, getButtonClassNames } from './ButtonConfig';

export default function Button({
	variant = 'primary',
	isLoading = false,
	isDisabled = false,
	isSelected = false,
	children,
	onClick,
	type = 'button',
	ariaLabel,
	style,
	title
}: ButtonProps) {
	const isTrulyDisabled = isDisabled || isLoading;

	return (
		<button
			type={type}
			className={getButtonClassNames(variant, isLoading, isSelected)}
			onClick={onClick}
			disabled={isTrulyDisabled}
			aria-disabled={isTrulyDisabled} // Accessibility: screen readers will recognize disabled state
			aria-busy={isLoading} // Accessibility: notifies when button is loading
			aria-label={ariaLabel} // Accessibility: label for buttons without visible text
			style={style}
			title={title}
			tabIndex={isTrulyDisabled ? -1 : undefined}
		>
			{isLoading ? <span className="visually-hidden">Loading</span> : children}
		</button>
	);
}
