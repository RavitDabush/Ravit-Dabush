import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(', ');

export function useModalFocus(isOpen: boolean, onClose: () => void) {
	const containerRef = useRef<HTMLDivElement>(null);
	// Remember which element had focus before the modal opened
	const previousFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!isOpen) return;

		// Save current focus and move it into the modal
		previousFocusRef.current = document.activeElement as HTMLElement;
		const focusable = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
		focusable?.[0]?.focus();

		// Lock body scroll
		document.body.style.overflow = 'hidden';

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				onClose();
				return;
			}

			if (e.key !== 'Tab') return;

			const elements = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
			if (!elements || elements.length === 0) return;

			const first = elements[0];
			const last = elements[elements.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = '';
			// Restore focus to the element that opened the modal
			previousFocusRef.current?.focus();
		};
	}, [isOpen, onClose]);

	return containerRef;
}
