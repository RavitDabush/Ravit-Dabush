import clsx from 'clsx';

type CardProps<T extends React.ElementType = 'article'> = {
	as?: T;
	children: React.ReactNode;
	className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export default function Card<T extends React.ElementType = 'article'>({
	as,
	children,
	className,
	...rest
}: CardProps<T>) {
	const Component = as || 'article';

	return (
		<Component className={clsx('card', className)} {...rest}>
			{children}
		</Component>
	);
}
