'use client';

import { useFormStatus } from 'react-dom';
import clsx from 'clsx';
import { getButtonClassNames } from '@/components/Button/ButtonConfig';
import { SmallText } from '@/components/Typography';

type Props = {
	action: () => Promise<void>;
	label: string;
	pendingLabel: string;
	hint?: string;
};

function RefreshSubmitButton({ label, pendingLabel }: Pick<Props, 'label' | 'pendingLabel'>) {
	const { pending } = useFormStatus();

	return (
		<button
			type="submit"
			className={clsx(getButtonClassNames('outline'), 'theater-refresh-cache__button')}
			disabled={pending}
			aria-disabled={pending}
			aria-busy={pending}
		>
			{pending ? pendingLabel : label}
		</button>
	);
}

export default function RefreshTheaterCacheForm({ action, label, pendingLabel, hint }: Props) {
	return (
		<form action={action} className="theater-refresh-cache">
			<RefreshSubmitButton label={label} pendingLabel={pendingLabel} />
			{hint ? <SmallText className="theater-refresh-cache__hint">{hint}</SmallText> : null}
		</form>
	);
}
