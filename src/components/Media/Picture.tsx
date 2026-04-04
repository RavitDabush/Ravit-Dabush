'use client';

import React from 'react';
import { MediaSkeleton } from './MediaSkeleton';
import '@/styles/media/media-ratio.scss';
import '@/styles/media/media-image.scss';

export type PictureSource = {
	srcSet: string;
	type?: string;
	media?: string;
	sizes?: string;
};

export type PictureProps = {
	sources: PictureSource[];
	fallbackSrc: string;
	alt: string;
	decorative?: boolean;
	ratio?: `${number}/${number}` | number;
	width?: number | string;
	height?: number | string;
	sizes?: string;
	loading?: 'eager' | 'lazy';
	decoding?: 'sync' | 'async' | 'auto';
	fetchPriority?: 'high' | 'low' | 'auto';
	className?: string;
	wrapperClassName?: string;
	wrapperStyle?: React.CSSProperties;
	skeleton?: boolean;
};

export default function Picture(props: PictureProps) {
	const {
		sources,
		fallbackSrc,
		alt,
		decorative,
		ratio,
		width,
		height,
		sizes,
		loading = 'lazy',
		decoding = 'async',
		fetchPriority = 'auto',
		className,
		wrapperClassName,
		wrapperStyle,
		skeleton = true
	} = props;

	const ariaProps = decorative ? { 'aria-hidden': true } : {};
	const altText = decorative ? '' : alt;

	const [errored, setErrored] = React.useState(false);
	const [loaded, setLoaded] = React.useState(false);

	const showOverlay = skeleton && (!loaded || errored);

	// Wrapper classes
	const wrapperClasses = ['media'];
	if (ratio) {
		if (typeof ratio === 'string' && /^\d+\/\d+$/.test(ratio)) {
			wrapperClasses.push(`media--ar-${ratio.replace('/', '-')}`);
		} else {
			wrapperClasses.push('media--ar-var');
		}
	} else {
		wrapperClasses.push('media-sized'); // אחיד עם Image
	}
	if (wrapperClassName) wrapperClasses.push(wrapperClassName);

	const imgClasses = ['media-img', errored ? 'media-img--hidden' : '', className ?? ''].filter(Boolean).join(' ');

	return (
		<div className={wrapperClasses.join(' ')} style={wrapperStyle}>
			<picture>
				{sources.map((s, i) => (
					<source key={i} srcSet={s.srcSet} type={s.type} media={s.media} sizes={s.sizes} />
				))}
				<img
					src={fallbackSrc}
					alt={altText}
					{...ariaProps}
					loading={loading}
					decoding={decoding}
					fetchPriority={fetchPriority}
					sizes={sizes}
					className={imgClasses}
					width={width as any}
					height={height as any}
					onLoad={() => setLoaded(true)}
					onError={() => setErrored(true)}
				/>
			</picture>
			{showOverlay && <MediaSkeleton variant="overlay" />}
		</div>
	);
}
