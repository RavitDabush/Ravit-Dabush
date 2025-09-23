'use client';

import { useEffect, useState } from 'react';
import { highlightCode } from '@/utils/highlightCode';

// Define supported language values
type SupportedLanguage =
	| 'javascript'
	| 'typescript'
	| 'html'
	| 'xml'
	| 'css'
	| 'scss'
	| 'json';

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
export default function InlineCode({
	children,
	language = 'javascript',
	className = ''
}: InlineCodeProps) {
	const [highlighted, setHighlighted] = useState<string>('');

	useEffect(() => {
		const codeString =
			typeof children === 'string' ? children : String(children);
		setHighlighted(highlightCode(codeString, language));
	}, [children, language]);

	return (
		<code
			lang="en"
			className={className}
			dangerouslySetInnerHTML={{ __html: highlighted }}
		/>
	);
}
