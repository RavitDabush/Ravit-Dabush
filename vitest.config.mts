import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-safe replacements for __filename / __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'server-only': path.resolve(__dirname, 'src/test/server-only.ts')
		}
	},
	test: {
		environment: 'node'
	}
});
