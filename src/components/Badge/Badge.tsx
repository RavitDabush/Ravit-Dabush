import clsx from 'clsx';

export const badgeVariants = ['primary', 'success', 'error', 'warning', 'neutral'] as const;

export type BadgeVariant = (typeof badgeVariants)[number];

type BadgeProps = {
	variant?: BadgeVariant;
	children: React.ReactNode;
	className?: string;
};

export default function Badge({ variant = 'neutral', children, className }: BadgeProps) {
	return <span className={clsx('badge', variant, className)}>{children}</span>;
}
