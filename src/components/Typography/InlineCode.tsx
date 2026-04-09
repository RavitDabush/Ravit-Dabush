'use client';

import { highlightCode, SupportedLanguage } from '@/utils/highlightCode';

type InlineCodeProps = {
	children: React.ReactNode;
	language?: SupportedLanguage;
	className?: string;
};

/**
 * InlineCode component
 * Renders inline code snippets with automatic syntax highlighting
 * using highlight.js and returns HTML with semantic <span> elements
 * that match SCSS classes like `.keyword`, `.function`, etc.
 *
 * The returned markup is inserted via dangerouslySetInnerHTML,
 * and class names are cleaned inside highlightCode().
 */
export default function InlineCode({ children, language = 'javascript', className = '' }: InlineCodeProps) {
	const highlighted = highlightCode(typeof children === 'string' ? children : String(children), language);

	return <code lang="en" className={className} dangerouslySetInnerHTML={{ __html: highlighted }} />;
}
