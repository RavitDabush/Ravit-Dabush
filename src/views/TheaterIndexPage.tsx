import PageLayout from '@/components/PageLayout';
import Card from '@/components/Card/Card';
import { FancyTitle, LinkButton, Paragraph } from '@/components/Typography';
import { useTranslations } from 'next-intl';

export default function TheaterIndexPage() {
	const t = useTranslations('theaterIndexPage');

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

				<Card className="theater-hub-card">
					<FancyTitle>{t('links.cameri.title')}</FancyTitle>
					<Paragraph>{t('links.cameri.description')}</Paragraph>
					<LinkButton href="/theater/cameri" buttonType="outline">
						{t('links.cameri.cta')}
					</LinkButton>
				</Card>
			</div>
		</PageLayout>
	);
}
