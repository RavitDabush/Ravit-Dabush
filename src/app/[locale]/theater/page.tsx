import type { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageLayout from '@/components/PageLayout';
import Card from '@/components/Card/Card';
import { FancyTitle, LinkButton, Paragraph } from '@/components/Typography';
import { createPageMetadata } from '@/lib/metadata';

import './style.scss';

type Props = {
	params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	return createPageMetadata(locale, 'theaterIndexPage');
}

export default async function LocaleTheaterIndexPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: 'theaterIndexPage' });

	return (
		<PageLayout>
			<section className="theater-page-intro">
				<FancyTitle>{t('title')}</FancyTitle>
				<Paragraph>{t('description')}</Paragraph>
			</section>

			<div className="theater-hub-grid">
				<Card className="theater-hub-card">
					<FancyTitle>{t('links.lessin.title')}</FancyTitle>
					<Paragraph>{t('links.lessin.description')}</Paragraph>
					<LinkButton href="/theater/lessin" buttonType="outline">
						{t('links.lessin.cta')}
					</LinkButton>
				</Card>

				<Card className="theater-hub-card">
					<FancyTitle>{t('links.habima.title')}</FancyTitle>
					<Paragraph>{t('links.habima.description')}</Paragraph>
					<LinkButton href="/theater/habima" buttonType="outline">
						{t('links.habima.cta')}
					</LinkButton>
				</Card>
			</div>
		</PageLayout>
	);
}
