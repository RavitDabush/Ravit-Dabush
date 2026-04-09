'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CopySimple, Palette } from '@phosphor-icons/react';
import { colorsList } from './colorsList';
import { Button } from '@/components/Button';
import { Heading3, Heading4 } from '../Typography';
import './Colors.scss';

export default function Colors() {
	const t = useTranslations('colors');

	const handleCopy = (variable: string) => {
		navigator.clipboard.writeText(`var(${variable})`);
		alert(t('copied', { variable: `var(${variable})` }));
	};

	return (
		<section id="colors" className="styleguide-section">
			<Heading3 className="styleguide-title">
				<Palette size={28} weight="regular" /> {t('title')}
			</Heading3>

			{colorsList.map(group => (
				<div key={group.title} className="color-group">
					<Heading4 className="color-group-title">{t(group.title)}</Heading4>

					<div className="color-grid">
						{group.colors.map(color => (
							<div key={color.colorVariable} className="color-box">
								<div
									className="color-swatch"
									style={{
										backgroundColor: `var(${color.colorVariable})`
									}}
									title={color.name}
								></div>

								<div className="color-info">
									<span className="color-name">{color.name}</span>
									<span className="token-label">{color.colorVariable}</span>

									<Button
										variant="copy"
										ariaLabel={`Copy ${color.colorVariable}`}
										onClick={() => handleCopy(color.colorVariable)}
										type="button"
										title={`Copy ${color.colorVariable}`}
									>
										<CopySimple size={20} /> {t('copy')}
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</section>
	);
}
