'use strict';
// ── SAMPLE DATA ──────────────────────────────────────────────────
const SAMPLE_DATA = {"last_updated":"2026-04-13T19:36:33+00:00","repository":{"path":"/mnt/backup/restic","drive_total_gb":15,"drive_used_gb":2,"drive_free_gb":12,"drive_percent_used":12},"backups":[{"name":"arcane_arcane-data","type":"volume","path":"/var/lib/docker/volumes/arcane_arcane-data/_data","last_run":"2026-04-13T19:35:54+00:00","status":"success","snapshot_id":"a6c57ac3","size_mb":0.5,"snapshots":[{"id":"a6c57ac3","time":"2026-04-13T19:35:54.735582667Z","size_mb":0.5},{"id":"5cccba42","time":"2026-04-13T19:33:12.935183884Z","size_mb":0.5},{"id":"fc8ff1bf","time":"2026-04-13T10:33:45.614331357Z","size_mb":0.4}]},{"name":"uptime-kuma_uptime-kuma-data","type":"volume","path":"/var/lib/docker/volumes/uptime-kuma_uptime-kuma-data/_data","last_run":"2026-04-13T19:35:58+00:00","status":"success","snapshot_id":"37e86779","size_mb":11.9,"snapshots":[{"id":"37e86779","time":"2026-04-13T19:35:58.843637468Z","size_mb":12.4},{"id":"811329b8","time":"2026-04-13T19:33:17.141784008Z","size_mb":12.4},{"id":"0d2baedc","time":"2026-04-13T10:33:46.593349077Z","size_mb":12.4}]},{"name":"npm_npm-data","type":"volume","path":"/var/lib/docker/volumes/npm_npm-data/_data","last_run":"2026-04-13T19:36:08+00:00","status":"success","snapshot_id":"b644ed27","size_mb":9.9,"snapshots":[{"id":"b644ed27","time":"2026-04-13T19:36:08.162133304Z","size_mb":91.8},{"id":"c316dc75","time":"2026-04-13T19:33:21.578629836Z","size_mb":91.8},{"id":"1d5279e6","time":"2026-04-13T10:33:47.780527574Z","size_mb":88.2}]},{"name":"npm_npm-letsencrypt","type":"volume","path":"/var/lib/docker/volumes/npm_npm-letsencrypt/_data","last_run":"2026-04-13T19:36:04+00:00","status":"success","snapshot_id":"a144d2f7","size_mb":0.0,"snapshots":[{"id":"a144d2f7","time":"2026-04-13T19:36:04.145213857Z","size_mb":0.0},{"id":"bff9236d","time":"2026-04-13T19:33:25.969911448Z","size_mb":0.0},{"id":"89d31aa4","time":"2026-04-13T10:33:52.598400012Z","size_mb":0.0}]},{"name":"mealie_mealie-data","type":"volume","path":"/var/lib/docker/volumes/mealie_mealie-data/_data","last_run":"2026-04-13T19:36:14+00:00","status":"success","snapshot_id":"51351ee4","size_mb":0.5,"snapshots":[{"id":"51351ee4","time":"2026-04-13T19:36:14.677850056Z","size_mb":41.7},{"id":"b0259c85","time":"2026-04-13T19:33:30.038166986Z","size_mb":41.7},{"id":"7f12c438","time":"2026-04-13T10:33:53.535407076Z","size_mb":41.5}]},{"name":"srv-docker","type":"files","path":"/srv/docker","contents":["arcane","bentopdf","dockge","dozzle","gitea","homarr","it-tools","mealie","npm","pihole","uptime-kuma","vpn","wud"],"last_run":"2026-04-13T19:36:24+00:00","status":"success","snapshot_id":"62c1c122","size_mb":16.0,"snapshots":[{"id":"62c1c122","time":"2026-04-13T19:36:24.41582418Z","size_mb":2628.3},{"id":"2dffe8a8","time":"2026-04-13T19:28:25.53752153Z","size_mb":2626.8},{"id":"f0d68fcd","time":"2026-04-13T10:07:12.047191149Z","size_mb":2570.8}]}]};

