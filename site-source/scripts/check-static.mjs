import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../../_site/',import.meta.url));
const source=fileURLToPath(new URL('../static/',import.meta.url));
const base='https://569001773-wq.github.io/lyrictap-support/';
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)=["']([^"']*)["']/g)].map(x=>[x[1],x[2].replace(/&amp;/g,'&')]));
const tags=(html,name)=>[...html.matchAll(new RegExp('<'+name+'\\b[^>]*>','gi'))].map(x=>attrs(x[0]));
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?files(join(dir,x.name)):[join(dir,x.name)]))).flat();}
const sitemap=await readFile(join(root,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
assert.equal(new Set(urls).size,urls.length,'duplicate sitemap URLs');
const pages=new Map();const titles=new Set();let schemas=0,internalLinks=0;
for(const url of urls){
 assert.ok(url.startsWith(base),'outside project sitemap URL');assert.ok(url.endsWith('/'),'trailing slash canonical');
 const route=url.slice(base.length),html=await readFile(join(root,route,'index.html'),'utf8');pages.set(url,html);
 const lang=html.match(/<html\s+lang="([^"]+)"/i)?.[1];assert.ok(['en','ja','zh-Hans'].includes(lang),'valid page language '+route);
 const links=tags(html,'link');const canonical=links.filter(x=>x.rel==='canonical');assert.equal(canonical.length,1,route);assert.equal(canonical[0].href,url,route);
 const title=html.match(/<title>(.*?)<\/title>/s)?.[1];assert.ok(title,'title '+route);assert.ok(!titles.has(title),'duplicate title '+route);titles.add(title);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,'one h1 '+route);assert.ok(tags(html,'meta').some(x=>x.name==='description'&&x.content),'description '+route);
 assert.ok(!/noindex/i.test(html),'indexable '+route);
 const ld=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 const legal=/^(en\/|ja\/)?(privacy|support)\/$/.test(route);
 if(!legal){assert.ok(ld.length,'structured data '+route);assert.ok(html.includes('social-card.png'),'raster OG '+route);}
 for(const m of ld){const data=JSON.parse(m[1]);schemas+=Array.isArray(data)?data.length:1;}
 for(const item of [...tags(html,'a'),...links,...tags(html,'script'),...tags(html,'img')]){
  const raw=item.href||item.src;if(!raw||/^(mailto:|tel:|data:|blob:)/.test(raw))continue;
  const target=new URL(raw,url);if(target.origin!==new URL(base).origin)continue;
  assert.ok(target.pathname.startsWith('/lyrictap-support/'),'project-relative path '+raw);
  let file=join(root,decodeURIComponent(target.pathname.slice('/lyrictap-support/'.length)));
  if(target.pathname.endsWith('/'))file=join(file,'index.html');
  await access(file);internalLinks++;
  if(target.hash&&file.endsWith('.html')){const doc=await readFile(file,'utf8');assert.ok(doc.includes('id="'+decodeURIComponent(target.hash.slice(1))+'"')||doc.includes("id='"+decodeURIComponent(target.hash.slice(1))+"'"),'broken fragment '+target);}
 }
 for(const image of tags(html,'img')){assert.ok('alt'in image,'image alt '+route);assert.ok(image.width&&image.height,'image dimensions '+route);}
}
for(const [url,html] of pages){
 const alternates=tags(html,'link').filter(x=>x.rel==='alternate'&&x.hreflang);
 for(const item of alternates){assert.ok(pages.has(item.href),'alternate exists '+item.href);const peer=tags(pages.get(item.href),'link').filter(x=>x.rel==='alternate'&&x.hreflang);assert.deepEqual(peer.map(x=>[x.hreflang,x.href]).sort(),alternates.map(x=>[x.hreflang,x.href]).sort(),'reciprocal hreflang '+url);if(item.hreflang!=='x-default')assert.ok(pages.get(item.href).includes('<html lang="'+item.hreflang+'"'),'correct alternate language');}
}
const allHtml=(await files(source)).filter(x=>x.endsWith('index.html'));
assert.equal(allHtml.length,urls.length,'every canonical source page is in sitemap');
assert.ok((await readFile(join(root,'404.html'),'utf8')).includes('noindex'),'404 noindex');
const png=await readFile(join(root,'social-card.png'));assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
for(const js of ['studio.js','formats.js','analytics.js','site-config.js']){const result=spawnSync(process.execPath,['--check',join(root,js)],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
for(const js of ['studio.js','formats.js'])assert.ok(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(await readFile(join(root,js),'utf8')),'no network in editor '+js);
assert.ok(!(await files(root)).some(x=>x.includes('/_next/')),'no legacy Next artifact');
console.log(`PASS: ${urls.length} canonical pages; ${schemas} schema objects; ${internalLinks} internal links/assets; reciprocal hreflang; 1200×630 PNG; JS syntax and local-only editor.`);
