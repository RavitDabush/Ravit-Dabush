import Card from '@/components/Card/Card';

type Props = {
	ariaLabel: string;
	cardCount?: number;
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
						<span className="theater-loading-pill theater-loading-pill--long" />
					</div>
				</div>
			</div>

			<div className="theater-loading-card__actions">
				<span className="theater-loading-button" />
			</div>
		</Card>
	);
}

export default function PerformanceListSkeleton({ ariaLabel, cardCount = 3 }: Props) {
	return (
		<div className="theater-loading-grid" aria-label={ariaLabel} role="status">
			{Array.from({ length: cardCount }, (_, index) => (
				<PerformanceCardSkeleton key={index} alternate={index % 2 === 1} />
			))}
		</div>
	);
}
