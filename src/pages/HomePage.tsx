import { useTranslations } from 'next-intl';
import PageLayout from '@/components/PageLayout';

export default function HomePage() {
	const t = useTranslations('HomePage');

	return (
		<PageLayout>
			<h2>{t('title')}</h2>
			<p>{t('description')}</p>
			<button>{t('button')}</button>
		</PageLayout>
	);
}
