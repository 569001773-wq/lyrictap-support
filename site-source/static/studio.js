/* LyricTap static browser studio. Audio is never uploaded. */
(function () {
  'use strict';
  const $ = (selector, parent=document) => parent.querySelector(selector);
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toClock = (n) => {
    const centi = Math.round(Math.max(0, n || 0) * 100);
    return String(Math.floor(centi / 6000)).padStart(2,'0') + ':' + String(Math.floor(centi / 100) % 60).padStart(2,'0') + '.' + String(centi % 100).padStart(2,'0');
  };
  const toSRT = (n) => {
    const ms = Math.max(0, Math.round(n * 1000));
    return String(Math.floor(ms/3600000)).padStart(2,'0') + ':' + String(Math.floor(ms/60000)%60).padStart(2,'0') + ':' + String(Math.floor(ms/1000)%60).padStart(2,'0') + ',' + String(ms%1000).padStart(3,'0');
  };
  const $audio = $('audio'), $input = $('input[type="file"][accept="audio/*"]'), $drop = $('.audio-drop'), $name = $('.audio-drop strong');
  const $lyrics = $('textarea[aria-label^="Lyrics"]'), $timeline = $('.lyric-timeline');
  const $count = $('.timeline-head span:last-child'), $tap = $('.tap-button'), $play = $('.play-button');
  const $seek = $('input.seek'), $track = $('.track-info strong'), $time = $('.track-info span');
  const $hint = $('.export-row small'), $exports = [...document.querySelectorAll('.export-buttons button')];
  if (!$audio || !$input || !$drop || !$lyrics || !$timeline || !$tap) return;
  const key = 'lyrictap.web-studio.v2';
  let audioURL = '', fileName = '', active = 0, lines = [], duration = 0, current = 0;
  let error = $('.error-message');
  if (!error) { error = document.createElement('p'); error.className='error-message'; error.setAttribute('role','alert'); $('.export-row').after(error); }
  const announce = (text) => {error.textContent = text || '';};
  const example = $lyrics.value;
  function parse(text) {return text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map((text,id)=>({id,text,time:null}));}
  function save() {try {localStorage.setItem(key, JSON.stringify({lyrics:$lyrics.value,lines,active}));} catch (_) {}}
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (!saved || !Array.isArray(saved.lines) || typeof saved.lyrics !== 'string') return false;
      $lyrics.value=saved.lyrics;
      lines=saved.lines.filter(x=>x && typeof x.text==='string').slice(0,3000).map((x,id)=>({id,text:x.text,time:Number.isFinite(x.time)&&x.time>=0?x.time:null}));
      active=Math.min(Math.max(0,Number(saved.active)||0),lines.length);
      return true;
    } catch (_) {return false;}
  }
  function render() {
    const count=lines.filter(x=>x.time!==null).length;
    $timeline.innerHTML=lines.map((line,i)=>'<div class="lyric-row '+(i===active?'is-active ':'')+(line.time!==null?'is-synced':'')+'" data-line="'+i+'"><button type="button" class="timecode" data-seek="'+i+'" aria-label="Seek to '+escapeHTML(line.text)+'">'+(line.time===null?'—:—.—':toClock(line.time))+'</button><span class="line-number">'+String(i+1).padStart(2,'0')+'</span><p>'+escapeHTML(line.text)+'</p>'+(line.time===null?'':'<div class="nudge-controls"><button type="button" data-nudge="-0.1" data-index="'+i+'" aria-label="Move earlier">−</button><button type="button" data-nudge="0.1" data-index="'+i+'" aria-label="Move later">+</button></div>')+'</div>').join('')+(active>=lines.length&&lines.length?'<div class="done-state">All lines synced. Your timed files are ready.</div>':'');
    $count.textContent=count+' / '+lines.length+' synced';
    $tap.disabled = !lines.length || active>=lines.length;
    $('span',$tap).textContent = active>=lines.length?'SYNC COMPLETE':'TAP CURRENT LINE';
    const complete=lines.length>0&&count===lines.length;
    $exports.forEach(btn=>{btn.disabled=btn.textContent.trim()==='TXT'?!lines.length:!complete;});
    $hint.textContent=complete?'Your timeline is ready · Review timings before exporting':'Sync each line to export timed LRC or SRT; TXT is always available.';
    if (active<lines.length) {
      const row=$timeline.querySelector('[data-line="'+active+'"]');
      if (row && $timeline.clientHeight) $timeline.scrollTop=Math.max(0,row.offsetTop-$timeline.offsetTop-$timeline.clientHeight/2);
    }
    save();
  }
  function loadFile(file) {
    if (!file) return;
    if (!(file.type.startsWith('audio/')||/\.(mp3|wav|m4a|aac|flac|ogg|opus|mp4)$/i.test(file.name))) { announce('Please select an audio file.'); return; }
    if (audioURL) URL.revokeObjectURL(audioURL);
    audioURL=URL.createObjectURL(file);fileName=file.name.replace(/\.[^.]+$/,'');
    $audio.src=audioURL;$audio.load();duration=0;current=0;
    $name.textContent=file.name;$track.textContent=file.name;$('.audio-drop small').textContent='Ready to play · Click to replace';$drop.classList.add('has-file');
    $play.textContent='▶';updatePlayback();announce('');
  }
  function updatePlayback() {
    current=$audio.currentTime||0;
    $time.textContent=Math.floor(current/60)+':'+String(Math.floor(current%60)).padStart(2,'0')+' / '+Math.floor(duration/60)+':'+String(Math.floor(duration%60)).padStart(2,'0');
    $seek.max=duration||1;$seek.value=Math.min(current,duration||1);
  }
  function stamp() {
    if (!audioURL) {announce('Choose your audio file first. Your file stays on this device.');return;}
    if (active>=lines.length) return;
    lines[active].time=Math.max(0,$audio.currentTime||0);active++;announce('');render();
  }
  function undo() {if (!lines.length)return;active=Math.max(0,active-1);lines[active].time=null;announce('');render();}
  function reset() {lines=lines.map(line=>({...line,time:null}));active=0;announce('');render();}
  function validateTimed() {
    if (!lines.length || lines.some(x=>x.time===null)) throw new Error('Sync every lyric line before timed export.');
    for (let i=0;i<lines.length;i++) {
      if (i && lines[i].time<=lines[i-1].time) throw new Error('Timestamps must increase in lyric order. Check line '+(i+1)+' before exporting.');
      if (duration>0 && lines[i].time>duration+0.5) throw new Error('One or more timestamps are beyond the audio duration.');
    }
  }
  function exportFormat(format) {
    try {
      if (!lines.length) throw new Error('Paste lyrics and build a timeline first.');
      let body='';
      if (format==='txt') body=lines.map(x=>x.text).join('\n');
      else {
        validateTimed();
        if (format==='lrc') body=lines.map(x=>'['+toClock(x.time)+']'+x.text).join('\n');
        else body=lines.map((x,i)=>{
          const start=x.time;
          const next=i+1<lines.length?lines[i+1].time:null;
          const end=next===null?(duration>start+0.2?Math.min(duration,start+4):start+2):Math.min(start+4,next-0.01);
          if (end<=start+0.01) throw new Error('Two lyric lines are too close to export as SRT. Adjust timestamps around line '+(i+1)+'.');
          return (i+1)+'\n'+toSRT(start)+' --> '+toSRT(end)+'\n'+x.text;
        }).join('\n\n');
      }
      const url=URL.createObjectURL(new Blob([body+'\n'],{type:'text/plain;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download=(fileName||'lyrictap-lyrics')+'.'+format;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),3000);
      announce('Export complete. Need AI auto-sync or lyric videos? Try LyricTap on the App Store.');
    } catch(e){announce(e.message||'Export failed.');}
  }
  $drop.addEventListener('click',()=> $input.click());
  $input.addEventListener('change',()=>loadFile($input.files&&$input.files[0]));
  ['dragenter','dragover'].forEach(kind=>$drop.addEventListener(kind,e=>{e.preventDefault();$drop.classList.add('is-dragover');}));
  ['dragleave','drop'].forEach(kind=>$drop.addEventListener(kind,e=>{e.preventDefault();$drop.classList.remove('is-dragover');if(kind==='drop')loadFile(e.dataTransfer&&e.dataTransfer.files[0]);}));
  $('.build-button').addEventListener('click',()=>{const next=parse($lyrics.value);if(!next.length){announce('Paste at least one lyric line.');return;}lines=next;active=0;announce('');render();});
  $lyrics.addEventListener('input',()=>{try{localStorage.setItem(key+'.draft',$lyrics.value);}catch(_){}});
  $audio.addEventListener('loadedmetadata',()=>{duration=Number.isFinite($audio.duration)?$audio.duration:0;updatePlayback();});
  $audio.addEventListener('timeupdate',updatePlayback);
  $audio.addEventListener('play',()=>{$play.textContent='Ⅱ';});
  $audio.addEventListener('pause',()=>{$play.textContent='▶';});
  $play.addEventListener('click',()=>{if(!audioURL){announce('Choose an audio file first.');return;}if($audio.paused)$audio.play().catch(()=>announce('Playback failed. Try another supported audio file.'));else $audio.pause();});
  $seek.addEventListener('input',()=>{if(audioURL)$audio.currentTime=Number($seek.value);});
  $('.mini-control').addEventListener('click',()=>{if(audioURL)$audio.currentTime=Math.max(0,$audio.currentTime-5);});
  $tap.addEventListener('click',stamp);
  $('.tap-secondary button:first-child').addEventListener('click',undo);
  $('.tap-secondary button:last-child').addEventListener('click',reset);
  $timeline.addEventListener('click',event=>{
    const nudge=event.target.closest('[data-nudge]'), seek=event.target.closest('[data-seek]');
    if(nudge) {const i=Number(nudge.dataset.index);if(lines[i]&&lines[i].time!==null){lines[i].time=Math.max(0,Math.round((lines[i].time+Number(nudge.dataset.nudge))*100)/100);render();}return;}
    if(seek){const i=Number(seek.dataset.seek);if(lines[i]&&lines[i].time!==null&&audioURL){$audio.currentTime=lines[i].time;active=i;render();}}
  });
  $exports.forEach(btn=>btn.addEventListener('click',()=>exportFormat(btn.textContent.trim().toLowerCase())));
  document.addEventListener('keydown',event=>{
    if(event.code!=='Space'||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
    const tag=event.target&&event.target.tagName;
    if(['TEXTAREA','INPUT','BUTTON','A','SELECT'].includes(tag)||event.target.isContentEditable)return;
    event.preventDefault();stamp();
  });
  const restored=load();if(!restored){lines=parse(example);active=0;}
  render();
  if(restored)announce('Restored your lyric timings. Select your audio file again to continue; audio is never stored.');
  window.addEventListener('pagehide',()=>{if(audioURL)URL.revokeObjectURL(audioURL);});
})();
