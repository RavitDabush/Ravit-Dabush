import Card from '@/components/Card/Card';
import { Heading4, LinkButton, ParagraphSmall, SmallText } from '@/components/Typography';

type SourceConfidence = 'high' | 'medium' | 'low';

type Performance = {
	id: string;
	showName: string;
	date: string;
	time: string;
	venue?: string;
	purchaseUrl?: string;
	availableInPreferredRows: boolean;
	matchedRows: string[];
	matchedSections?: string[];
	availableSeatCount?: number;
	sourceStatus?: string;
	sourceConfidence: SourceConfidence;
};

type PerformanceCardLabels = {
	time: string;
	venue: string;
	rows: string;
	seats: string;
	confidence: string;
	purchase: string;
	confidenceValues: Record<SourceConfidence, string>;
};

type Props = {
	performance: Performance;
	labels: PerformanceCardLabels;
};

export default function PerformanceCard({ performance, labels }: Props) {
	return (
		<Card className="theater-performance-card">
			<div className="theater-performance-card__content">
				<div className="theater-performance-card__header">
					<Heading4>{performance.showName}</Heading4>
					<SmallText className="theater-performance-card__meta">
						{labels.time}: {performance.time}
					</SmallText>
				</div>

				<div className="theater-performance-card__details">
					{performance.venue ? (
						<ParagraphSmall>
							<strong>{labels.venue}:</strong> {performance.venue}
						</ParagraphSmall>
					) : null}

					<ParagraphSmall>
						<strong>{labels.rows}:</strong>{' '}
						{performance.matchedRows.length > 0
							? performance.matchedRows.join(', ')
							: (performance.matchedSections?.join(', ') ?? '')}
					</ParagraphSmall>

					{typeof performance.availableSeatCount === 'number' ? (
						<ParagraphSmall>
							<strong>{labels.seats}:</strong> {performance.availableSeatCount}
						</ParagraphSmall>
					) : null}

					<ParagraphSmall>
						<strong>{labels.confidence}:</strong> {labels.confidenceValues[performance.sourceConfidence]}
					</ParagraphSmall>
				</div>
			</div>

			{performance.purchaseUrl ? (
				<div className="theater-performance-card__actions">
					<LinkButton href={performance.purchaseUrl} buttonType="outline">
						{labels.purchase}
					</LinkButton>
				</div>
			) : null}
		</Card>
	);
}
