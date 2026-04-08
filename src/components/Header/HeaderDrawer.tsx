'use client';

import type { RefObject } from 'react';
import Image from 'next/image';
import { X } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import HeaderNav from './HeaderNav';
import type { HeaderNavItem } from './types';

type HeaderDrawerProps = {
	isOpen: boolean;
	onClose: () => void;
	drawerRef: RefObject<HTMLElement | null>;
	closeButtonRef: RefObject<HTMLButtonElement | null>;
	logoSrc: string;
	logoAlt: string;
	items: HeaderNavItem[];
};

export default function HeaderDrawer({
	isOpen,
	onClose,
	drawerRef,
	closeButtonRef,
	logoSrc,
	logoAlt,
	items
}: HeaderDrawerProps) {
	const t = useTranslations('header');

	return (
		<>
			<div
				className={`site-header-overlay${isOpen ? ' site-header-overlay--visible' : ''}`}
				onClick={onClose}
				aria-hidden={!isOpen}
			/>

			<aside
				ref={drawerRef}
				id="mobile-navigation"
				className={`site-header-drawer${isOpen ? ' site-header-drawer--open' : ''}`}
				aria-hidden={!isOpen}
				role="dialog"
				aria-modal="true"
				aria-label={t('navAriaLabel')}
				tabIndex={-1}
			>
				<div className="site-header-drawer-header">
					<Link href="/" className="site-header-drawer-logo" onClick={onClose} aria-label={t('homeAriaLabel')}>
						<Image src={logoSrc} alt={logoAlt} width={512} height={120} className="site-header-drawer-logo-image" />
					</Link>

					<button
						ref={closeButtonRef}
						type="button"
						className="site-header-drawer-close"
						aria-label={t('closeMenu')}
						onClick={onClose}
					>
						<X size={24} weight="bold" />
					</button>
				</div>

				<HeaderNav items={items} variant="drawer" onNavigate={onClose} />

				<div className="site-header-drawer-footer">
					<LanguageSwitcher variant="drawer" onSelect={onClose} />
				</div>
			</aside>
		</>
	);
}
