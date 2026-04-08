'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

type LanguageSwitcherVariant = 'header' | 'drawer';

type LanguageSwitcherProps = {
	variant?: LanguageSwitcherVariant;
	onSelect?: () => void;
};

export default function LanguageSwitcher({ variant = 'header', onSelect }: LanguageSwitcherProps) {
	const locale = useLocale();
	const pathname = usePathname();
	const t = useTranslations('header.languageSwitcher');

	const otherLocale = routing.locales.find(item => item !== locale);

	if (!otherLocale) {
		return null;
	}

	if (variant === 'header') {
		return (
			<Link
				href={pathname}
				locale={otherLocale}
				className="site-header-language-link"
				aria-label={t('switchTo', {
					language: t(`localeName.${otherLocale}`)
				})}
			>
				{t(`localeShort.${otherLocale}`)}
			</Link>
		);
	}

	return (
		<nav className="site-header-drawer-language" aria-label={t('label')}>
			{routing.locales.map((itemLocale, index) => {
				const isActive = itemLocale === locale;

				return (
					<span key={itemLocale} className="site-header-drawer-language-item">
						{isActive ? (
							<span className="site-header-drawer-language-link site-header-drawer-language-link--active" aria-current="page">
								{t(`localeName.${itemLocale}`)}
							</span>
						) : (
							<Link href={pathname} locale={itemLocale} onClick={onSelect} className="site-header-drawer-language-link">
								{t(`localeName.${itemLocale}`)}
							</Link>
						)}

						{index < routing.locales.length - 1 ? (
							<span className="site-header-drawer-language-separator" aria-hidden="true">
								|
							</span>
						) : null}
					</span>
				);
			})}
		</nav>
	);
}
