'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import NavbarLink from '@/components/NavbarLink';
import type { HeaderNavItem, HeaderNavVariant } from './types';

type HeaderNavProps = {
	items: HeaderNavItem[];
	variant?: HeaderNavVariant;
	onNavigate?: () => void;
};

export default function HeaderNav({ items, variant = 'desktop', onNavigate }: HeaderNavProps) {
	const pathname = usePathname();
	const t = useTranslations('header');

	const isDrawer = variant === 'drawer';

	const navClassName = isDrawer ? 'site-header-drawer-nav' : 'site-header-nav';
	const listClassName = isDrawer ? 'site-header-drawer-list' : 'site-header-nav-list';
	const itemClassName = isDrawer ? 'site-header-drawer-item' : 'site-header-nav-item';
	const linkVariant = isDrawer ? 'drawer' : 'header';

	const isActiveLink = (href: HeaderNavItem['href']) => {
		if (href === '/') {
			return pathname === '/';
		}

		return pathname === href || pathname.startsWith(`${href}/`);
	};

	return (
		<nav className={navClassName} aria-label={t('navAriaLabel')}>
			<ul className={listClassName}>
				{items.map(item => {
					const isActive = isActiveLink(item.href);

					return (
						<li key={item.key} className={itemClassName}>
							<NavbarLink href={item.href} isActive={isActive} variant={linkVariant} onClick={onNavigate}>
								{t(`nav.${item.key}`)}
							</NavbarLink>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
