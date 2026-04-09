import clsx from 'clsx';
import { AlertProps, getAlertClassNames } from './AlertConfig';

export default function Alert({ variant = 'info', title, children, className }: AlertProps) {
	return (
		<div role="alert" className={clsx(getAlertClassNames(variant), className)}>
			{title && <p className="alert-title">{title}</p>}
			<div className="alert-body">{children}</div>
		</div>
	);
}
