'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconGrid, IconFilters } from '@/components/IconExplorer';
import { iconList } from '@/components/IconExplorer/iconList';
import { textColors } from '@/components/IconExplorer/textColors';
import { IconProps } from '@phosphor-icons/react';
import PageLayout from '@/components/PageLayout';
import '@/components/IconExplorer/IconExplorer.scss';

export default function IconExplorerPage() {
	const t = useTranslations('iconExplorerPage');

	const [search, setSearch] = useState('');
	const [selectedWeights, setSelectedWeights] = useState<IconProps['weight'][]>(['regular']);
	const [color, setColor] = useState<string>(textColors[0].value);

	const filteredIcons = iconList.filter(([name]) => name.toLowerCase().includes(search.toLowerCase()));

	return (
		<PageLayout>
			<h2>{t('title')}</h2>
			<IconFilters
				search={search}
				setSearch={setSearch}
				selectedWeights={selectedWeights}
				toggleWeight={w => setSelectedWeights(prev => (prev.includes(w) ? prev.filter(p => p !== w) : [...prev, w]))}
				color={color}
				setColor={setColor}
			/>
			<IconGrid icons={filteredIcons} weights={selectedWeights} color={color} />
		</PageLayout>
	);
}
