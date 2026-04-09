'use client';

import { useTranslations } from 'next-intl';
import { TextNote } from '@/components/Typography';
import { Heart } from '@phosphor-icons/react';

export default function Footer() {
	const t = useTranslations('footer');

	return (
		<footer className="footer">
			<TextNote>
				© {new Date().getFullYear()} {t('copyright')}
			</TextNote>
			<TextNote>
				{t('madeWithLove')} <Heart size={14.4} weight="light" />
			</TextNote>
		</footer>
	);
}
