'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';

type HeaderLogoProps = {
	logoSrc: string;
	logoAlt: string;
	homeAriaLabel: string;
	linkClassName: string;
	imageClassName: string;
	isAboveFold?: boolean;
	onClick?: () => void;
};

export default function HeaderLogo({
	logoSrc,
	logoAlt,
	homeAriaLabel,
	linkClassName,
	imageClassName,
	isAboveFold = false,
	onClick
}: HeaderLogoProps) {
	const lcpImageProps = isAboveFold ? { loading: 'eager' as const, fetchPriority: 'high' as const } : {};

	return (
		<Link href="/" className={linkClassName} onClick={onClick} aria-label={homeAriaLabel}>
			<Image
				src={logoSrc}
				alt={logoAlt}
				width={512}
				height={120}
				{...lcpImageProps}
				unoptimized
				className={imageClassName}
			/>
		</Link>
	);
}
