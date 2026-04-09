import { readFile, writeFile } from 'fs/promises';
import path from 'path';

async function run() {
	const basePath = path.resolve('src/styles/base.scss');
	const outputPath = path.resolve('src/components/IconExplorer/textColors.ts');

	const scss = await readFile(basePath, 'utf-8');
	const regex = /--color-text-[\w-]+/g;
	const matches = scss.match(regex);

	const unique = [...new Set(matches ?? [])];

	const colorList = unique.map(variable => {
		const name = variable.replace('--color-text-', '');
		const label = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
		return `\t{ label: '${label}', value: 'var(${variable})' }`;
	});

	const ts = `// Auto-generated from base.scss\n\nexport const textColors = [\n${colorList.join(',\n')}\n] as const;\n`;

	await writeFile(outputPath, ts, 'utf-8');
	console.log(`✅ textColors.ts created with ${colorList.length} colors.`);
}

void run();
