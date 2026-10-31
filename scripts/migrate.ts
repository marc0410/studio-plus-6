import { existsSync } from 'node:fs';
import { migrate } from '../lib/database.ts';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
migrate();
console.log('Base Studio+ prête.');
