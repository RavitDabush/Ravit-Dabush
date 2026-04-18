'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { TheaterViewMode } from './theaterViewMode';

type Props = {
	currentViewMode: TheaterViewMode;
};

export default function TheaterViewToggle({ currentViewMode }: Props) {
	const t = useTranslations('theaterView');
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function setViewMode(viewMode: TheaterViewMode) {
		const params = new URLSearchParams(searchParams.toString());
		params.set('view', viewMode);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}

	return (
		<div className="theater-view-toggle" role="group" aria-label={t('toggle.ariaLabel')}>
			<button
				type="button"
				className="theater-view-toggle-button"
				aria-pressed={currentViewMode === 'cards'}
				aria-label={t('toggle.cardsAriaLabel')}
				onClick={() => setViewMode('cards')}
			>
				{t('toggle.cards')}
			</button>
			<button
				type="button"
				className="theater-view-toggle-button"
				aria-pressed={currentViewMode === 'table'}
				aria-label={t('toggle.tableAriaLabel')}
				onClick={() => setViewMode('table')}
			>
				{t('toggle.table')}
			</button>
		</div>
	);
}
