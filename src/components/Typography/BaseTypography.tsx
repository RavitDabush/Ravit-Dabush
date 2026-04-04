import * as React from 'react';

type BaseTypographyOwnProps = {
	className?: string;
	children: React.ReactNode;
	role?: string;
	tabIndex?: number;
	ariaLabel?: string;
};

type BaseTypographyProps<T extends React.ElementType> =
	BaseTypographyOwnProps & {
		as?: T;
	} & Omit<
			React.ComponentPropsWithoutRef<T>,
			keyof BaseTypographyOwnProps | 'as'
		>;

export default function BaseTypography<T extends React.ElementType = 'span'>({
	as,
	className,
	children,
	role,
	tabIndex,
	ariaLabel,
	...rest
}: BaseTypographyProps<T>) {
	const Component = as || 'span';

	return (
		<Component
			className={className}
			role={role}
			tabIndex={tabIndex}
			aria-label={ariaLabel}
			{...rest}
		>
			{children}
		</Component>
	);
}