// ── DATA LOADING ──────────────────────────────────────────────────
async function loadData() {
  try { const r = await fetch('/status.json'); if (!r.ok) throw 0; return await r.json(); }
  catch { return SAMPLE_DATA; }
}

// ── HELPERS ───────────────────────────────────────────────────────
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function cleanName(name,type){if(type==='volume'){const i=name.indexOf('_');let s=i!==-1?name.slice(i+1):name;return s.replace(/-data$/,'');}return name;}
function displayName(name,type){return cleanName(name,type).split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');}
function pad(n){return String(n).padStart(2,'0');}
function formatDate(iso){const d=new Date(iso);const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return `${pad(d.getDate())} ${mo[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;}
function formatSize(mb){if(!mb||mb===0)return '0 MB';if(mb<0.1)return '< 0.1 MB';if(mb<1000)return `${parseFloat(mb.toFixed(1))} MB`;return `${(mb/1024).toFixed(2)} GB`;}
function getHealth(bs){if(bs.some(b=>b.status!=='success'))return 'critical';const stale=25*3600*1000;if(bs.some(b=>Date.now()-new Date(b.last_run).getTime()>stale))return 'warning';return 'healthy';}
function healthLabel(h){return {healthy:'All Systems Healthy',warning:'Backups Stale',critical:'Backup Failure'}[h];}
function ageClass(iso){const h=(Date.now()-new Date(iso).getTime())/3600000;return h<24?'fresh':h<48?'aging':'stale';}
function formatLastRun(iso){const d=new Date(iso);const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())} ${mo[d.getMonth()]}`;}
function totalSnapshots(bs){return bs.reduce((n,b)=>n+(b.snapshots||[]).length,0);}
function mostRecentRun(bs){return bs.reduce((best,b)=>(!best||new Date(b.last_run)>new Date(best))?b.last_run:best,null);}
function ageTooltip(iso){const mins=Math.floor((Date.now()-new Date(iso).getTime())/60000);if(mins<2)return 'Last backed up just now';if(mins<60)return `Last backed up ${mins} minute${mins===1?'':'s'} ago`;const hrs=Math.floor(mins/60);if(hrs<24)return `Last backed up ${hrs} hour${hrs===1?'':'s'} ago`;const days=Math.floor(hrs/24);return `Last backed up ${days} day${days===1?'':'s'} ago`;}
function snapWithCopy(id){return `<span class="snap-wrap"><span class="snap">${esc(id)}</span><button class="snap-copy" onclick="copySnap(event,'${esc(id)}')">${IC.copy}</button></span>`;}
function copyText(text,ok){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(ok).catch(()=>fbCopy(text,ok));}else{fbCopy(text,ok);}}
function fbCopy(text,ok){const t=Object.assign(document.createElement('textarea'),{value:text});Object.assign(t.style,{position:'fixed',opacity:'0'});document.body.appendChild(t);t.select();try{document.execCommand('copy');ok();}catch(e){}document.body.removeChild(t);}

// ── COMMANDS ──────────────────────────────────────────────────────
const NEEDS_SNAP=new Set(['restore-full','restore-temp','list-files']);
function generateCmd(snapId,action){
  const base='sudo restic -r /mnt/backup/restic --password-file /etc/restic-password';
  return {
    'restore-full':`${base} restore ${snapId} --target /`,
    'restore-temp':`${base} restore ${snapId} --target /tmp/restic-restore`,
    'list-files':  `${base} ls ${snapId}`,
    'prune':       `${base} forget --keep-daily 7 --prune`,
    'rebuild':     `${base} rebuild-index`,
    'unlock':      `${base} unlock`
  }[action]||'';
}
function highlight(cmd){
  const acts=new Set(['restore','ls','forget','rebuild-index','unlock']);
  return cmd.split(' ').map(t=>{
    if(t==='sudo')return `<span class="t-sudo">${t}</span>`;
    if(t==='restic')return `<span class="t-cmd">${t}</span>`;
    if(t.startsWith('--')||(t.startsWith('-')&&t.length>1&&t[1]!='/'))return `<span class="t-flag">${t}</span>`;
    if(/^[a-f0-9]{8}$/.test(t))return `<span class="t-snap">${t}</span>`;
    if(t.startsWith('/'))return `<span class="t-path">${t}</span>`;
    if(acts.has(t))return `<span class="t-act">${t}</span>`;
    return t;
  }).join(' ');
}

