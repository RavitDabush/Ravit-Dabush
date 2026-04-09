import { useTranslations } from 'next-intl';
import PageLayout from '@/components/PageLayout';
import { FancyTitle, Heading3, Paragraph, Highlight } from '@/components/Typography';
import { Image } from '@/components/Media';

export default function AboutPage() {
	const t = useTranslations('aboutPage');

	return (
		<PageLayout>
			<section className="intro-section">
				<div className="text-content">
					<FancyTitle>{t('title')}</FancyTitle>
					<Paragraph>
						{t.rich('subtitle', {
							hl: chunks => <Highlight>{chunks}</Highlight>
						})}
					</Paragraph>
					<Paragraph>{t('sections.howItStarted.text')}</Paragraph>
				</div>

				<div className="image-wrapper">
					<Image
						src="/images/Ravit-Dabush.png"
						alt="Portrait of Ravit Dabush"
						width={280}
						height={280}
						className="profile-image"
						fetchPriority="high"
						skeleton
					/>
				</div>
			</section>

			<section>
				<Heading3>{t('sections.journey.heading')}</Heading3>
				<Paragraph>{t('sections.journey.text')}</Paragraph>
			</section>

			<section>
				<Heading3>{t('sections.drivesMe.heading')}</Heading3>
				<Paragraph>{t('sections.drivesMe.text')}</Paragraph>
			</section>

			<section>
				<Heading3>{t('sections.inspiration.heading')}</Heading3>
				<Paragraph>{t('sections.inspiration.text')}</Paragraph>
			</section>

			<section>
				<Heading3>{t('sections.goal.heading')}</Heading3>
				<Paragraph>{t('sections.goal.text')}</Paragraph>
			</section>
		</PageLayout>
	);
}
