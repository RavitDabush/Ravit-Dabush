'use client';

import { useState } from 'react';
import { highlightCode, SupportedLanguage } from '@/utils/highlightCode';
import Button from '@/components/Button/Button';

type BlockCodeProps = {
	children: string;
	language?: SupportedLanguage;
	className?: string;
};

export default function BlockCode({ children, language = 'javascript', className = '' }: BlockCodeProps) {
	const [copied, setCopied] = useState(false);
	const highlighted = highlightCode(children, language);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(children);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className={`block-code-container ${className}`}>
			<div className="block-code-header">
				<span className="block-code-language">{language}</span>
				<Button variant="copy" onClick={handleCopy} ariaLabel="Copy code to clipboard" title="Copy code">
					{copied ? 'Copied!' : 'Copy'}
				</Button>
			</div>

			<pre tabIndex={0}>
				<code dangerouslySetInnerHTML={{ __html: highlighted }} lang="en" />
			</pre>
		</div>
	);
}
