import Card from '@/components/Card/Card';
import { Heading4, LinkButton, ParagraphSmall, SmallText } from '@/components/Typography';
import { TheaterAvailabilityType, TheaterNormalizedPerformance, TheaterSourceConfidence } from '@/lib/theater/types';
import { formatPerformanceDate } from './formatPerformanceDate';

type PerformanceCardLabels = {
	date?: string;
	time: string;
	venue: string;
	theater?: string;
	saleStart?: string;
	sections: string;
	rows: string;
	availability?: string;
	seats: string;
	confidence: string;
	status: string;
	notAvailable: string;
	purchase: string;
	availabilityValues?: Partial<Record<TheaterAvailabilityType, string>>;
	confidenceValues: Record<TheaterSourceConfidence, string>;
};

type Props = {
	performance: TheaterNormalizedPerformance;
	labels: PerformanceCardLabels;
	theaterName?: string;
	hideAvailabilityDetails?: boolean;
};

export default function PerformanceCard({ performance, labels, theaterName, hideAvailabilityDetails = false }: Props) {
	const matchedRows = performance.matchedRowDisplayLabels?.length
		? performance.matchedRowDisplayLabels
		: performance.matchedRows;
	const matchedSections = performance.matchedSections;
	const availabilityValue = performance.availabilityType
		? (labels.availabilityValues?.[performance.availabilityType] ?? performance.availabilityType)
		: null;
	const ticketSaleStart = performance.saleLifecycle?.ticketSaleStart;

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
					{labels.date ? (
						<ParagraphSmall>
							<strong>{labels.date}:</strong> {formatPerformanceDate(performance.date)}
						</ParagraphSmall>
					) : null}

					{performance.venue ? (
						<ParagraphSmall>
							<strong>{labels.venue}:</strong> {performance.venue}
						</ParagraphSmall>
					) : null}

					{theaterName && labels.theater ? (
						<ParagraphSmall>
							<strong>{labels.theater}:</strong> {theaterName}
						</ParagraphSmall>
					) : null}

					{ticketSaleStart && labels.saleStart ? (
						<ParagraphSmall>
							<strong>{labels.saleStart}:</strong> {ticketSaleStart}
						</ParagraphSmall>
					) : null}

					{hideAvailabilityDetails ? null : (
						<>
							<ParagraphSmall>
								<strong>{labels.sections}:</strong>{' '}
								{matchedSections.length > 0 ? matchedSections.join(', ') : labels.notAvailable}
							</ParagraphSmall>

							<ParagraphSmall>
								<strong>{labels.rows}:</strong> {matchedRows.length > 0 ? matchedRows.join(', ') : labels.notAvailable}
							</ParagraphSmall>

							{availabilityValue && labels.availability ? (
								<ParagraphSmall className="visually-hidden">
									<strong>{labels.availability}:</strong> {availabilityValue}
								</ParagraphSmall>
							) : null}

							<ParagraphSmall>
								<strong>{labels.seats}:</strong>{' '}
								{typeof performance.availableSeatCount === 'number' ? performance.availableSeatCount : labels.notAvailable}
							</ParagraphSmall>

							<ParagraphSmall className="visually-hidden">
								<strong>{labels.confidence}:</strong> {labels.confidenceValues[performance.sourceConfidence]}
							</ParagraphSmall>

							<ParagraphSmall className="visually-hidden">
								<strong>{labels.status}:</strong> {performance.sourceStatus || labels.notAvailable}
							</ParagraphSmall>
						</>
					)}
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