// ── SVG ICONS ─────────────────────────────────────────────────────
const IC={
  server:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="6" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  disk:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
  clock:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  term:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  copy:`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
  check:`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  folder:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`,
  box:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  chevron:`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  ic_shield:`<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  ic_database:`<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>`,
  ic_clock:`<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  ic_layers:`<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`
};

// ── SERVICE ICONS ─────────────────────────────────────────────────
const SVCICONS={
  arcane:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  bentopdf:      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  dockge:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  dozzle:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r=".5" fill="currentColor"/><circle cx="3" cy="12" r=".5" fill="currentColor"/><circle cx="3" cy="18" r=".5" fill="currentColor"/></svg>`,
  gitea:         `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>`,
  homarr:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  'it-tools':    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
  mealie:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  npm:           `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  pihole:        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  'uptime-kuma': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  vpn:           `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  wud:           `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>`,
  _default:      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`
};

// ── MODULE STATE ──────────────────────────────────────────────────
let _backups=[];
let _modalCmd='';
let _modalSnapId='';

// ── CARD BUILDER ──────────────────────────────────────────────────
function buildCard(b,idx){
  const name=displayName(b.name,b.type);
  const st=b.status==='success'?'success':'failed';
  const age=ageClass(b.last_run);
  const svcKey=b.name.includes('_')?b.name.slice(0,b.name.indexOf('_')):b.name;
  const snapRows=(b.snapshots||[]).map(s=>`<tr class="snap-row${s.id===b.snapshot_id?' snap-latest':''}" onclick="openModal(${idx},'${esc(s.id)}')">`+`<td>${snapWithCopy(s.id)}</td><td>${esc(formatDate(s.time))}</td><td>${esc(formatSize(s.size_mb))}</td></tr>`).join('');
  const snapCount=(b.snapshots||[]).length;
  const tagsHtml=b.contents?`<div class="tags">${b.contents.map(c=>`<span class="tag">${esc(c)}</span>`).join('')}</div>`:'';
  return `<div class="bcard ${st}">
  <div class="bcard-head"><div class="bcard-name-row"><span class="bcard-svc-icon">${SVCICONS[svcKey]||SVCICONS._default}</span><span class="bcard-name">${esc(name)}</span></div><div class="sbadge ${st}"><span class="sdot"></span>${st==='success'?'SUCCESS':'FAILED'}</div></div>
  <div class="bfields">
    <div class="bfield"><span class="blbl">Last run</span><span class="bval">${esc(formatDate(b.last_run))}<span class="age-icon ${age}" data-tip="${esc(ageTooltip(b.last_run))}">${IC.clock}</span></span></div>
    <div class="bfield"><span class="blbl">Snapshot</span><span class="bval">${snapWithCopy(b.snapshot_id)}</span></div>
    <div class="bfield"><span class="blbl">Size</span><span class="bval">${esc(formatSize(b.size_mb))}</span></div>
  </div>
  ${tagsHtml}
  <div class="snap-toggle" onclick="toggleHistory(${idx})">
    <span>Snapshots (${snapCount})</span>
    <span class="snap-chevron" id="chev-${idx}">${IC.chevron}</span>
  </div>
  <div class="snap-hist" id="hist-${idx}" hidden>
    <table class="snap-table">
      <thead><tr><th>ID</th><th>Date / Time</th><th>Size</th></tr></thead>
      <tbody>${snapRows}</tbody>
    </table>
  </div>
  <div class="bcard-footer"><button class="cmd-btn" onclick="openModal(${idx})">${IC.term} Generate Command</button></div>
</div>`;
}

