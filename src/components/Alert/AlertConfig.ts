export const alertVariants = ['info', 'warning', 'error'] as const;

export type AlertVariant = (typeof alertVariants)[number];

export type AlertProps = {
	variant?: AlertVariant;
	title?: string;
	children: React.ReactNode;
	className?: string;
};

export function getAlertClassNames(variant: AlertVariant = 'info'): string {
	return `alert ${variant}`;
}
