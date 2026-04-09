'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Heading3, ParagraphLarge } from '@/components/Typography';
import {
	CopySimple,
	Sparkle,
	PencilSimple,
	Eye,
	X,
	Info,
	Check,
	Plus,
	Minus,
	TrashSimple,
	Warning,
	CaretRight,
	CaretDown,
	Lock,
	Gear,
	ArrowRight,
	ArrowLeft,
	User,
	Bell,
	Star,
	MagnifyingGlass,
	DotsThreeVertical
} from '@phosphor-icons/react';

import './IconsPreview.scss';

const icons = [
	{ name: 'CopySimple', component: <CopySimple size={24} /> },
	{ name: 'PencilSimple', component: <PencilSimple size={24} /> },
	{ name: 'Eye', component: <Eye size={24} /> },
	{ name: 'X', component: <X size={24} /> },
	{ name: 'Info', component: <Info size={24} /> },
	{ name: 'Check', component: <Check size={24} /> },
	{ name: 'Plus', component: <Plus size={24} /> },
	{ name: 'Minus', component: <Minus size={24} /> },
	{ name: 'TrashSimple', component: <TrashSimple size={24} /> },
	{ name: 'Warning', component: <Warning size={24} /> },
	{ name: 'CaretRight', component: <CaretRight size={24} /> },
	{ name: 'CaretDown', component: <CaretDown size={24} /> },
	{ name: 'Lock', component: <Lock size={24} /> },
	{ name: 'Gear', component: <Gear size={24} /> },
	{ name: 'ArrowRight', component: <ArrowRight size={24} /> },
	{ name: 'ArrowLeft', component: <ArrowLeft size={24} /> },
	{ name: 'User', component: <User size={24} /> },
	{ name: 'Bell', component: <Bell size={24} /> },
	{ name: 'Star', component: <Star size={24} /> },
	{ name: 'MagnifyingGlass', component: <MagnifyingGlass size={24} /> },
	{ name: 'DotsThreeVertical', component: <DotsThreeVertical size={24} /> }
];

export default function IconsPreview() {
	const t = useTranslations('icons');

	const handleCopy = (name: string) => {
		const snippet = `<${name} size={24} />`;
		navigator.clipboard.writeText(snippet);
		alert(t('copied', { variable: snippet }));
	};

	return (
		<section id="icons" className="styleguide-section">
			<Heading3 className="styleguide-title">
				<Sparkle size={28} weight="regular" /> {t('title')}
			</Heading3>
			<ParagraphLarge>{t('description')}</ParagraphLarge>

			<div className="icons-grid">
				{icons.map(icon => (
					<div className="icon-box" key={icon.name}>
						<div className="icon">{icon.component}</div>
						<div className="icon-name">{icon.name}</div>
						<code className="token-label">{`<${icon.name} size={24} />`}</code>
						<button className="copy-button" onClick={() => handleCopy(icon.name)} type="button">
							<CopySimple size={24} /> {t('copy')}
						</button>
					</div>
				))}
			</div>
		</section>
	);
}
