import fs from 'fs';
import path from 'path';

// Paths
const scssFilePath = path.join(__dirname, '../src/styles/base.scss');
const outputPath = path.join(__dirname, '../src/components/Colors/colorsList.ts');

// Read SCSS
const scssContent = fs.readFileSync(scssFilePath, 'utf-8');
const lines = scssContent.split('\n');

// Variables
let currentCategory = 'General';
const colorsList: { title: string; colors: { name: string; colorVariable: string }[] }[] = [];

for (const line of lines) {
	const trimmedLine = line.trim();

	// Ignore irrelevant lines
	if (trimmedLine === '' || trimmedLine.startsWith(':root') || trimmedLine === '}' || trimmedLine.startsWith('@')) {
		continue;
	}

	// Detect category headers
	if (trimmedLine.startsWith('//')) {
		const rawCategoryName = trimmedLine.replace('//', '').trim();
		const normalizedCategoryName = rawCategoryName.replace(/\s+/g, '-'); // Replace spaces with dashes
		currentCategory = normalizedCategoryName;
		continue;
	}

	// Detect color variables only
	const colorMatch = trimmedLine.match(/(--color-[\w-]+)\s*:/);
	if (colorMatch) {
		const variableName = colorMatch[1];
		const humanReadableName = variableName
			.replace('--color-', '')
			.replace(/-/g, ' ')
			.replace(/\b\w/g, char => char.toUpperCase());

		// Find or create the category
		let categoryGroup = colorsList.find(group => group.title === currentCategory);
		if (!categoryGroup) {
			categoryGroup = { title: currentCategory, colors: [] };
			colorsList.push(categoryGroup);
		}

		categoryGroup.colors.push({
			name: humanReadableName,
			colorVariable: variableName
		});
	}
}

// Build the output file
const output = `// This file is auto-generated. Do not edit manually.

export const colorsList = ${JSON.stringify(colorsList, null, 2)};
`;

fs.writeFileSync(outputPath, output, 'utf-8');

console.log('✅ colorsList.ts generated successfully with full categorization and normalized category names!');
