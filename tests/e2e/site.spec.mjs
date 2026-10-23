import {test,expect} from 'playwright/test';
import {readFile} from 'node:fs/promises';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import AxeBuilder from '@axe-core/playwright';
const base='/lyrictap-support/';
const routes=['','ja/','zh/','guides/','tools/lrc-maker/','guides/suno-lyrics-sync/','guides/lyric-video-maker/','guides/lyrics-to-srt/','guides/lrc-vs-srt-vs-ass/','ja/guides/kashi-douki/','privacy/','en/privacy/','ja/privacy/','support/','en/support/','ja/support/','website-privacy/'];
function wav(seconds=12){const rate=8000,n=rate*seconds,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.sin(i/rate*440*2*Math.PI)*1000),44+i*2);return b;}
const fixture={name:'test-song.wav',mimeType:'audio/wav',buffer:wav()};
const fixturePath=join(mkdtempSync(join(tmpdir(),'lyrictap-test-')),'test-song.wav');writeFileSync(fixturePath,fixture.buffer);
async function setup(page,text='First line\n副歌\n君の歌\n副歌'){
 await page.goto(base+'#studio');await expect(page.locator('[data-save]')).toBeVisible();
 await page.locator('textarea').fill(text);await page.locator('.build-button').click();
 await expect(page.locator('.lyric-row p').first()).toHaveText(text.split(/\r\n?|\n/).find(x=>x.trim()).trim());
}
async function choose(page,file=fixture){await page.locator('input[type=file]').setInputFiles(file===fixture?fixturePath:file);await expect(page.locator('.audio-drop small')).toContainText('Ready to play');}
async function setTime(page,i,time){const field=page.getByLabel(`Timestamp for line ${i}`,{exact:true});await field.fill(time);await field.press('Tab');}
async function seek(page,n){await page.locator('.seek').evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('input',{bubbles:true}));},n);await expect.poll(()=>page.locator('audio').evaluate(el=>el.currentTime)).toBeCloseTo(n,1);}
for(const route of routes)test(`page ${route||'home'}: HTTP, metadata, layout and resources`,async({page,request})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const response=await page.goto(base+route);expect(response.status()).toBe(200);await expect(page.locator('h1')).toBeVisible();
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://569001773-wq.github.io'+base+route);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);expect(overflow,'horizontal page overflow').toBe(false);
 expect(errors).toEqual([]);
});
test('unknown path is a real HTTP 404 with recovery links',async({page})=>{const response=await page.goto(base+'missing-acceptance-page/');expect(response.status()).toBe(404);await expect(page.getByRole('heading',{name:'This page could not be found.'})).toBeVisible();await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex,follow');});
test('audio picker, play, pause, range seeking and rewind',async({page})=>{
 await setup(page);await choose(page);await page.getByRole('button',{name:'Play',exact:true}).click();await expect.poll(()=>page.locator('audio').evaluate(a=>a.currentTime)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Pause',exact:true}).click();expect(await page.locator('audio').evaluate(a=>a.paused)).toBe(true);
 await seek(page,8);await page.getByRole('button',{name:'−5s',exact:true}).click();await expect.poll(()=>page.locator('audio').evaluate(a=>a.currentTime)).toBeCloseTo(3,1);
});
test('audio drag/drop uses the local file without network upload',async({page})=>{
 await setup(page);const requests=[];page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
 const transfer=await page.evaluateHandle(bytes=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(bytes)],'drop.wav',{type:'audio/wav'}));return dt;},[...wav()]);
 await page.locator('.audio-drop').dispatchEvent('drop',{dataTransfer:transfer});await expect(page.locator('.audio-drop small')).toContainText('Ready to play');
 await setTime(page,1,'00:01.00');expect(requests.filter(r=>/^https?:/.test(r.url))).toEqual([]);
});
test('tap timing, keyboard Space, nudge, undo and reset',async({page,isMobile})=>{
 await setup(page,'A\nA');await choose(page);await seek(page,1);await page.locator('.tap-button').click();await expect(page.getByLabel('Timestamp for line 1',{exact:true})).toHaveValue('00:01.00');
 await seek(page,3);
 if(isMobile)await page.locator('.tap-button').tap();else {await page.locator('h1').click();await page.keyboard.press('Space');}
 await expect(page.getByLabel('Timestamp for line 2',{exact:true})).toHaveValue('00:03.00');
 await page.getByRole('button',{name:'Move line 2 later',exact:true}).click();await expect(page.getByLabel('Timestamp for line 2',{exact:true})).toHaveValue('00:03.10');
 await page.getByRole('button',{name:'↶ Undo',exact:true}).click();await expect(page.getByLabel('Timestamp for line 2',{exact:true})).toHaveValue('00:03.00');
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'↺ Start over',exact:true}).click();await expect(page.getByLabel('Timestamp for line 1',{exact:true})).toHaveValue('');
 await page.getByRole('button',{name:'↶ Undo',exact:true}).click();await expect(page.getByLabel('Timestamp for line 2',{exact:true})).toHaveValue('00:03.00');
});
test('real LRC, SRT, TXT downloads contain multilingual repeated lyrics',async({page})=>{
 await setup(page);await choose(page);for(let i=1;i<=4;i++)await setTime(page,i,`00:0${i}.25`);
 for(const format of ['LRC','SRT','TXT']){
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:format,exact:true}).click()]);
  expect(download.suggestedFilename()).toBe('test-song.'+format.toLowerCase());const content=await readFile(await download.path(),'utf8');
  expect(content).toContain('君の歌');expect(content.match(/副歌/g)).toHaveLength(2);
  if(format==='LRC')expect(content).toBe('[00:01.25]First line\n[00:02.25]副歌\n[00:03.25]君の歌\n[00:04.25]副歌\n');
  if(format==='SRT'){expect(content).toContain('00:00:01,250 --> 00:00:02,249');expect(content).toContain('00:00:04,250 --> 00:00:08,250');}
  if(format==='TXT')expect(content).toBe('First line\n副歌\n君の歌\n副歌\n');
 }
});
test('timestamps reject reversed order, duplicate precision, invalid input and song end',async({page})=>{
 await setup(page,'A\nB');await choose(page);await setTime(page,1,'00:02.00');await setTime(page,2,'00:01.00');
 await page.getByRole('button',{name:'LRC',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Timestamps must increase');
 await setTime(page,2,'00:02.00');await page.getByRole('button',{name:'SRT',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Timestamps must increase');
 await setTime(page,2,'00:99');await expect(page.getByRole('alert')).toContainText('Use a timestamp');
 await setTime(page,2,'00:12.00');await expect(page.getByRole('alert')).toContainText('before the audio ends');
});
test('local progress survives reload and unapplied draft stays separate',async({page})=>{
 await setup(page,'Old\nChorus');await choose(page);await setTime(page,1,'00:01.25');await page.locator('textarea').fill('New draft\nChorus');await page.getByRole('button',{name:'Save progress',exact:true}).click();
 await page.reload();await expect(page.locator('textarea')).toHaveValue('New draft\nChorus');await expect(page.getByLabel('Timestamp for line 1',{exact:true})).toHaveValue('00:01.25');await expect(page.getByRole('button',{name:'LRC',exact:true})).toBeDisabled();
 await expect(page.getByRole('alert')).toContainText('Select the same audio');expect(await page.locator('audio').getAttribute('src')).toBeNull();
 await page.locator('textarea').fill('Old\nChorus');await expect(page.getByLabel('Timestamp for line 1',{exact:true})).toHaveValue('00:01.25');await choose(page);
});
test('a different audio file cannot silently inherit old timings',async({page})=>{
 await setup(page,'A');await choose(page);await setTime(page,1,'00:01.00');page.once('dialog',d=>d.dismiss());await page.locator('input[type=file]').setInputFiles({...fixture,name:'different.wav'});await expect(page.locator('.track-info strong')).toHaveText('test-song.wav');
 page.once('dialog',d=>d.accept());await choose(page,{...fixture,name:'different.wav'});await expect(page.getByLabel('Timestamp for line 1',{exact:true})).toHaveValue('');
});
test('errors for missing, unsupported and corrupt audio are actionable',async({page})=>{
 await setup(page,'A');await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Choose a playable');
 await page.locator('input[type=file]').setInputFiles({name:'data.txt',mimeType:'text/plain',buffer:Buffer.from('x')});await expect(page.getByRole('alert')).toContainText('select an audio');
 await page.locator('input[type=file]').setInputFiles({name:'broken.wav',mimeType:'audio/wav',buffer:Buffer.from('invalid')});await expect(page.getByRole('alert')).toContainText('cannot play this file');
});
test('3000 lines paginate; empty lyrics cannot erase a working project',async({page})=>{
 await setup(page,Array.from({length:3000},(_,i)=>`歌詞 ${i+1}`).join('\n'));await expect(page.locator('.lyric-row')).toHaveCount(100);await page.getByRole('button',{name:'Next lines',exact:true}).click();await expect(page.getByLabel('Timestamp for line 101',{exact:true})).toBeVisible();
 await page.locator('textarea').fill('   ');await page.locator('.build-button').click();await expect(page.getByRole('alert')).toContainText('at least one');await expect(page.locator('.lyric-row')).toHaveCount(100);
});
test('untrusted lyric text renders as text, not executable markup',async({page})=>{await setup(page,'<img src=x onerror=alert(1)>\n<script>bad()</script>');await expect(page.locator('.lyric-timeline img')).toHaveCount(0);await expect(page.locator('.lyric-timeline')).toContainText('<img src=x onerror=alert(1)>');});
test('Space types in textarea without stamping; TXT works before timing',async({page})=>{
 await setup(page,'A');await page.locator('textarea').press('End');await page.locator('textarea').press('Space');await expect(page.getByLabel('Timestamp for line 1',{exact:true})).toHaveValue('');await page.locator('.build-button').click();
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'TXT',exact:true}).click()]);expect(await readFile(await download.path(),'utf8')).toBe('A\n');
});
test('blocked local storage warns but editor remains usable',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Denied','SecurityError');};});await setup(page,'A');await expect(page.locator('.save-status')).toContainText('cannot save progress');await expect(page.getByRole('button',{name:'TXT',exact:true})).toBeEnabled();
});
test('optional analytics is off and App Store attribution is not invented',async({page})=>{
 const external=[];page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().includes('127.0.0.1')&&!r.url().includes('569001773-wq.github.io'))external.push(r.url());});await page.goto(base);
 await expect(page.locator('[data-campaign]').first()).toHaveAttribute('data-campaign',/^web_en_/);expect(await page.locator('[data-campaign]').first().getAttribute('href')).not.toContain('pt=');expect(external).toEqual([]);
});
test('keyboard access and WCAG checks on home, guides and languages',async({page})=>{
 for(const route of ['','ja/','zh/','guides/lyrics-to-srt/']){await page.goto(base+route);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);}
 await page.goto(base);await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();
});
test('configured analytics requires opt-in and strips all user content',async({page})=>{
 const events=[];
 await page.route('**/site-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.LYRICTAP_CONFIG={analytics:{enabled:true,domain:"test.invalid",endpoint:"https://plausible.io/api/event"},appleProviderToken:"123456"};'}));
 await page.route('https://plausible.io/api/event',r=>{events.push(JSON.parse(r.request().postData()));return r.fulfill({status:202,headers:{'access-control-allow-origin':'*'}});});
 await page.goto(base+'?private-lyrics=SECRET#studio');await expect(page.getByRole('button',{name:'Analytics preferences',exact:true})).toBeVisible();expect(events).toEqual([]);
 const app=page.locator('a[data-campaign]').first();expect(await app.getAttribute('href')).toContain('pt=123456');expect(await app.getAttribute('href')).toContain('ct=web_en_');
 await page.getByRole('button',{name:'Analytics preferences',exact:true}).click();await page.getByRole('button',{name:'Allow',exact:true}).click();await expect.poll(()=>events.length).toBe(1);
 await page.evaluate(()=>document.dispatchEvent(new CustomEvent('lyrictap:metric',{detail:{name:'Export generated',format:'lrc',lyrics:'SECRET',filename:'private.wav',audio:'SECRET'}})));
 await expect.poll(()=>events.length).toBe(2);expect(JSON.stringify(events)).not.toContain('SECRET');expect(JSON.stringify(events)).not.toContain('private.wav');expect(events[1].props.format).toBe('lrc');
 await page.getByRole('button',{name:'Analytics preferences',exact:true}).click();await page.getByRole('button',{name:'Do not allow',exact:true}).click();await page.evaluate(()=>document.dispatchEvent(new CustomEvent('lyrictap:metric',{detail:{name:'Editor used'}})));expect(events.length).toBe(2);
});
