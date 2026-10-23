import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const baseline=JSON.parse(await readFile(new URL('./legal-baseline.json',import.meta.url)));
for(const [path,sha] of Object.entries(baseline))test(`preserves original legal/support bytes: ${path}`,async()=>{
 const data=await readFile(new URL('../site-source/static/'+path,import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),sha);
});
