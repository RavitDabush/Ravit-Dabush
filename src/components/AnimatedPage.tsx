'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function AnimatedPage({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	console.log('Animating:', pathname);

	return (
		<motion.div
			key={pathname}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className="animation-wrap"
		>
			{children}
		</motion.div>
	);
}
