import Link from 'next/link';
import clsx from 'clsx';
import { Variant, getButtonClassNames } from '@/components/Button/ButtonConfig';

type LinkButtonProps = {
	href: string;
	buttonType?: Variant;
	children: React.ReactNode;
	className?: string;
	isDisabled?: boolean;
	target?: '_blank' | '_self' | '_parent' | '_top';
	rel?: string;
	ariaLabel?: string;
};

export default function LinkButton({
	href,
	buttonType = 'primary',
	children,
	className = '',
	isDisabled = false,
	target,
	rel,
	ariaLabel
}: LinkButtonProps) {
	const isExternal = href.startsWith('http');

	const commonClassNames = clsx(
		'button',
		'link-button',
		getButtonClassNames(buttonType),
		className
	);

	if (isDisabled) {
		return (
			<span
				className={clsx(
					'button',
					'link-button-disabled',
					getButtonClassNames(buttonType),
					className
				)}
				aria-disabled="true"
			>
				{children}
			</span>
		);
	}

	if (isExternal) {
		return (
			<a
				href={href}
				className={commonClassNames}
				target={target || '_blank'}
				rel={rel || 'noopener noreferrer'}
				aria-label={ariaLabel}
			>
				{children}
			</a>
		);
	}

	return (
		<Link href={href} className={commonClassNames} aria-label={ariaLabel}>
			{children}
		</Link>
	);
}
