import PageLayout from '@/components/PageLayout';

import '../style.scss';

export default function HabimaTheaterLoadingPage() {
	return (
		<PageLayout>
			<div className="theater-loading-grid" aria-label="Loading Habima performances">
				<div className="theater-loading-card" />
				<div className="theater-loading-card" />
				<div className="theater-loading-card" />
			</div>
		</PageLayout>
	);
}
