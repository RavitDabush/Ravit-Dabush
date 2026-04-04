import React from 'react';
import '@/styles/media/media-skeleton.scss';

export type MediaSkeletonProps = {
	variant?: 'overlay' | 'block';
	className?: string;
	style?: React.CSSProperties;
};

export const MediaSkeleton: React.FC<MediaSkeletonProps> = ({ variant = 'overlay', className, style }) => {
	return <div aria-hidden className={`media-skeleton ${variant} ${className ?? ''}`} style={style} />;
};
