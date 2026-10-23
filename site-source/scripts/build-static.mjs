import { cp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const output = new URL('../../_site/', import.meta.url);
const config = JSON.parse(await readFile(new URL('../../site.config.json', import.meta.url)));
if (config.analytics.enabled && (!config.analytics.domain || config.analytics.endpoint !== 'https://plausible.io/api/event')) throw new Error('Configure a real Plausible site and approved endpoint before enabling analytics.');
if (config.appleProviderToken && !/^\d+$/.test(config.appleProviderToken)) throw new Error('Apple provider token must come from App Store Connect.');
await rm(output, { recursive: true, force: true });
await cp(new URL('../static/', import.meta.url), output, { recursive: true });
await writeFile(new URL('.nojekyll', output), '');
await writeFile(new URL('site-config.js', output), `window.LYRICTAP_CONFIG = ${JSON.stringify(config).replace(/</g,'\\u003c')};\n`);
let commit = 'local';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
await writeFile(new URL('version.json', output), JSON.stringify({ commit }) + '\n');
console.log('Built static site in _site/; legacy Next.js is never executed.');

const home = new URL('index.html', output);
let html = await readFile(home, 'utf8');
for (const [name, value] of [['google-site-verification', config.searchConsoleVerification], ['msvalidate.01', config.bingVerification]]) {
 if(value){if(!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error('Invalid verification token');html=html.replace('</head>',`<meta name="${name}" content="${value}"></head>`);}
}
await writeFile(home, html);
if(config.analytics.enabled){
 const policy=new URL('website-privacy/index.html', output);
 let text=await readFile(policy,'utf8');
 text=text.replace('Optional visitor analytics is currently disabled.','Optional visitor analytics is available only after you opt in.').replace('現在、任意のアクセス解析は無効です。','任意のアクセス解析は同意した場合のみ有効です。').replace('目前未启用可选访问统计。','可选访问统计仅在你主动同意后启用。');
 await writeFile(policy,text);
}
