'use client';

import { useTranslations } from 'next-intl';
import { TextAa } from '@phosphor-icons/react';
import './Typography.scss';
import TypographyShowcase from './TypographyShowcase';

import './Typography.scss';

export default function Typography() {
	const t = useTranslations('Typography');

	return (
		<section id="typography" className="styleguide-section">
			<h3 className="styleguide-title">
				<TextAa size={28} weight="regular" /> {t('title')}
			</h3>
			<p className="styleguide-description">{t('description')}</p>

			<div className="typography-content">
				<section>
					<h4>Heading</h4>

					<div className="heading-grid">
						<div className="heading-box">
							<h1>This is H1</h1>
						</div>

						<div className="heading-box">
							<h2>This is H2</h2>
						</div>

						<div className="heading-box">
							<h3>This is H3</h3>
						</div>

						<div className="heading-box">
							<h4>This is H4</h4>
						</div>

						<div className="heading-box">
							<h5>This is H5</h5>
						</div>

						<div className="heading-box">
							<h6>This is H6</h6>
						</div>
					</div>
				</section>

				<section>
					<h4>Lists</h4>

					<div className="list-grid">
						<div className="list-box">
							<label>This is unordered list</label>
							<ul>
								<li>Banana</li>
								<li>Apple</li>
								<li>Orange</li>
								<li>Grapes</li>
								<li>Ananas</li>
							</ul>
						</div>

						<div className="list-box">
							<label>This is unordered list with no style</label>
							<ul className="no-style">
								<li>Banana</li>
								<li>Apple</li>
								<li>Orange</li>
								<li>Grapes</li>
								<li>Ananas</li>
							</ul>
						</div>
						<div className="list-box">
							<label>This is ordered list</label>
							<ol>
								<li>Banana</li>
								<li>Apple</li>
								<li>Orange</li>
								<li>Grapes</li>
								<li>Ananas</li>
							</ol>
						</div>

						<div className="list-box">
							<label>This is ordered list with no style</label>
							<ol className="no-style">
								<li>Banana</li>
								<li>Apple</li>
								<li>Orange</li>
								<li>Grapes</li>
								<li>Ananas</li>
							</ol>
						</div>
					</div>
				</section>
			</div>

			<TypographyShowcase />
		</section>
	);
}
