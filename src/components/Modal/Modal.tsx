'use client';

import { useId } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import Button from '@/components/Button/Button';
import { useModalFocus } from './useModalFocus';

type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	className?: string;
};

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
	const titleId = useId();
	const containerRef = useModalFocus(isOpen, onClose);

	if (!isOpen) return null;

	return createPortal(
		<>
			{/* Backdrop */}
			<div className="modal-overlay" aria-hidden="true" onClick={onClose} />

			{/* Dialog */}
			<div
				ref={containerRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={clsx('modal', className)}
			>
				<div className="modal-header">
					<p id={titleId} className="modal-title">
						{title}
					</p>
					<Button variant="toggle" onClick={onClose} ariaLabel="Close dialog">
						✕
					</Button>
				</div>

				<div className="modal-body">{children}</div>
			</div>
		</>,
		document.body
	);
}
