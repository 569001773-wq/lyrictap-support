import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cp,mkdtemp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('production build ignores legacy Next output, preserves source and emits only site assets',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'lyrictap-build-'));
 try{
  await cp(new URL('../site-source/',import.meta.url),join(temp,'site-source'),{recursive:true});await cp(new URL('../site.config.json',import.meta.url),join(temp,'site.config.json'));
  await mkdir(join(temp,'site-source/legacy-next/out'),{recursive:true});await writeFile(join(temp,'site-source/legacy-next/out/index.html'),'POISONED NEXT EXPORT');
  const before=await readFile(join(temp,'site-source/static/index.html'),'utf8');
  const built=spawnSync(process.execPath,['site-source/scripts/build-static.mjs'],{cwd:temp,encoding:'utf8'});assert.equal(built.status,0,built.stderr);
  assert.equal(await readFile(join(temp,'_site/index.html'),'utf8'),before);assert.equal(await readFile(join(temp,'site-source/static/index.html'),'utf8'),before);
  const files=await readdir(join(temp,'_site'));assert.ok(!files.includes('site-source'));assert.ok(!files.includes('_next'));assert.ok(!files.includes('node_modules'));assert.ok(!files.includes('.git'));
 }finally{await rm(temp,{recursive:true,force:true});}
});