// ── HERO CARD (files backup) ──────────────────────────────────────
function buildHeroCard(b,idx){
  const name=displayName(b.name,b.type);
  const st=b.status==='success'?'success':'failed';
  const age=ageClass(b.last_run);
  const snapRows=(b.snapshots||[]).map(s=>`<tr class="snap-row${s.id===b.snapshot_id?' snap-latest':''}" onclick="openModal(${idx},'${esc(s.id)}')">`+`<td>${snapWithCopy(s.id)}</td><td>${esc(formatDate(s.time))}</td><td class="snap-size">${esc(formatSize(s.size_mb))}</td></tr>`).join('');
  const tilesHtml=b.contents?b.contents.map(c=>`<div class="svc-tile"><div class="svc-tile-icon">${SVCICONS[c]||SVCICONS._default}</div><div class="svc-tile-name">${esc(c)}</div></div>`).join(''):'';
  return `<div class="hero-card ${st}">
  <div class="hero-hdr">
    <div class="hero-hdr-left">
      <span class="hero-name">${esc(name)}</span>
      <div class="hero-sep"></div>
      <span class="sbadge ${st}"><span class="sdot"></span>${st==='success'?'SUCCESS':'FAILED'}</span>
      <div class="hero-sep"></div>
      <span class="age-icon ${age}" data-tip="${esc(ageTooltip(b.last_run))}">${IC.clock}</span>
      ${snapWithCopy(b.snapshot_id)}
      <span style="font-size:12px;color:var(--text-muted)">${esc(formatSize(b.snapshots&&b.snapshots[0]?b.snapshots[0].size_mb:b.size_mb))}</span>
    </div>
    <button class="cmd-btn" style="width:auto;flex-shrink:0" onclick="openModal(${idx})">${IC.term} Generate Command</button>
  </div>
  <div class="hero-panels">
    <div class="hero-panel">
      <div class="panel-lbl">Included Stacks</div>
      <div class="svc-grid">${tilesHtml}</div>
    </div>
    <div class="hero-panel">
      <div class="panel-lbl">Snapshot History</div>
      <table class="snap-table">
        <thead><tr><th>ID</th><th>Date / Time</th><th class="snap-size">Size</th></tr></thead>
        <tbody>${snapRows}</tbody>
      </table>
    </div>
  </div>
</div>`;
}

