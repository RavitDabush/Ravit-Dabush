'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CopySimple, RadioButton } from '@phosphor-icons/react';
import { Button, buttonVariants } from './index';
import { Heading3 } from '../Typography';

export default function Buttons() {
	const t = useTranslations('buttons');

	// Only display basic variants, exclude 'toggle' and 'copy' from UI showcase
	const displayVariants = buttonVariants.filter(variant => variant !== 'toggle' && variant !== 'copy');

	const buttons = displayVariants.map(variant => ({
		label: t(variant),
		variant,
		colorVariable: `--color-btn-${variant}`,
		disabled: false,
		loading: false
	}));

	// Additional buttons with custom states
	const extraButtons = [
		{
			label: t('disabled'),
			variant: 'primary',
			colorVariable: '--color-btn-disabled',
			disabled: true,
			loading: false
		},
		{
			label: t('loading'),
			variant: 'primary',
			colorVariable: '--color-btn-primary (loading)',
			disabled: false,
			loading: true
		}
	];

	const allButtons = [...buttons, ...extraButtons];

	const handleCopy = (variant: string, disabled: boolean, loading: boolean) => {
		const snippet = `<Button variant={"${variant}"} isDisabled={${disabled}} isLoading={${loading}}>Button</Button>`;
		navigator.clipboard.writeText(snippet);
		alert(t('copied', { variable: snippet }));
	};

	return (
		<section id="buttons" className="styleguide-section">
			<Heading3 className="styleguide-title">
				<RadioButton size={28} weight="regular" /> {t('title')}
			</Heading3>

			<div className="buttons-grid">
				{allButtons.map(({ label, variant, colorVariable, disabled, loading }) => (
					<div className="button-box" key={`${variant}-${label}`}>
						<Button variant={variant as any} isDisabled={disabled} isLoading={loading}>
							{label}
						</Button>

						<span className="token-label">{colorVariable}</span>

						<Button variant="copy" onClick={() => handleCopy(variant, disabled, loading)}>
							<CopySimple size={24} /> {t('copy')}
						</Button>
					</div>
				))}
			</div>
		</section>
	);
}
