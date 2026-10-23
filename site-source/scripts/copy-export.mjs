// Compatibility command: copy reviewed static build, never legacy Next output.
import './build-static.mjs';
import { cp, readdir } from 'node:fs/promises';
const source = new URL('../../_site/', import.meta.url);
const target = new URL('../../', import.meta.url);
for (const item of await readdir(source)) await cp(new URL(item, source), new URL(item, target), { recursive: true });
console.log('Synced static output to branch root. Edit site-source/static only.');
