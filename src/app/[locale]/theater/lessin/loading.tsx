import PageLayout from '@/components/PageLayout';

export default function LessinTheaterLoadingPage() {
	return (
		<PageLayout>
			<div className="theater-loading-grid" aria-label="Loading Beit Lessin performances">
				<div className="theater-loading-card" />
				<div className="theater-loading-card" />
				<div className="theater-loading-card" />
			</div>
		</PageLayout>
	);
}
