'use client';

import dynamic from 'next/dynamic';

const IconExplorer = dynamic(() => import('@/views/IconExplorerPage'), {
	ssr: false
});

export default function Page() {
	return <IconExplorer />;
}
