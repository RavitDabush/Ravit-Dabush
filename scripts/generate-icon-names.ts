import { readdir, writeFile } from 'fs/promises';
import path from 'path';

async function run() {
	const dirPath = path.resolve('node_modules/@phosphor-icons/react/dist/ssr');

	const outputPath = path.resolve('scripts/iconNames.json');

	// Read all .es.js files
	const files = await readdir(dirPath);

	const iconNames = files
		.filter(file => file.endsWith('.es.js'))
		.map(file => file.replace('.es.js', ''))
		.filter(name => name.toLowerCase() !== 'index')
		.sort();

	await writeFile(outputPath, JSON.stringify(iconNames, null, 2), 'utf-8');

	console.log(`✅ Found ${iconNames.length} icons and saved to iconNames.json`);
}

void run();
