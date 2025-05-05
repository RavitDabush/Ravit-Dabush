#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('\n🔍 Checking for outdated dependencies...\n');

try {
	const result = execSync('npm outdated --long', { encoding: 'utf8' });
	const lines = result.trim().split('\n');

	if (lines.length <= 1) {
		console.log('🎉 All dependencies are up to date!');
	} else {
		console.log('📦 Outdated packages found:\n');
		console.log(lines.slice(0, 1)[0]); // table header
		console.log('-'.repeat(lines[0].length));
		console.log(lines.slice(1).join('\n')); // the table
	}
} catch (error) {
	if (error.stdout) {
		const lines = error.stdout.trim().split('\n');
		console.log('📦 Outdated packages found:\n');
		console.log(lines.slice(0, 1)[0]);
		console.log('-'.repeat(lines[0].length));
		console.log(lines.slice(1).join('\n'));
	} else {
		console.error(
			'❌ Failed to check for outdated packages.\n',
			error.message
		);
	}
}
