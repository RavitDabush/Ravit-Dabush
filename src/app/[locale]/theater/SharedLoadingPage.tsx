import PageLayout from '@/components/PageLayout';
import PerformanceListSkeleton from '@/components/theater/PerformanceListSkeleton';

import './style.scss';

type Props = {
	ariaLabel: string;
};

export default function SharedTheaterLoadingPage({ ariaLabel }: Props) {
	return (
		<PageLayout>
			<PerformanceListSkeleton ariaLabel={ariaLabel} />
		</PageLayout>
	);
}
