import Card from '@/components/Card/Card';

type Props = {
	ariaLabel: string;
};

function PerformanceCardSkeleton({ alternate = false }: { alternate?: boolean }) {
	return (
		<Card className="theater-loading-card theater-loading-card--structured" aria-hidden="true">
			<div className="theater-loading-card__content">
				<div className="theater-loading-card__header">
					<span
						className={`theater-loading-line theater-loading-line--title${alternate ? ' theater-loading-line--title-alt' : ''}`}
					/>
					<span className="theater-loading-line theater-loading-line--meta" />
				</div>

				<div className="theater-loading-card__details">
					<span className="theater-loading-line theater-loading-line--detail" />
					<span className="theater-loading-line theater-loading-line--detail theater-loading-line--detail-short" />

					<div className="theater-loading-pills">
						<span className="theater-loading-pill theater-loading-pill--short" />
						<span className="theater-loading-pill theater-loading-pill--medium" />
						{alternate ? null : <span className="theater-loading-pill theater-loading-pill--long" />}
					</div>
				</div>
			</div>

			<div className="theater-loading-card__actions">
				<span className="theater-loading-button" />
			</div>
		</Card>
	);
}

function PerformanceGroupSkeleton({
	titleWidth = 'medium',
	cardCount = 2
}: {
	titleWidth?: 'short' | 'medium' | 'long';
	cardCount?: number;
}) {
	return (
		<section className="theater-loading-group" aria-hidden="true">
			<span
				className={`theater-loading-line theater-loading-line--group-title theater-loading-line--group-title-${titleWidth}`}
			/>

			<div className="theater-loading-grid">
				{Array.from({ length: cardCount }, (_, index) => (
					<PerformanceCardSkeleton key={index} alternate={index % 2 === 1} />
				))}
			</div>
		</section>
	);
}

function TheaterLoadingStatusSkeleton() {
	return (
		<div className="theater-loading-status" aria-hidden="true">
			<div className="theater-loading-status__step">
				<span className="theater-loading-status__dot" />
				<span className="theater-loading-line theater-loading-line--status theater-loading-line--status-long" />
			</div>

			<div className="theater-loading-status__step">
				<span className="theater-loading-status__dot" />
				<span className="theater-loading-line theater-loading-line--status theater-loading-line--status-medium" />
			</div>

			<div className="theater-loading-status__step">
				<span className="theater-loading-status__dot" />
				<span className="theater-loading-line theater-loading-line--status theater-loading-line--status-short" />
			</div>
		</div>
	);
}

export default function PerformanceListSkeleton({ ariaLabel }: Props) {
	return (
		<div className="theater-loading-shell" aria-label={ariaLabel} role="status">
			<section className="theater-page-intro theater-loading-shell__intro" aria-hidden="true">
				<span className="theater-loading-line theater-loading-line--page-title" />
				<span className="theater-loading-line theater-loading-line--page-copy" />
				<span className="theater-loading-line theater-loading-line--page-copy theater-loading-line--page-copy-short" />
			</section>

			<div className="theater-browser theater-loading-shell__browser" aria-hidden="true">
				<div className="theater-loading-shell__filter">
					<span className="theater-loading-line theater-loading-line--filter-label" />
					<span className="theater-loading-input" />
				</div>

				<TheaterLoadingStatusSkeleton />

				<div className="theater-performance-list theater-loading-shell__list">
					<PerformanceGroupSkeleton titleWidth="long" cardCount={2} />
					<PerformanceGroupSkeleton titleWidth="medium" cardCount={1} />
				</div>
			</div>
		</div>
	);
}
