import PageLayout from '@/components/PageLayout';

export default function TheaterLoadingPage() {
	return (
		<PageLayout>
			<div className="theater-loading-grid" aria-label="Loading theater performances">
				<div className="theater-loading-card" />
				<div className="theater-loading-card" />
				<div className="theater-loading-card" />
			</div>
		</PageLayout>
	);
}
