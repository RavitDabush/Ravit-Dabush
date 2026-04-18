'use client';

import { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

type NavbarLinkVariant = 'header' | 'drawer';

type NavbarLinkProps = {
	href:
		| '/'
		| '/about'
		| '/journey'
		| '/style-guide'
		| '/icons-explorer'
		| '/theater'
		| '/theater/coming-soon'
		| '/theater/habima'
		| '/theater/cameri'
		| '/theater/tomix'
		| '/theater/hebrew-theater'
		| '/theater/lessin'
		| '/theater/coming-soon';
	children: ReactNode;
	isActive?: boolean;
	variant?: NavbarLinkVariant;
	onClick?: () => void;
};

export default function NavbarLink({ href, children, isActive = false, variant = 'header', onClick }: NavbarLinkProps) {
	const baseClassName = variant === 'drawer' ? 'site-header-drawer-link' : 'site-header-nav-link';

	const activeClassName = variant === 'drawer' ? 'site-header-drawer-link--active' : 'site-header-nav-link--active';

	const className = `${baseClassName}${isActive ? ` ${activeClassName}` : ''}`;

	return (
		<Link href={href} onClick={onClick} className={className} aria-current={isActive ? 'page' : undefined}>
			{children}
		</Link>
	);
}
