import { readFile, writeFile } from 'fs/promises';
import path from 'path';

async function run() {
	const namesPath = path.resolve('scripts/iconNames.json');
	const outputPath = path.resolve('src/components/IconExplorer/iconList.ts');

	// Read icon names from JSON
	const content = await readFile(namesPath, 'utf-8');
	const iconNames: string[] = JSON.parse(content);

	// Optional limit
	const selected = iconNames;

	// Create import statements
	const iconImports = selected.map(name => `import { ${name} } from '@phosphor-icons/react';`).join('\n');

	// Add types import at the top
	const typeImports = `import { FC } from 'react';\nimport { IconProps } from '@phosphor-icons/react';`;

	// Create the icon list array with correct typing
	const list = `export const iconList = [
${selected.map(name => `	['${name}', ${name}]`).join(',\n')}
] satisfies [string, FC<IconProps>][];\n`;

	// Write to file
	await writeFile(outputPath, `${typeImports}\n\n${iconImports}\n\n${list}`, 'utf-8');

	console.log(`✅ iconList.ts generated with ${selected.length} icons.`);
}

void run();
