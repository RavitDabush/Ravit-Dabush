'use client';

import { useSyncExternalStore } from 'react';
import { SmallText } from '@/components/Typography';

type Props = {
	collectedAt?: string;
	label: string;
};

const emptySubscribe = () => () => {};

function formatCollectedAt(collectedAt?: string) {
	if (!collectedAt) {
		return undefined;
	}

	const date = new Date(collectedAt);

	if (Number.isNaN(date.getTime())) {
		return undefined;
	}

	return date.toLocaleString();
}

export default function LastUpdated({ collectedAt, label }: Props) {
	const formattedCollectedAt = useSyncExternalStore(
		emptySubscribe,
		() => formatCollectedAt(collectedAt),
		() => undefined
	);

	if (!formattedCollectedAt) {
		return null;
	}

	return (
		<SmallText className="theater-last-updated">
			{label}: <time dateTime={collectedAt}>{formattedCollectedAt}</time>
		</SmallText>
	);
}
