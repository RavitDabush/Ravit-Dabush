'use client';

import NextImage, { ImageProps as NextImageProps } from 'next/image';
import React from 'react';
import { MediaSkeleton } from './MediaSkeleton';
import '@/styles/media/media-ratio.scss';
import '@/styles/media/media-image.scss';

type ImageProps = NextImageProps & {
	/** alt is required; use "" for decorative */
	alt: string;
	/** Aspect ratio like "16/9" or number. Enables fill-mode wrapper */
	ratio?: `${number}/${number}` | number;
	/** Show skeleton overlay until load (when not using blur placeholder) */
	skeleton?: boolean;
	/** cover | contain | fill | none | scale-down */
	fit?: React.CSSProperties['objectFit'];
	/** e.g. 'center', 'top', '50% 50%' — we map common ones to classes; others via CSS var */
	position?: React.CSSProperties['objectPosition'];
	wrapperClassName?: string;
};

export default function Image(props: ImageProps) {
	const {
		alt,
		ratio,
		skeleton = true,
		fit = 'cover',
		position = 'center',
		className,
		sizes = '100vw',
		placeholder,
		blurDataURL,
		priority,
		onLoad,
		onError,
		wrapperClassName,
		...rest
	} = props;

	const ariaProps = alt === '' ? { 'aria-hidden': true } : {};
	const [loaded, setLoaded] = React.useState(false);
	const [errored, setErrored] = React.useState(false);

	const usingBlur = placeholder === 'blur' && !!blurDataURL;

	// Keep overlay visible until load succeeds; also on error
	const showOverlay = skeleton && (!loaded || errored) && !usingBlur;

	const handleLoad = (e: unknown) => {
		setLoaded(true);
		onLoad?.(e as any);
	};

	const handleError = (e: unknown) => {
		setErrored(true);
		onError?.(e as any);
	};

	// Wrapper classes
	const wrapperClasses = ['media'];
	if (ratio) {
		if (typeof ratio === 'string' && /^\d+\/\d+$/.test(ratio)) {
			wrapperClasses.push(`media--ar-${ratio.replace('/', '-')}`);
		} else {
			wrapperClasses.push('media--ar-var');
		}
	} else {
		wrapperClasses.push('media-sized');
	}
	if (wrapperClassName) wrapperClasses.push(wrapperClassName);

	// Image classes
	const imgClasses = [
		'media-img',
		`media-img--fit-${fit}`,
		position === 'center' ? 'media-img--pos-center' : 'media-img--pos-var',
		errored ? 'media-img--hidden' : '',
		className ?? ''
	]
		.filter(Boolean)
		.join(' ');

	// If custom position (not “center”), expose the value via CSS var on wrapper
	const wrapperStyle =
		position !== 'center' && typeof position === 'string'
			? ({ ['--rd-pos' as any]: position } as React.CSSProperties)
			: undefined;

	// Ratio (fill) path
	if (ratio) {
		return (
			<div className={wrapperClasses.join(' ')} style={wrapperStyle}>
				<NextImage
					{...rest}
					alt={alt}
					{...ariaProps}
					className={imgClasses}
					fill
					sizes={sizes}
					placeholder={usingBlur ? 'blur' : 'empty'}
					blurDataURL={usingBlur ? blurDataURL : undefined}
					onLoad={handleLoad}
					onError={handleError}
					priority={priority}
				/>
				{showOverlay && <MediaSkeleton variant="overlay" />}
			</div>
		);
	}

	// Intrinsic path
	return (
		<div className={wrapperClasses.join(' ')} style={wrapperStyle}>
			<NextImage
				{...rest}
				alt={alt}
				{...ariaProps}
				className={imgClasses}
				sizes={sizes}
				placeholder={usingBlur ? 'blur' : 'empty'}
				blurDataURL={usingBlur ? blurDataURL : undefined}
				onLoad={handleLoad}
				onError={handleError}
				priority={priority}
			/>
			{showOverlay && <MediaSkeleton variant="overlay" />}
		</div>
	);
}
