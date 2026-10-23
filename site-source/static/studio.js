/* Local-only manual lyric studio. Audio and lyrics never leave this browser. */
import { parseLyrics, parseClock, toClock, exportLyrics, MAX_TEXT } from './formats.js';
const $ = (s, p = document) => p.querySelector(s);
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const audio = $('audio'), input = $('input[type=file][accept="audio/*"]'), drop = $('.audio-drop');
const lyrics = $('textarea'), timeline = $('.lyric-timeline'), tap = $('.tap-button'), play = $('.play-button');
const seek = $('input.seek'), exports = [...document.querySelectorAll('.export-buttons button')];
const key = 'lyrictap.web-studio.v2';
let lines = [], active = 0, duration = 0, audioURL = '', identity = null, audioReady = false, fileName = '';
let draft = '', history = [], page = 0, storageWarning = false, saveTimer = null;
const pageSize = 100;
const alert = document.createElement('p'); alert.className = 'error-message'; alert.setAttribute('role','alert'); $('.export-row').after(alert);
const status = document.createElement('p'); status.className = 'save-status'; status.setAttribute('role','status'); $('.textarea-meta').after(status);
const actions = document.createElement('div'); actions.className='progress-actions';
actions.innerHTML='<button type="button" data-save>Save progress</button><button type="button" data-clear>Delete saved progress</button>';
status.after(actions);
const pager = document.createElement('div'); pager.className='timeline-pages'; timeline.after(pager);
const metric = (name, format) => document.dispatchEvent(new CustomEvent('lyrictap:metric', { detail: { name, ...(format ? {format} : {}) } }));
const announce = message => { alert.classList.remove('is-success'); alert.textContent=message || ''; };
function persist() {
  clearTimeout(saveTimer);saveTimer=null;
  try {
    localStorage.setItem(key, JSON.stringify({ lyrics: draft, lines, active, identity }));
    localStorage.setItem(key+'.draft', lyrics.value);
    if (!storageWarning) status.textContent='Progress saved in this browser · Audio is not saved.';
  } catch {
    storageWarning=true;
    status.textContent='This browser cannot save progress. Export your files before closing this page.';
  }
}
function checkpoint() {
  history.push({lines:lines.map(x=>({...x})), active, draft});
  if (history.length>30) history.shift();
}
function updateDraft() {
  const pending=lyrics.value!==draft;
  $('.build-button').textContent=pending ? 'Apply edited lyrics →' : 'Build timeline →';
  const count=lyrics.value.split(/\r\n?|\n/).filter(x=>x.trim()).length;
  $('.textarea-meta span:last-child').textContent=count+' lines';
  exports.forEach(btn=>{ btn.disabled=pending || !lines.length || (btn.textContent.trim()!=='TXT' && lines.some(x=>x.time===null)); });
  $('.export-row small').textContent=pending ? 'Apply your edited lyrics before exporting. Existing timings are kept when the lines match.' : 'LRC / SRT need every line timed. SRT captions end before the next line, at 4 seconds, or at the song end.';
}
function render(moveToActive=false) {
  if (moveToActive) page=Math.floor(Math.min(active,Math.max(0,lines.length-1))/pageSize);
  page=Math.max(0,Math.min(page,Math.ceil(lines.length/pageSize)-1));
  const start=page*pageSize;
  timeline.innerHTML=lines.slice(start,start+pageSize).map((line,j)=>{
    const i=start+j;
    return `<div class="lyric-row ${i===active?'is-active ':''}${line.time!==null?'is-synced':''}" data-line="${i}"><div class="time-controls"><input class="time-edit" aria-label="Timestamp for line ${i+1}" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder="mm:ss.xx" value="${line.time===null?'':toClock(line.time)}" data-time="${i}"><button type="button" data-seek="${i}" aria-label="Play from line ${i+1}" ${line.time===null?'disabled':''}>↗</button></div><span class="line-number">${i+1}</span><p>${esc(line.text)}</p><div class="nudge-controls"><button type="button" data-nudge="-0.1" data-index="${i}" aria-label="Move line ${i+1} earlier" ${line.time===null?'disabled':''}>−</button><button type="button" data-nudge="0.1" data-index="${i}" aria-label="Move line ${i+1} later" ${line.time===null?'disabled':''}>+</button></div></div>`;
  }).join('');
  pager.innerHTML=lines.length>pageSize ? `<button data-page="-1" ${page===0?'disabled':''}>Previous lines</button><span>${start+1}–${Math.min(start+pageSize,lines.length)} / ${lines.length}</span><button data-page="1" ${(start+pageSize)>=lines.length?'disabled':''}>Next lines</button>` : '';
  $('.timeline-head>span').textContent=lines.filter(x=>x.time!==null).length+' / '+lines.length+' synced';
  tap.disabled=!lines.length || active>=lines.length;
  $('span',tap).textContent=active>=lines.length?'SYNC COMPLETE':'TAP CURRENT LINE';
  $('.tap-secondary button:first-child').disabled=!history.length;
  updateDraft();
  if (moveToActive) {
    const row=$(`[data-line="${active}"]`,timeline);
    if(row) timeline.scrollTop=Math.max(0,row.offsetTop-timeline.offsetTop-timeline.clientHeight/2);
  }
}
function updatePlayback() {
  const current=audio.currentTime||0;
  const clock=n=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0');
  $('.track-info span').textContent=clock(current)+' / '+clock(duration);
  seek.max=duration||1; seek.value=Math.min(current,duration||1);seek.disabled=!audioReady;
  play.textContent=audio.paused?'▶':'Ⅱ'; play.setAttribute('aria-label',audio.paused?'Play':'Pause');
}
function stamp() {
  if (!audioReady) return announce('Choose a playable audio file first. Your file stays on this device.');
  if (lyrics.value!==draft) return announce('Apply your edited lyrics before timing.');
  if (active>=lines.length) return;
  const time=Math.round(audio.currentTime*100)/100;
  if (time>=duration) return announce('Seek earlier: each line must start before the audio ends.');
  if (active>0 && lines[active-1].time!==null && time<=lines[active-1].time) return announce('Play or seek forward before timing the next line.');
  checkpoint(); lines[active].time=time; active++; announce('');render(true);persist();
}
function loadFile(file) {
  if (!file) return;
  if (!(file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg|opus|mp4)$/i.test(file.name))) return announce('Please select an audio file.');
  const next={name:file.name,size:file.size,lastModified:file.lastModified};
  if (identity && JSON.stringify(identity)!==JSON.stringify(next) && lines.some(x=>x.time!==null)) {
    if (!confirm('This is a different audio file. Reset the old timestamps for the new song? Cancel keeps your current song and progress.')) return;
    history=[];lines=lines.map(x=>({...x,time:null}));active=0;render(true);
  }
  audio.pause();
  if (audioURL) URL.revokeObjectURL(audioURL);
  audioReady=false;duration=0;audioURL=URL.createObjectURL(file);identity=next;
  fileName=file.name.replace(/\.[^.]+$/,'').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,100);
  audio.src=audioURL;audio.load();
  $('.audio-drop strong').textContent=file.name;$('.track-info strong').textContent=file.name;
  $('.audio-drop small').textContent='Loading audio…';drop.classList.add('has-file');
  updatePlayback();persist();announce('');metric('Editor used');
}
function restore() {
  try {
    const saved=JSON.parse(localStorage.getItem(key)||'null');
    const rawDraft=localStorage.getItem(key+'.draft');
    if (saved && Array.isArray(saved.lines) && saved.lines.length<=3000 && typeof saved.lyrics==='string' && saved.lyrics.length<=MAX_TEXT) {
      const parsed=parseLyrics(saved.lyrics);
      if(parsed.length!==saved.lines.length || parsed.some((x,i)=>x.text!==saved.lines[i]?.text)) throw new Error('Invalid stored project');
      lines=parsed.map((x,i)=>({...x,time:Number.isFinite(saved.lines[i].time)&&saved.lines[i].time>=0?saved.lines[i].time:null}));
      draft=saved.lyrics;lyrics.value=typeof rawDraft==='string'&&rawDraft.length<=MAX_TEXT?rawDraft:draft;
      active=Math.min(Math.max(0,Math.floor(Number(saved.active)||0)),lines.length);
      identity=saved.identity&&typeof saved.identity.name==='string'?saved.identity:null;
      announce('Restored your progress. Select the same audio file to continue; audio is never stored.');return;
    }
    if (rawDraft!==null && rawDraft.length<=MAX_TEXT) lyrics.value=rawDraft;
  } catch {announce('Saved progress could not be restored. Your browser may have removed or changed it.');}
  try {lines=parseLyrics(lyrics.value);draft=lyrics.value;} catch {lines=[];draft=lyrics.value;}
}
function undo() {
  const previous=history.pop(); if(!previous)return;
  lines=previous.lines;active=previous.active;draft=previous.draft;lyrics.value=draft;
  announce('Last timeline change undone.');render(true);persist();
}
function clearTimes() {
  if(lines.some(x=>x.time!==null)&&!confirm('Reset all timestamps? Your lyrics will stay. Undo can restore the timings.'))return;
  checkpoint();lines=lines.map(x=>({...x,time:null}));active=0;announce('Timestamps reset.');render(true);persist();
}
function download(format) {
  try {
    if(lyrics.value!==draft)throw new Error('Apply your edited lyrics before exporting.');
    const body=exportLyrics(format,lines,duration);
    const url=URL.createObjectURL(new Blob([body],{type:format==='srt'?'application/x-subrip;charset=utf-8':'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=(fileName||'lyrictap-lyrics')+'.'+format;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    announce('File generated. Check your browser downloads or use Share → Save to Files on iPhone / iPad.');alert.classList.add('is-success');
    const link=document.createElement('a');link.href='https://apps.apple.com/us/app/lyrictap-auto-sync-lyrics/id6789857221';link.dataset.placement='export';
    link.textContent=' Discover AI Auto-Sync and lyric videos in the iOS app →';alert.append(link);
    metric('Export generated',format);
  } catch(e) {announce(e.message||'Export failed.');}
}
drop.addEventListener('click',()=>input.click());
input.addEventListener('change',()=>{loadFile(input.files?.[0]);input.value='';});
['dragenter','dragover'].forEach(kind=>drop.addEventListener(kind,e=>{e.preventDefault();drop.classList.add('is-dragover');}));
['dragleave','drop'].forEach(kind=>drop.addEventListener(kind,e=>{e.preventDefault();drop.classList.remove('is-dragover');if(kind==='drop')loadFile(e.dataTransfer?.files[0]);}));
$('.build-button').addEventListener('click',()=>{
  try {
    const next=parseLyrics(lyrics.value);
    if(next.length===lines.length&&next.every((x,i)=>x.text===lines[i].text)){draft=lyrics.value;updateDraft();persist();return;}
    if(lines.some(x=>x.time!==null)&&!confirm('The lyric lines changed. Rebuild and clear their timestamps? Undo can restore the previous timeline.'))return;
    checkpoint();lines=next;draft=lyrics.value;active=0;announce('Timeline ready. Choose audio, play, and tap each line.');render(true);persist();metric('Timeline built');
  }catch(e){announce(e.message);}
});
lyrics.maxLength=MAX_TEXT;
lyrics.addEventListener('input',()=>{updateDraft();clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=null;persist();},200);});
audio.addEventListener('loadedmetadata',()=>{
  duration=Number.isFinite(audio.duration)?audio.duration:0;audioReady=duration>0;
  $('.audio-drop small').textContent=audioReady?'Ready to play · Choose to replace':'This file has no playable duration.';
  if(!audioReady)announce('This file has no playable audio. Try MP3, M4A, or WAV.');
  else if(lines.some(x=>x.time!==null&&x.time>=duration))announce('Saved timestamps exceed this audio. Check that you selected the same song.');
  updatePlayback();
});
audio.addEventListener('error',()=>{audioReady=false;duration=0;updatePlayback();$('.audio-drop small').textContent='Choose another audio file';announce('This browser cannot play this file. It may be damaged or use an unsupported codec. Try MP3, M4A, or WAV.');});
['timeupdate','play','pause','ended'].forEach(event=>audio.addEventListener(event,updatePlayback));
play.addEventListener('click',()=>{if(!audioReady)return announce('Choose a playable audio file first.');if(audio.paused)audio.play().catch(()=>announce('Playback could not start. Tap Play again or try a supported file.'));else audio.pause();});
seek.addEventListener('input',()=>{if(audioReady){audio.currentTime=Number(seek.value);updatePlayback();}});
$('.mini-control').addEventListener('click',()=>{if(audioReady){audio.currentTime=Math.max(0,audio.currentTime-5);updatePlayback();}});
tap.addEventListener('click',stamp);
$('.tap-secondary button:first-child').addEventListener('click',undo);
$('.tap-secondary button:last-child').addEventListener('click',clearTimes);
actions.querySelector('[data-save]').addEventListener('click',()=>{persist();announce(storageWarning?'Progress cannot be saved here. Export before closing.':'Progress saved. Reopen in this browser and reselect your audio to continue.');});
actions.querySelector('[data-clear]').addEventListener('click',()=>{
  if(!confirm('Delete the saved lyrics and timings from this browser? The current open timeline stays until you close or edit it.'))return;
  try{localStorage.removeItem(key);localStorage.removeItem(key+'.draft');status.textContent='Saved progress deleted. Further edits will save a new draft.';announce('Saved browser progress deleted.');}catch{announce('Browser storage is unavailable.');}
});
pager.addEventListener('click',e=>{const button=e.target.closest('[data-page]');if(button){page+=Number(button.dataset.page);render();timeline.scrollTop=0;}});
timeline.addEventListener('change',e=>{
  const field=e.target.closest('[data-time]');if(!field)return;
  const i=Number(field.dataset.time);
  try {
    const time=field.value.trim()===''?null:parseClock(field.value);
    if(time!==null&&duration>0&&time>=duration)throw new Error('Timestamp must be before the audio ends.');
    checkpoint();lines[i].time=time;active=lines.findIndex(x=>x.time===null);if(active<0)active=lines.length;
    announce('');render();persist();
  }catch(e){field.value=lines[i].time===null?'':toClock(lines[i].time);announce(e.message);}
});
timeline.addEventListener('click',e=>{
  const nudge=e.target.closest('[data-nudge]'), jump=e.target.closest('[data-seek]');
  if(nudge){const i=Number(nudge.dataset.index);const time=Math.max(0,Math.round((lines[i].time+Number(nudge.dataset.nudge))*100)/100);if(duration>0&&time>=duration)return announce('Timestamp must be before the audio ends.');checkpoint();lines[i].time=time;render();persist();$(`[data-index="${i}"][data-nudge="${nudge.dataset.nudge}"]`,timeline)?.focus();return;}
  if(jump&&audioReady){audio.currentTime=lines[Number(jump.dataset.seek)].time;updatePlayback();}
});
exports.forEach(btn=>btn.addEventListener('click',()=>download(btn.textContent.trim().toLowerCase())));
document.addEventListener('keydown',e=>{
  if(e.target.closest('textarea,input,button,a,select,[contenteditable=true]'))return;
  if(e.code==='Space'&&!e.repeat&&!e.altKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();stamp();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();}
});
// Revoke only when leaving for good; a bfcache restore must keep playable audio.
window.addEventListener('pagehide',e=>{if(saveTimer)persist();if(!e.persisted&&audioURL)URL.revokeObjectURL(audioURL);});
restore();render(true);updatePlayback();
