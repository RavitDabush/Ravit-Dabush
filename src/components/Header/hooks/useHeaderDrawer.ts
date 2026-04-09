'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const desktopMediaQuery = '(min-width: 1024px)';

const focusableSelector = [
	'a[href]',
	'button:not([disabled])',
	'textarea:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

export default function useHeaderDrawer() {
	const [isOpen, setIsOpen] = useState(false);

	const menuToggleButtonRef = useRef<HTMLButtonElement | null>(null);
	const drawerCloseButtonRef = useRef<HTMLButtonElement | null>(null);
	const drawerRef = useRef<HTMLElement | null>(null);
	const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

	const closeDrawer = useCallback(() => {
		setIsOpen(false);
	}, []);

	const openDrawer = useCallback(() => {
		setIsOpen(true);
	}, []);

	const toggleDrawer = useCallback(() => {
		setIsOpen(prev => !prev);
	}, []);

	useEffect(() => {
		document.body.style.overflow = isOpen ? 'hidden' : '';

		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	useEffect(() => {
		const mediaQuery = window.matchMedia(desktopMediaQuery);

		const handleDesktopChange = (event: MediaQueryListEvent) => {
			if (event.matches) {
				closeDrawer();
			}
		};

		mediaQuery.addEventListener('change', handleDesktopChange);

		return () => {
			mediaQuery.removeEventListener('change', handleDesktopChange);
		};
	}, [closeDrawer]);

	useEffect(() => {
		if (isOpen) {
			previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
			drawerCloseButtonRef.current?.focus();

			return;
		}

		if (previouslyFocusedElementRef.current) {
			previouslyFocusedElementRef.current.focus();
			previouslyFocusedElementRef.current = null;

			return;
		}

		menuToggleButtonRef.current?.focus();
	}, [closeDrawer, isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				closeDrawer();

				return;
			}

			if (event.key !== 'Tab') {
				return;
			}

			const drawerElement = drawerRef.current;

			if (!drawerElement) {
				return;
			}

			const focusableElements = Array.from(drawerElement.querySelectorAll<HTMLElement>(focusableSelector)).filter(
				element => {
					return !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true';
				}
			);

			if (focusableElements.length === 0) {
				event.preventDefault();
				drawerElement.focus();

				return;
			}

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];
			const activeElement = document.activeElement as HTMLElement | null;

			if (event.shiftKey) {
				if (activeElement === firstElement || !drawerElement.contains(activeElement)) {
					event.preventDefault();
					lastElement.focus();
				}

				return;
			}

			if (activeElement === lastElement || !drawerElement.contains(activeElement)) {
				event.preventDefault();
				firstElement.focus();
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [closeDrawer, isOpen]);

	return {
		isOpen,
		openDrawer,
		closeDrawer,
		toggleDrawer,
		menuToggleButtonRef,
		drawerCloseButtonRef,
		drawerRef
	};
}
