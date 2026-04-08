import { useTranslations } from 'next-intl';

import PageLayout from '@/components/PageLayout';
import FadeIn from '@/components/Motion/FadeIn';
import {
	FancyTitle,
	Heading3,
	Heading4,
	LinkButton,
	MutedText,
	Paragraph,
	ParagraphSmall
} from '@/components/Typography';
export default function JourneyPage() {
	const t = useTranslations('journeyPage');

	const timelineItems = [
		{
			period: t('timeline.items.early.period'),
			title: t('timeline.items.early.title'),
			text: t('timeline.items.early.text')
		},
		{
			period: t('timeline.items.academia.period'),
			title: t('timeline.items.academia.title'),
			text: t('timeline.items.academia.text')
		},
		{
			period: t('timeline.items.ecommerce.period'),
			title: t('timeline.items.ecommerce.title'),
			text: t('timeline.items.ecommerce.text')
		},
		{
			period: t('timeline.items.smallTeams.period'),
			title: t('timeline.items.smallTeams.title'),
			text: t('timeline.items.smallTeams.text')
		},
		{
			period: t('timeline.items.today.period'),
			title: t('timeline.items.today.title'),
			text: t('timeline.items.today.text')
		}
	];

	const principles = [
		{
			title: t('mindset.items.clarity.title'),
			text: t('mindset.items.clarity.text')
		},
		{
			title: t('mindset.items.craft.title'),
			text: t('mindset.items.craft.text')
		},
		{
			title: t('mindset.items.ownership.title'),
			text: t('mindset.items.ownership.text')
		},
		{
			title: t('mindset.items.experience.title'),
			text: t('mindset.items.experience.text')
		}
	];

	const ctaLinks = [
		{
			label: t('cta.links.projects'),
			href: '/projects'
		},
		{
			label: t('cta.links.styleGuide'),
			href: '/style-guide'
		},
		{
			label: t('cta.links.contact'),
			href: '/contact'
		}
	];

	return (
		<PageLayout>
			<main className="journey-page">
				<section className="journey-hero">
					<FadeIn className="journey-hero-content" distance={32}>
						<p className="journey-hero-eyebrow">{t('hero.eyebrow')}</p>

						<FancyTitle className="journey-hero-title">{t('hero.title')}</FancyTitle>

						<Paragraph className="journey-hero-subtitle">{t('hero.subtitle')}</Paragraph>

						<Paragraph className="journey-hero-intro">{t('hero.intro')}</Paragraph>
					</FadeIn>

					<FadeIn className="journey-hero-visual" aria-hidden="true" delay={0.15} distance={40}>
						<div className="journey-hero-shape journey-hero-shape--primary" />
						<div className="journey-hero-shape journey-hero-shape--secondary" />
						<div className="journey-hero-badge">Frontend</div>
					</FadeIn>
				</section>

				<section className="journey-section journey-section--origin">
					<FadeIn className="journey-section-heading" distance={24}>
						<span className="journey-section-index">01</span>
						<Heading3>{t('origin.heading')}</Heading3>
					</FadeIn>

					<FadeIn className="journey-section-content" delay={0.05} distance={24}>
						<Paragraph>{t('origin.text')}</Paragraph>

						<div className="journey-pills" aria-label={t('origin.pillsAriaLabel')}>
							<FadeIn className="journey-pill" as="div" delay={0}>
								{t('origin.pills.experiment')}
							</FadeIn>
							<FadeIn className="journey-pill" as="div" delay={0.05}>
								{t('origin.pills.learning')}
							</FadeIn>
							<FadeIn className="journey-pill" as="div" delay={0.1}>
								{t('origin.pills.precision')}
							</FadeIn>
						</div>
					</FadeIn>
				</section>

				<section className="journey-section journey-section--craft">
					<FadeIn className="journey-section-heading" distance={24}>
						<span className="journey-section-index">02</span>
						<Heading3>{t('craft.heading')}</Heading3>
					</FadeIn>

					<FadeIn className="journey-section-content" delay={0.05} distance={24}>
						<Paragraph>{t('craft.text')}</Paragraph>

						<div className="journey-grid" aria-label={t('craft.cardsAriaLabel')}>
							<FadeIn className="journey-card" as="article" delay={0}>
								<span className="journey-card-label">01</span>
								<Heading4 className="journey-card-title">{t('craft.cards.typography.title')}</Heading4>

								<ParagraphSmall className="journey-card-text">{t('craft.cards.typography.text')}</ParagraphSmall>
							</FadeIn>

							<FadeIn className="journey-card" as="article" delay={0.08}>
								<span className="journey-card-label">02</span>
								<Heading4 className="journey-card-title">{t('craft.cards.color.title')}</Heading4>
								<ParagraphSmall className="journey-card-text">{t('craft.cards.color.text')}</ParagraphSmall>
							</FadeIn>

							<FadeIn className="journey-card" as="article" delay={0.16}>
								<span className="journey-card-label">03</span>
								<Heading4 className="journey-card-title">{t('craft.cards.structure.title')}</Heading4>
								<ParagraphSmall className="journey-card-text">{t('craft.cards.structure.text')}</ParagraphSmall>
							</FadeIn>
						</div>
					</FadeIn>
				</section>

				<section className="journey-section journey-section--timeline">
					<FadeIn className="journey-section-heading" distance={24}>
						<span className="journey-section-index">03</span>
						<Heading3>{t('timeline.heading')}</Heading3>
					</FadeIn>

					<FadeIn className="journey-section-content" delay={0.05} distance={24}>
						<Paragraph>{t('timeline.intro')}</Paragraph>

						<div className="journey-timeline" aria-label={t('timeline.ariaLabel')}>
							{timelineItems.map((item, index) => (
								<FadeIn key={item.title} className="journey-timeline-item" as="article" delay={index * 0.06} distance={28}>
									<div className="journey-timeline-marker" aria-hidden="true">
										<span className="journey-timeline-dot" />
									</div>

									<div className="journey-timeline-card">
										<span className="journey-timeline-number">{String(index + 1).padStart(2, '0')}</span>
										<MutedText className="journey-timeline-period">{item.period}</MutedText>
										<Heading4 className="journey-timeline-title">{item.title}</Heading4>
										<ParagraphSmall className="journey-timeline-text">{item.text}</ParagraphSmall>
									</div>
								</FadeIn>
							))}
						</div>
					</FadeIn>
				</section>

				<section className="journey-section journey-section--mindset">
					<FadeIn className="journey-section-heading" distance={24}>
						<span className="journey-section-index">04</span>
						<Heading3>{t('mindset.heading')}</Heading3>
					</FadeIn>

					<FadeIn className="journey-section-content" delay={0.05} distance={24}>
						<Paragraph>{t('mindset.intro')}</Paragraph>

						<div className="journey-grid journey-grid--principles" aria-label={t('mindset.ariaLabel')}>
							{principles.map((item, index) => (
								<FadeIn key={item.title} className="journey-card journey-card--principle" as="article" delay={index * 0.08}>
									<span className="journey-card-label">{String(index + 1).padStart(2, '0')}</span>
									<Heading4 className="journey-card-title">{item.title}</Heading4>
									<ParagraphSmall className="journey-card-text">{item.text}</ParagraphSmall>
								</FadeIn>
							))}
						</div>
					</FadeIn>
				</section>

				<section className="journey-closing">
					<FadeIn className="journey-closing-inner" distance={28}>
						<p className="journey-closing-eyebrow">{t('closing.eyebrow')}</p>
						<Heading3>{t('closing.heading')}</Heading3>
						<Paragraph className="journey-closing-text">{t('closing.text')}</Paragraph>
					</FadeIn>
				</section>

				<section className="journey-cta">
					<FadeIn className="journey-cta-inner" distance={28}>
						<p className="journey-cta-eyebrow">{t('cta.eyebrow')}</p>
						<FancyTitle className="journey-cta-title">{t('cta.title')}</FancyTitle>
						<Paragraph className="journey-cta-text">{t('cta.text')}</Paragraph>

						<div className="journey-cta-links" aria-label={t('cta.linksAriaLabel')}>
							{ctaLinks.map((link, index) => (
								<FadeIn key={link.href} as="div" delay={index * 0.08} className="journey-cta-link-wrap">
									<LinkButton href={link.href} buttonType="light" className="journey-cta-link">
										{link.label}
									</LinkButton>
								</FadeIn>
							))}
						</div>
					</FadeIn>
				</section>
			</main>
		</PageLayout>
	);
}
