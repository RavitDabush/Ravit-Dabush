'use client';

import { useEffect } from 'react';
import { List } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import HeaderDrawer from './HeaderDrawer';
import HeaderLogo from './HeaderLogo';
import HeaderNav from './HeaderNav';
import useHeaderDrawer from './hooks/useHeaderDrawer';
import type { HeaderNavItem } from './types';

const navItems: HeaderNavItem[] = [
	{ href: '/', key: 'home' },
	{ href: '/about', key: 'about' },
	{ href: '/journey', key: 'journey' },
	{ href: '/style-guide', key: 'style-guide' },
	{ href: '/icons-explorer', key: 'icons-explorer' },
	{
		href: '/theater',
		key: 'theater',
		children: [
			{ href: '/theater/coming-soon', key: 'coming-soon' },
			{ href: '/theater/lessin', key: 'lessin' },
			{ href: '/theater/habima', key: 'habima' },
			{ href: '/theater/cameri', key: 'cameri' },
			{ href: '/theater/tomix', key: 'tomix' }
		]
	}
];

export default function Header() {
	const locale = useLocale();
	const pathname = usePathname();
	const t = useTranslations('header');

	const { isOpen, closeDrawer, toggleDrawer, menuToggleButtonRef, drawerCloseButtonRef, drawerRef } = useHeaderDrawer();

	const logoSrc = locale === 'he' ? '/logos/logo-medium-he.svg' : '/logos/logo-medium-en.svg';
	const logoAlt = t('logoAlt');

	useEffect(() => {
		closeDrawer();
	}, [pathname, closeDrawer]);

	return (
		<>
			<header className="site-header">
				<div className="site-header-inner">
					<HeaderLogo
						logoSrc={logoSrc}
						logoAlt={logoAlt}
						homeAriaLabel={t('homeAriaLabel')}
						linkClassName="site-header-logo"
						imageClassName="site-header-logo-image"
						isAboveFold
					/>

					<button
						ref={menuToggleButtonRef}
						type="button"
						className="site-header-menu-toggle"
						aria-label={isOpen ? t('closeMenu') : t('openMenu')}
						aria-expanded={isOpen}
						aria-controls="mobile-navigation"
						onClick={toggleDrawer}
					>
						<List size={24} weight="bold" />
					</button>

					<div className="site-header-desktop-actions">
						<HeaderNav items={navItems} />
						<LanguageSwitcher variant="header" />
					</div>
				</div>
			</header>

			<HeaderDrawer
				isOpen={isOpen}
				onClose={closeDrawer}
				drawerRef={drawerRef}
				closeButtonRef={drawerCloseButtonRef}
				logoSrc={logoSrc}
				logoAlt={logoAlt}
				items={navItems}
			/>
		</>
	);
}
