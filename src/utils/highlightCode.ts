import hljs from 'highlight.js/lib/core';

// Import supported languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml'; // Used also for 'html'
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import json from 'highlight.js/lib/languages/json';

// Register languages with highlight.js
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('html', xml); // HTML uses the XML parser
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('json', json);

export function highlightCode(code: string, language: string = 'javascript') {
	// Highlight the code using highlight.js
	let html = hljs.highlight(code, { language }).value;

	// Post-process to clean and normalize class names
	html = html
		.replace(/hljs-/g, '')
		.replace(/\bfunction_\b/g, 'function')
		.replace(/\btitle\b/g, '')
		.replace(/class="(.*?)"/g, (_, classes) => {
			const clean = classes
				.split(' ')
				.map((cls: string) => cls.trim())
				.filter(Boolean)
				.join(' ');
			return `class="${clean}"`;
		});

	return html;
}
