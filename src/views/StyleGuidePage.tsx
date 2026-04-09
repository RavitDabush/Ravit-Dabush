import React from 'react';
import { useTranslations } from 'next-intl';
import Colors from '@/components/Colors';
import { Buttons } from '@/components/Button';
import IconsPreview from '@/components/StyleGuide/IconsPreview';
import PageLayout from '@/components/PageLayout';

export default function StyleGuide() {
	const t = useTranslations('styleGuidePage');

	return (
		<PageLayout>
			<h2>{t('title')}</h2>
			<p>{t('vision')}</p>
			<p>{t('description')}</p>

			<Colors />

			<Buttons />

			<IconsPreview />
		</PageLayout>
	);
}
