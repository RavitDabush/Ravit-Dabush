'use client';

import Link from 'next/link';
import clsx from 'clsx';

type LinkTextProps = {
	href: string;
	children: React.ReactNode;
	className?: string;
	isDisabled?: boolean;
	target?: '_blank' | '_self' | '_parent' | '_top';
	rel?: string;
	noUnderline?: boolean;
};

export default function LinkText({
	href,
	children,
	className = '',
	isDisabled = false,
	target,
	rel,
	noUnderline = false
}: LinkTextProps) {
	const isExternal = href.startsWith('http');

	if (isDisabled) {
		return (
			<span
				className={clsx('link-disabled', className)}
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
				className={clsx(
					'link',
					noUnderline && 'link-no-underline',
					className
				)}
				target={target || '_blank'}
				rel={rel || 'noopener noreferrer'}
			>
				{children}
			</a>
		);
	}

	return (
		<Link
			href={href}
			className={clsx(
				'link',
				noUnderline && 'link-no-underline',
				className
			)}
		>
			{children}
		</Link>
	);
}