// ── RENDER ────────────────────────────────────────────────────────
function render(data){
  _backups=data.backups;
  const {repository:repo,last_updated}=data;
  const health=getHealth(_backups);
  const files=_backups.filter(b=>b.type==='files');
  const vols=_backups.filter(b=>b.type==='volume');
  const pct=repo.drive_percent_used;
  const barCol=pct<60?'var(--green)':pct<80?'var(--amber)':'var(--red)';
  const anyFailed=_backups.some(b=>b.status!=='success');
  const statusVal=anyFailed?`${_backups.filter(b=>b.status!=='success').length} Failed`:'All Healthy';
  const statusCls=anyFailed?'sc-red':'sc-green';
  const totalSnaps=totalSnapshots(_backups);
  const lastRun=mostRecentRun(_backups);
  const overviewCollapsed=localStorage.getItem('overview-collapsed')==='1';

  document.getElementById('app').innerHTML=`
<header class="hdr"><div class="wrap"><div class="hdr-row">
  <div class="hdr-brand">
    <div class="brand-icon"><svg width="28" height="28" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><line x1="28" y1="42" x2="52" y2="22" stroke="white" stroke-width="1.5" opacity="0.85"/><line x1="28" y1="42" x2="52" y2="58" stroke="white" stroke-width="1.5" opacity="0.85"/><line x1="28" y1="42" x2="10" y2="52" stroke="white" stroke-width="1.5" opacity="0.8"/><line x1="52" y1="22" x2="52" y2="58" stroke="white" stroke-width="1" opacity="0.6"/><line x1="52" y1="22" x2="70" y2="36" stroke="white" stroke-width="0.8" opacity="0.35"/><circle cx="28" cy="42" r="6" fill="white"/><circle cx="52" cy="22" r="4.5" fill="white"/><circle cx="52" cy="58" r="4.5" fill="white"/><circle cx="10" cy="52" r="3" fill="white" opacity="0.75"/><circle cx="70" cy="36" r="2" fill="white" opacity="0.4"/></svg></div>
    <div class="brand-text"><h1>Backup Status</h1><div class="brand-sub">dashserver &nbsp;·&nbsp; /mnt/backup/restic</div></div>
  </div>
  <div class="hdr-meta">
    <div class="health-badge ${health}"><span class="hdot"></span>${healthLabel(health)}</div>
    <div class="last-upd">Updated <b>${esc(formatDate(last_updated))}</b></div>
  </div>
</div></div></header>

<main><div class="wrap">

<div class="section">
  <div class="sec-label sec-collapsible" onclick="toggleOverview()">Overview<span id="overview-chev" class="sec-chev${overviewCollapsed?'':' open'}">${IC.chevron}</span></div>
  <div id="overview-body" class="overview-body${overviewCollapsed?' collapsed':''}"><div class="overview-body-inner">
  <div class="stat-grid">
    <div class="scard ${statusCls}"><div class="scard-icon">${IC.ic_shield}</div><div class="scard-val">${esc(statusVal)}</div><div class="scard-lbl">Backup Status</div></div>
    <div class="scard sc-blue"><div class="scard-icon">${IC.ic_database}</div><div class="scard-val">${_backups.length}</div><div class="scard-lbl">Backups Monitored</div></div>
    <div class="scard sc-amber"><div class="scard-icon">${IC.ic_clock}</div><div class="scard-val">${esc(formatLastRun(lastRun))}</div><div class="scard-lbl">Last Backup Run</div></div>
    <div class="scard sc-purple"><div class="scard-icon">${IC.ic_layers}</div><div class="scard-val">${totalSnaps}</div><div class="scard-lbl">Total Snapshots</div></div>
  </div>
  <div class="stor-card">
    <div class="stor-path-row"><span style="color:var(--blue)">${IC.disk}</span>${esc(repo.path)}</div>
    <div class="seg-bar">
      <div class="seg-used" style="width:${pct}%;background:${barCol}"><span class="seg-lbl">${repo.drive_used_gb} GB USED</span></div>
      <div class="seg-free"><span class="seg-lbl">${repo.drive_free_gb} GB FREE</span></div>
    </div>
    <div class="stor-total">${repo.drive_total_gb} GB total</div>
  </div>
  </div></div>
</div>

<div class="section">
  <div class="sec-label">Backups</div>
  <div class="sub-hdr"><span style="color:var(--green)">${IC.folder}</span><span class="sub-title">Configuration Files</span><span class="chip">${files.length}</span></div>
  ${files.map(b=>buildHeroCard(b,_backups.indexOf(b))).join('')}
  <div class="sub-hdr" style="margin-top:4px"><span style="color:var(--amber)">${IC.box}</span><span class="sub-title">Docker Volumes</span><span class="chip">${vols.length}</span></div>
  <div class="grid">${vols.map(b=>buildCard(b,_backups.indexOf(b))).join('')}</div>
</div>

</div></main>

<footer><div class="wrap">Restic Backup Dashboard &nbsp;·&nbsp; Data from <code>/var/lib/restic-status.json</code></div></footer>

<div class="modal-overlay" id="modal" onclick="onOverlayClick(event)">
  <div class="modal-box">
    <div class="modal-head">
      <div class="modal-title-row"><span style="color:var(--amber)">${IC.term}</span><span class="modal-title" id="modal-title"></span></div>
      <button class="modal-close" onclick="closeModal()">&#215;</button>
    </div>
    <div class="modal-body">
      <div class="ctrl-grp">
        <label class="ctrl-lbl">Action</label>
        <select class="ctrl-sel" id="modal-act" onchange="updateModalCmd()">
          <option value="restore-full">Restore snapshot</option>
          <option value="restore-temp">Deploy snapshot in new location</option>
          <option value="list-files">List files in snapshot</option>
          <option value="prune">Prune snapshots</option>
          <option value="rebuild">Rebuild repository index</option>
          <option value="unlock">Unlock repository</option>
        </select>
      </div>
      <div class="ctrl-grp" id="modal-snap-grp">
        <label class="ctrl-lbl">Snapshot</label>
        <select class="ctrl-sel" id="modal-snap" onchange="updateModalCmd()"></select>
      </div>
      <div class="cmd-out">
        <div class="cmd-out-bar">
          <span class="cmd-out-lbl">bash</span>
          <button class="copy-btn" id="modal-copy" onclick="modalCopy()">${IC.copy} Copy</button>
        </div>
        <div class="cmd-code" id="modal-cmd"></div>
      </div>
    </div>
  </div>
</div>`;
}

