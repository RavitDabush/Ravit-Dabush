'use client';

import { CaretDown } from '@phosphor-icons/react';
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
					const hasChildren = Boolean(item.children?.length);

					return (
						<li
							key={item.key}
							className={`${itemClassName}${hasChildren ? ` ${isDrawer ? 'site-header-drawer-item--has-children' : 'site-header-nav-item--has-children'}` : ''}`}
						>
							<div className={isDrawer ? 'site-header-drawer-link-group' : 'site-header-nav-link-group'}>
								<NavbarLink href={item.href} isActive={isActive} variant={linkVariant} onClick={onNavigate}>
									{t(`nav.${item.key}`)}
								</NavbarLink>

								{hasChildren && !isDrawer ? (
									<span className="site-header-nav-caret" aria-hidden="true">
										<CaretDown size={14} weight="bold" />
									</span>
								) : null}
							</div>

							{hasChildren ? (
								<ul className={isDrawer ? 'site-header-drawer-submenu' : 'site-header-nav-submenu'}>
									{item.children?.map(child => {
										const isChildActive = isActiveLink(child.href);

										return (
											<li
												key={child.key}
												className={isDrawer ? 'site-header-drawer-submenu-item' : 'site-header-nav-submenu-item'}
											>
												<NavbarLink href={child.href} isActive={isChildActive} variant={linkVariant} onClick={onNavigate}>
													{t(`nav.${child.key}`)}
												</NavbarLink>
											</li>
										);
									})}
								</ul>
							) : null}
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
