import { useTranslations } from 'next-intl';
import PageLayout from '@/components/PageLayout';
import { Heading2, Paragraph, LinkButton } from '@/components/Typography';

export default function HomePage() {
	const t = useTranslations('homePage');

	return (
		<PageLayout>
			<Heading2>{t('title')}</Heading2>
			<Paragraph>{t('description')}</Paragraph>
			<LinkButton href="#">{t('button')}</LinkButton>
		</PageLayout>
	);
}
