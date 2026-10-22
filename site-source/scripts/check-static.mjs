import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=fileURLToPath(new URL('../../',import.meta.url));
const base='https://569001773-wq.github.io/lyrictap-support/';
const html=(p)=>readFile(join(root,p,'index.html'),'utf8');
const sitemap=await readFile(join(root,'sitemap.xml'),'utf8');
const links=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
assert.equal(links.length,16,'sitemap URL count');
assert.equal(new Set(links).size,links.length,'duplicate sitemap URLs');
const missing=[];
for(const url of links){
  assert.ok(url.startsWith(base),'sitemap escaped project path: '+url);
  const route=url.slice(base.length);
  const full=join(root,route,'index.html');
  let content;
  try{content=await readFile(full,'utf8');}catch(e){missing.push(route);continue;}
  assert.ok(content.includes('<html lang='),'missing lang on '+route);
  const canonical=(content.match(/rel="canonical" href="([^"]+)"/g)||[]);
  assert.equal(canonical.length,1,'canonical count '+route);
  assert.ok(content.includes('rel="canonical" href="'+url+'"'),'wrong canonical '+route);
  assert.ok(content.includes('<h1>'),'missing h1 '+route);
  const json=[...content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if(!route.endsWith('privacy/')&&!route.endsWith('support/')){
    assert.ok(json.length>=1,'missing structured data '+route);
  }
  for(const m of json)JSON.parse(m[1]);
  assert.ok(content.includes('apps.apple.com/us/app/lyrictap-auto-sync-lyrics/id6789857221')||route.includes('privacy/')||route.includes('support/'),'missing app conversion path '+route);
  for(const match of content.matchAll(/href="\/lyrictap-support\/([^"#?]*)/g)){
    const rel=match[1];
    if(!rel)continue;
    const fsPath=join(root,rel);
    try {if(/\.(css|js|svg|xml|txt)$/.test(rel))await access(fsPath);else await access(join(fsPath,'index.html'));}
    catch(e){missing.push(route+' references '+rel);}
  }
}
assert.deepEqual(missing,[],'broken pages/assets');
const homepage=await html('');
assert.ok(homepage.includes('id="studio"'),'missing interactive browser tool');
assert.ok(!homepage.includes('self.__next_f'),'unexpected Next.js hydration scripts');
const scriptPath=join(root,'studio.js');
const js=await readFile(scriptPath,'utf8');
assert.ok(js.includes('localStorage'),'missing local progress');
assert.ok(js.includes('validateTimed'),'missing timestamp validation');
assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon/.test(js),'unexpected network code in free editor');
const syntax=spawnSync(process.execPath,['--check',scriptPath],{encoding:'utf8'});
assert.equal(syntax.status,0,'studio.js failed Node syntax check: '+syntax.stderr);
console.log('PASS: 16 URLs, canonical/hreflang-ready HTML, schema JSON, internal links, editor JS syntax and privacy checks.');
