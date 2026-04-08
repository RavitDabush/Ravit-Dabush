'use client';

import { motion, type MotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import clsx from 'clsx';

type FadeInProps = MotionProps & {
	children: ReactNode;
	className?: string;
	as?: 'div' | 'section' | 'article';
	delay?: number;
	distance?: number;
};

export default function FadeIn({ children, className, as = 'div', delay = 0, distance = 24, ...rest }: FadeInProps) {
	const MotionTag = as === 'section' ? motion.section : as === 'article' ? motion.article : motion.div;

	return (
		<MotionTag
			className={clsx(className)}
			initial={{ opacity: 0, y: distance }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{
				duration: 0.6,
				ease: [0.22, 1, 0.36, 1],
				delay
			}}
			{...rest}
		>
			{children}
		</MotionTag>
	);
}