// ── SNAPSHOT HISTORY TOGGLE ───────────────────────────────────────
function toggleHistory(idx){
  const el=document.getElementById('hist-'+idx);
  const ch=document.getElementById('chev-'+idx);
  const open=el.hidden;
  el.hidden=!open;
  if(ch)ch.classList.toggle('open',open);
}

// ── MODAL ─────────────────────────────────────────────────────────
function openModal(idx,snapId){
  const b=_backups[idx];
  if(!b)return;
  document.getElementById('modal-title').textContent=displayName(b.name,b.type);
  document.getElementById('modal-act').value='restore-full';
  const snapSel=document.getElementById('modal-snap');
  snapSel.innerHTML=(b.snapshots||[{id:b.snapshot_id,time:b.last_run,size_mb:b.size_mb}]).map(s=>`<option value="${esc(s.id)}">${esc(s.id)} \u2014 ${esc(formatDate(s.time))} \u2014 ${esc(formatSize(s.size_mb))}</option>`).join('');
  if(snapId)snapSel.value=snapId;
  const copyBtn=document.getElementById('modal-copy');
  copyBtn.className='copy-btn';
  copyBtn.innerHTML=IC.copy+' Copy';
  updateModalCmd();
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow='';
}
function onOverlayClick(e){if(e.target===document.getElementById('modal'))closeModal();}
function updateModalCmd(){
  const action=document.getElementById('modal-act').value;
  const needsSnap=NEEDS_SNAP.has(action);
  const snapGrp=document.getElementById('modal-snap-grp');
  if(snapGrp)snapGrp.style.display=needsSnap?'':'none';
  const snapId=needsSnap?(document.getElementById('modal-snap').value||''):'';
  _modalCmd=generateCmd(snapId,action);
  document.getElementById('modal-cmd').innerHTML=highlight(_modalCmd);
}
function modalCopy(){
  const btn=document.getElementById('modal-copy');
  const ok=()=>{btn.className='copy-btn copied';btn.innerHTML=IC.check+' Copied!';setTimeout(()=>{btn.className='copy-btn';btn.innerHTML=IC.copy+' Copy';},2000);};
  copyText(_modalCmd,ok);
}
function copySnap(e,id){
  e.stopPropagation();
  const btn=e.currentTarget;
  const ok=()=>{btn.innerHTML=IC.check;btn.classList.add('copied');setTimeout(()=>{btn.innerHTML=IC.copy;btn.classList.remove('copied');},1000);};
  copyText(id,ok);
}
function toggleOverview(){
  const body=document.getElementById('overview-body');
  const chev=document.getElementById('overview-chev');
  const nowCollapsed=body.classList.toggle('collapsed');
  chev.classList.toggle('open',!nowCollapsed);
  localStorage.setItem('overview-collapsed',nowCollapsed?'1':'0');
}
function initTooltip(){
  const tip=document.createElement('div');
  tip.id='g-tip';tip.className='g-tip';
  document.body.appendChild(tip);
  document.addEventListener('mouseover',e=>{
    const el=e.target.closest('[data-tip]');
    if(el){tip.textContent=el.dataset.tip;const r=el.getBoundingClientRect();tip.style.left=(r.left+r.width/2)+'px';tip.style.top=(r.top-8)+'px';tip.classList.add('visible');}
    else{tip.classList.remove('visible');}
  });
}

// ── ESCAPE KEY CLOSES MODAL ───────────────────────────────────────
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

// ── EXPOSE GLOBALS & INIT ─────────────────────────────────────────
window.toggleHistory=toggleHistory;
window.openModal=openModal;
window.closeModal=closeModal;
window.onOverlayClick=onOverlayClick;
window.updateModalCmd=updateModalCmd;
window.modalCopy=modalCopy;
window.copySnap=copySnap;
window.toggleOverview=toggleOverview;
initTooltip();
loadData().then(render);
