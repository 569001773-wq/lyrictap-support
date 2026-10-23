/* Optional consent-based Plausible adapter. Never receives audio, filenames or lyrics. */
(() => {
  'use strict';
  const config=window.LYRICTAP_CONFIG||{};
  const lang=document.documentElement.lang||'en';
  const page=new URL(document.querySelector('link[rel=canonical]')?.href||location.href);
  const slug=page.pathname.replace('/lyrictap-support/','').replace(/\/$/,'')||'home';
  const allowed=new Set(['Editor used','Timeline built','Export generated','App Store click']);
  const consentKey='lyrictap.analytics-consent.v1';
  const campaign=(placement)=>`web_${lang.split('-')[0]}_${slug.split('/').pop().replace(/-/g,'_').slice(0,12)}_${placement.replace(/[^a-z0-9]/gi,'').slice(0,7)}`.slice(0,40);
  function decorate(a) {
    if(!a?.href?.startsWith('https://apps.apple.com/'))return;
    a.dataset.campaign ||= campaign(a.dataset.placement||'link');
    if(config.appleProviderToken){const url=new URL(a.href);url.searchParams.set('pt',config.appleProviderToken);url.searchParams.set('ct',a.dataset.campaign);url.searchParams.set('mt','8');a.href=url.href;}
  }
  document.querySelectorAll('a[href^="https://apps.apple.com/"]').forEach(decorate);
  // Attribute dynamically created export links before navigation, including keyboard activation.
  document.addEventListener('pointerdown',e=>decorate(e.target.closest('a')),true);
  document.addEventListener('focusin',e=>decorate(e.target.closest('a')),true);
  function optedIn(){try{return localStorage.getItem(consentKey)==='yes';}catch{return false;}}
  function track(name,props={}) {
    if(!config.analytics?.enabled || !optedIn() || navigator.globalPrivacyControl || navigator.doNotTrack==='1')return;
    if(name!=='pageview'&&!allowed.has(name))return;
    // Canonical URL only: strip query strings and fragments, which may contain user-entered text.
    const payload={name,url:page.href.split('?')[0].split('#')[0],domain:config.analytics.domain,props:{language:lang,page:slug}};
    if(name==='pageview'){
      try{payload.referrer=document.referrer?new URL(document.referrer).origin:'';}catch{}
    }
    if(['lrc','srt','txt'].includes(props.format))payload.props.format=props.format;
    if(name==='App Store click')payload.props.campaign=String(props.campaign||'').replace(/[^a-zA-Z0-9_]/g,'').slice(0,40);
    // No arbitrary event props, DOM content, storage, filenames, audio or lyrics can enter this payload.
    fetch(config.analytics.endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(payload),keepalive:true,credentials:'omit',referrerPolicy:'no-referrer'}).catch(()=>{});
  }
  document.addEventListener('lyrictap:metric',e=>track(e.detail?.name,{format:e.detail?.format}));
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="https://apps.apple.com/"]');if(a){decorate(a);track('App Store click',{campaign:a.dataset.campaign});}},true);
  if(!config.analytics?.enabled)return; // Zero analytics network requests without a real configured account.
  const text=lang==='ja'?['アクセス解析の設定','任意のアクセス解析','同意した場合のみ、ページ、参照元のサイト、国、言語、ツールの利用やApp StoreリンクのクリックをPlausibleで集計します。音声・ファイル名・歌詞は送信しません。','許可する','許可しない','閉じる']:lang==='zh-Hans'?['访问统计设置','可选访问统计','仅在同意后，通过 Plausible 汇总页面、来源网站、国家、语言、工具使用和 App Store 点击。不发送音频、文件名或歌词。','允许','不允许','关闭']:['Analytics preferences','Optional visitor analytics','Only with your consent, Plausible counts pages, referring sites, country, language, tool use and App Store clicks. Audio, filenames and lyrics are never sent.','Allow','Do not allow','Close'];
  const button=document.createElement('button');button.className='analytics-choice';button.textContent=text[0];button.type='button';document.querySelector('footer')?.append(button);
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-labelledby','analytics-title');
  const title=document.createElement('h2');title.id='analytics-title';title.textContent=text[1];
  const description=document.createElement('p');description.textContent=text[2];dialog.append(title,description);
  const link=document.createElement('a');link.href='/lyrictap-support/website-privacy/';link.textContent=lang==='ja'?'詳細':lang==='zh-Hans'?'详细说明':'Details';dialog.append(link);
  [true,false,null].forEach((choice,i)=>{const b=document.createElement('button');b.type='button';b.textContent=text[i+3];b.addEventListener('click',()=>{if(choice!==null){try{localStorage.setItem(consentKey,choice?'yes':'no');}catch{}if(choice)track('pageview');}dialog.close();button.focus();});dialog.append(b);});
  document.body.append(dialog);button.addEventListener('click',()=>dialog.showModal());
  track('pageview');
})();
