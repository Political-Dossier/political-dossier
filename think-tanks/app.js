(function(){
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DI = {}; DIMS.forEach((d,i) => DI[d.k] = i);
const BYID = {}; ORGS.forEach(o => BYID[o.id] = o);
const PCOL = {D:'var(--dem)', R:'var(--rep)', X:'var(--cross)'};
const PNAME = {D:'Democratic country', R:'Republican country', X:'Bridge isles'};
const TRL = {up:'rising', steady:'steady', down:'fading', turbulent:'in turmoil'};
const scored = o => o.sc.some(v => v > 0);
const short = o => o.s || o.n;
const val = (o,k) => o.sc[DI[k]];
const fill = (el, items, sel) => { el.innerHTML = items.map(it => `<option value="${esc(it.v)}"${it.v===sel?' selected':''}>${esc(it.t)}</option>`).join(''); };

const PLAB = {dcenter:'Pragmatic Center', dhet:'Realignment Center', dabund:'Abundance', dprog:'Progressive Economics', dleft:'Movement Left', dinst:'Institutional Progressives', dlegal:'Democracy & Law', dsec:'National Security', dclimate:'Climate', dstate:'State & Talent', dlabor:'Labor', dmoney:'Donor Networks', dmedia:'Idea Outlets',
  rlib:'Libertarian', rbiz:'Business Right', rstate:'State Policy', rinst:'Institutionalists', rnewright:'New Right', ramfirst:'America First', rtech:'Tech Right', recon:'Nationalist Trade', renergy:'Energy', rsocial:'Social Conservatives', rimm:'Restrictionists', rhawk:'Hawks', rrestraint:'Restrainers', rlegal:'Legal Right', rmoney:'Donor Networks', rmedia:'Media & Youth', xbridge:'Bridge Isles'};

/* =================== GEOGRAPHY =================== */
const W = 1560, H = 940;
function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h2(i,j){ let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967295; }
function vn(x,y){ const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, s = t => t*t*(3-2*t); const u = s(fx), v = s(fy);
  return (h2(i,j)*(1-u) + h2(i+1,j)*u)*(1-v) + (h2(i,j+1)*(1-u) + h2(i+1,j+1)*u)*v; }
const fbm = (x,y) => vn(x,y)*.6 + vn(x*2.2+7,y*2.2+3)*.28 + vn(x*4.7+1,y*4.7+9)*.12;
const LANDS = [
  {id:'D', cx:360, cy:470, rx:300, ry:380, amp:.36},
  {id:'R', cx:1205, cy:470, rx:300, ry:380, amp:.3},
  {id:'X', cx:782, cy:268, rx:36, ry:30, amp:.5},
  {id:'X', cx:770, cy:470, rx:44, ry:38, amp:.5},
  {id:'X', cx:786, cy:668, rx:34, ry:28, amp:.5}
];
function landAt(x,y){
  for (const L of LANDS){
    const d = Math.hypot((x-L.cx)/L.rx, (y-L.cy)/L.ry);
    const thr = 1 + (fbm(x/105 + L.cx/50, y/105) - .5) * L.amp;
    if (d < thr) return L.id;
  }
  return null;
}
const SEEDS = {
  dleft:[115,440], dmedia:[180,225], dprog:[321,335], dlabor:[180,620], dclimate:[290,745], dinst:[395,470], dlegal:[330,605], dmoney:[365,165], dsec:[485,245], dhet:[560,355], dcenter:[585,525], dabund:[545,695], dstate:[445,800],
  rtech:[1014,300], rbiz:[991,530], rinst:[1098,410], rlib:[1046,705], rstate:[1181,795], renergy:[1293,760], rhawk:[1153,205], rlegal:[1274,300], rnewright:[1223,480], ramfirst:[1349,470], recon:[1311,615], rsocial:[1428,345], rimm:[1440,590], rrestraint:[1363,215], rmoney:[1242,130], rmedia:[1381,690],
  xbridge:[795,470]
};
const CCOUNT = {}; ORGS.forEach(o => CCOUNT[o.c] = (CCOUNT[o.c]||0) + 1);
const WASH = {D:['#c6d1d9','#b8c8cb','#cdcedc','#c2d0c2','#d3d6dd','#bac4d4','#c9d6d0'], R:['#e0c3b8','#d9bfc4','#e3ccb3','#d6b9ac','#e2cac1','#d5c3ad','#dcc0b0'], X:['#e2d19e']};
const PWASH = {}; { const idx = {D:0,R:0,X:0}; Object.keys(CAMPS).forEach(k => { const e = CAMPS[k].e; PWASH[k] = WASH[e][idx[e]++ % WASH[e].length]; }); }

const GEO = (function build(){
  const r = rng(1789), pts = [], S = 14;
  for (let y = -3*S; y < H + 3*S; y += S) for (let x = -3*S; x < W + 3*S; x += S) pts.push([x + (r()-.5)*S*.8, y + (r()-.5)*S*.8]);
  const del = d3.Delaunay.from(pts), vor = del.voronoi([-60,-60,W+60,H+60]);
  const n = pts.length, land = new Array(n), prov = new Array(n);
  for (let i = 0; i < n; i++){
    const [x,y] = pts[i]; const L = landAt(x,y); land[i] = L;
    if (!L){ prov[i] = null; continue; }
    if (L === 'X'){ prov[i] = 'xbridge'; continue; }
    let best = null, bd = Infinity;
    for (const k in SEEDS){ if (CAMPS[k].e !== L) continue; const [sx,sy] = SEEDS[k];
      const d = (x-sx)*(x-sx) + (y-sy)*(y-sy) - 1500 * Math.sqrt(CCOUNT[k]||1) * 6; if (d < bd){ bd = d; best = k; } }
    prov[i] = best;
  }
  // coast distance (land and sea)
  const cd = new Array(n).fill(Infinity), q = [];
  for (let i = 0; i < n; i++) for (const j of del.neighbors(i)) if (!!land[i] !== !!land[j]){ cd[i] = 0; q.push(i); break; }
  for (let h = 0; h < q.length; h++){ const i = q[h]; for (const j of del.neighbors(i)) if (!!land[j] === !!land[i] && cd[j] === Infinity){ cd[j] = cd[i] + 1; q.push(j); } }
  // edges
  const {triangles, halfedges} = del, cc = vor.circumcenters; let coast = {D:'',R:'',X:''}, border = '';
  for (let e = 0; e < halfedges.length; e++){
    const o = halfedges[e]; if (o < e) continue;
    const p = triangles[e], qq = triangles[e % 3 === 2 ? e - 2 : e + 1];
    const t1 = Math.floor(e/3), t2 = Math.floor(o/3);
    if (Math.hypot(cc[2*t1]-cc[2*t2], cc[2*t1+1]-cc[2*t2+1]) > 60) continue;
    const seg = `M${cc[2*t1].toFixed(1)},${cc[2*t1+1].toFixed(1)}L${cc[2*t2].toFixed(1)},${cc[2*t2+1].toFixed(1)}`;
    if (!!land[p] !== !!land[qq]) coast[land[p] || land[qq]] += seg;
    else if (land[p] && prov[p] !== prov[qq]) border += seg;
  }
  // province paths + cells
  const P = {};
  for (let i = 0; i < n; i++){
    if (!prov[i]) continue;
    const poly = vor.cellPolygon(i); if (!poly) continue;
    const k = prov[i]; P[k] = P[k] || {d:'', cells:[]};
    P[k].d += 'M' + poly.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';
    P[k].cells.push(i);
  }
  // province label anchors: deepest interior cell near centroid
  Object.keys(P).forEach(k => {
    const cs = P[k].cells; let mx = 0, my = 0; cs.forEach(i => { mx += pts[i][0]; my += pts[i][1]; }); mx /= cs.length; my /= cs.length;
    let best = cs[0], bs = -Infinity;
    cs.forEach(i => { const s = Math.min(cd[i], 6) * 12 - Math.hypot(pts[i][0]-mx, pts[i][1]-my); if (s > bs){ bs = s; best = i; } });
    P[k].lab = pts[best]; P[k].c = [mx,my];
  });
  // place towns
  const POS = {};
  Object.keys(P).forEach(k => {
    const orgs = ORGS.filter(o => o.c === k).sort((a,b) => (b.gi+b.ii+b.pi) - (a.gi+a.ii+a.pi));
    const cs = P[k].cells.filter(i => cd[i] >= 1); const placed = [];
    const [lx,ly] = P[k].lab;
    orgs.forEach(o => {
      let best = null, bs = -Infinity;
      cs.forEach(i => {
        const [x,y] = pts[i];
        let md = 90; placed.forEach(p => { md = Math.min(md, Math.hypot(x-p[0], y-p[1])); });
        const labClear = Math.abs(y - ly) < 28 && Math.abs(x - lx) < 88 ? -60 : 0;
        const s = Math.min(md, 58) * 1.6 - Math.hypot(x - P[k].c[0], y - P[k].c[1]) * .35 + Math.min(cd[i],3) * 4 + labClear;
        if (s > bs){ bs = s; best = i; }
      });
      const p = pts[best]; placed.push(p); POS[o.id] = p;
    });
  });
  // sea waves
  const waves = []; const r2 = rng(42);
  for (let t = 0; t < 4000 && waves.length < 70; t++){ const i = Math.floor(r2() * n); if (!land[i] && cd[i] >= 4 && cd[i] < 12) waves.push(pts[i]); }
  return {pts, P, coast, border, POS, waves};
})();

const COLS = 'ABCDEFGHIJKLM';
const gridRef = id => { const p = GEO.POS[id]; if (!p) return ''; return COLS[Math.min(12, Math.floor(p[0] / 120))] + (1 + Math.min(7, Math.floor(p[1] / 117.5))); };

function symbol(o){
  const g = o.gi;
  if (g >= 5) return '<circle class="ring" r="10"/><circle class="sym" r="7"/><circle class="dot" r="4.2"/>';
  if (g === 4) return '<circle class="ring" r="9"/><circle class="sym" r="6"/><circle class="dot" r="2.3"/>';
  if (g === 3) return '<circle class="ring" r="8"/><circle class="dot" r="4.3" style="stroke:var(--paper);stroke-width:1"/>';
  return '<circle class="ring" r="7.5"/><circle class="sym" r="3.6"/>';
}

/* Build an SVG map into an element */
function buildMap(svg, opts){
  const M = 26;
  svg.setAttribute('viewBox', `${-M} ${-M} ${W + 2*M} ${H + 2*M}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const uid = svg.id;
  let s = `<defs>
    <clipPath id="${uid}-clip"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
    <pattern id="${uid}-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="9" stroke="#a2261d" stroke-width="1.6" opacity=".55"/></pattern>
  </defs>`;
  s += `<g clip-path="url(#${uid}-clip)"><g class="vp" id="${uid}-vp">`;
  s += `<rect class="sea" x="-400" y="-400" width="${W+800}" height="${H+800}"/>`;
  const allCoast = GEO.coast.D + GEO.coast.R + GEO.coast.X;
  s += `<path class="ripple" d="${allCoast}" stroke="var(--ink)" stroke-opacity=".16" stroke-width="31"/>`;
  s += `<path class="ripple" d="${allCoast}" stroke="var(--sea)" stroke-width="28.5"/>`;
  s += `<path class="ripple" d="${allCoast}" stroke="var(--ink)" stroke-opacity=".18" stroke-width="19"/>`;
  s += `<path class="ripple" d="${allCoast}" stroke="var(--sea)" stroke-width="16.5"/>`;
  s += `<path class="ripple" d="${allCoast}" stroke="var(--ink)" stroke-opacity=".22" stroke-width="9"/>`;
  s += `<path class="ripple" d="${allCoast}" stroke="var(--sea)" stroke-width="6.8"/>`;
  GEO.waves.forEach(([x,y]) => { s += `<path class="wave" d="M${(x-9).toFixed(1)},${y.toFixed(1)}q4.5,-4 9,0t9,0"/>`; });
  Object.keys(GEO.P).forEach(k => { s += `<path class="prov" data-prov="${k}" d="${GEO.P[k].d}" fill="${PWASH[k]}" stroke="${PWASH[k]}" stroke-width=".9"/>`; });
  s += `<g id="${uid}-incog"></g>`;
  s += `<path class="border" d="${GEO.border}"/>`;
  ['D','R','X'].forEach(e => { s += `<path class="ripple" d="${GEO.coast[e]}" stroke="${PCOL[e]}" stroke-opacity=".5" stroke-width="5"/>`; });
  s += `<path class="coast" d="${allCoast}"/>`;
  Object.keys(GEO.P).forEach(k => {
    const [x,y] = GEO.P[k].lab; const words = PLAB[k].toUpperCase().split(' ');
    const fs = Math.max(13, Math.min(19, 7 + Math.sqrt(GEO.P[k].cells.length) * .55));
    let lines = [PLAB[k].toUpperCase()];
    if (PLAB[k].length > 13 && words.length > 1){ const mid = Math.ceil(words.length/2); lines = [words.slice(0,mid).join(' '), words.slice(mid).join(' ')]; }
    s += `<text class="provlab" data-prov="${k}" x="${x.toFixed(1)}" y="${(y - (lines.length-1)*fs*.55).toFixed(1)}" font-size="${fs.toFixed(1)}">${lines.map((l,i) => `<tspan x="${x.toFixed(1)}" dy="${i?fs*1.1:0}">${esc(l)}</tspan>`).join('')}</text>`;
  });
  s += `<g id="${uid}-traj"></g><g id="${uid}-towns">`;
  ORGS.forEach(o => { const [x,y] = GEO.POS[o.id]; s += `<g class="town" data-id="${o.id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})" tabindex="${opts.interactive?0:-1}" role="${opts.interactive?'button':'img'}" aria-label="${esc(o.n)}">${symbol(o)}</g>`; });
  s += `</g><g id="${uid}-labels"></g>`;
  s += `</g></g>`;
  // frame, grid refs, cartouches, compass, sea names (fixed, not zoomed)
  s += `<rect class="frame" x="0" y="0" width="${W}" height="${H}" stroke-width="1.6"/><rect class="frame" x="-6" y="-6" width="${W+12}" height="${H+12}" stroke-width=".7"/>`;
  for (let c = 0; c < 13; c++){ const x = c*120 + 60; s += `<text class="gridlab" x="${x}" y="-11">${COLS[c]}</text><text class="gridlab" x="${x}" y="${H+22}">${COLS[c]}</text>`; if (c) s += `<line x1="${c*120}" y1="-6" x2="${c*120}" y2="0" stroke="var(--ink)"/><line x1="${c*120}" y1="${H}" x2="${c*120}" y2="${H+6}" stroke="var(--ink)"/>`; }
  for (let rr = 0; rr < 8; rr++){ const y = rr*117.5 + 63; s += `<text class="gridlab" x="-15" y="${y}">${rr+1}</text><text class="gridlab" x="${W+15}" y="${y}">${rr+1}</text>`; if (rr) s += `<line x1="-6" y1="${rr*117.5}" x2="0" y2="${rr*117.5}" stroke="var(--ink)"/><line x1="${W}" y1="${rr*117.5}" x2="${W+6}" y2="${rr*117.5}" stroke="var(--ink)"/>`; }
  const dN = ORGS.filter(o => o.e==='D').length, rN = ORGS.filter(o => o.e==='R').length, xN = ORGS.filter(o => o.e==='X').length;
  const cart = (x, y, w, t1, t2, col) => `<g class="cart"><rect class="cartbox" x="${x}" y="${y}" width="${w}" height="62" stroke-width="1.2"/><rect x="${x+4}" y="${y+4}" width="${w-8}" height="54" fill="none" stroke="${col}" stroke-width=".8"/><text x="${x+w/2}" y="${y+28}" text-anchor="middle" style="font-family:var(--caps);letter-spacing:.24em;font-size:17px">${t1}</text><text x="${x+w/2}" y="${y+47}" text-anchor="middle" style="font-family:var(--body);font-style:italic;font-size:14px;fill:var(--muted)">${t2}</text></g>`;
  s += cart(18, 18, 252, 'THE DEMOCRATIC', `country · ${dN} towns in 13 provinces`, 'var(--dem)');
  s += cart(W - 270, 18, 252, 'THE REPUBLICAN', `country · ${rN} towns in 16 provinces`, 'var(--rep)');
  s += `<text class="seaname" x="${782}" y="150" font-size="17">THE</text><text class="seaname" x="${782}" y="174" font-size="22">CROSSING</text><text class="seaname" x="782" y="780" font-size="14" style="letter-spacing:.12em">${xN} bridge isles</text>`;
  // compass rose
  const cx = 92, cy = H - 92;
  s += `<g transform="translate(${cx},${cy})" opacity=".85"><circle r="44" fill="none" stroke="var(--ink)" stroke-width=".8"/><circle r="38" fill="none" stroke="var(--ink)" stroke-width=".5"/>
    <path d="M0,-52 L7,-7 L0,0 Z" fill="var(--ink)"/><path d="M0,-52 L-7,-7 L0,0 Z" fill="var(--card)" stroke="var(--ink)" stroke-width=".8"/>
    <path d="M0,52 L7,7 L0,0 Z" fill="var(--card)" stroke="var(--ink)" stroke-width=".8"/><path d="M0,52 L-7,7 L0,0 Z" fill="var(--ink)"/>
    <path d="M52,0 L7,7 L0,0 Z" fill="var(--ink)"/><path d="M52,0 L7,-7 L0,0 Z" fill="var(--card)" stroke="var(--ink)" stroke-width=".8"/>
    <path d="M-52,0 L-7,-7 L0,0 Z" fill="var(--ink)"/><path d="M-52,0 L-7,7 L0,0 Z" fill="var(--card)" stroke="var(--ink)" stroke-width=".8"/>
    <text y="-58" text-anchor="middle" style="font-family:var(--caps);font-size:13px;fill:var(--ink)">Insider</text>
    <text y="70" text-anchor="middle" style="font-family:var(--caps);font-size:13px;fill:var(--ink)">Insurgent</text></g>`;
  // influence scale
  const sx = W - 300, sy = H - 96;
  s += `<g transform="translate(${sx},${sy})"><rect class="cartbox" x="0" y="0" width="282" height="78" stroke-width="1"/><text x="141" y="20" text-anchor="middle" style="font-family:var(--caps);letter-spacing:.2em;font-size:13px;fill:var(--ink)">SCALE OF GOVERNING INFLUENCE</text>`;
  [[1,'slight'],[3,'regular'],[4,'strong'],[5,'capital']].forEach(([g,t],i) => { const x = 36 + i*70; s += `<g class="town" transform="translate(${x},44)" style="pointer-events:none">${symbol({gi:g})}</g><text x="${x}" y="68" text-anchor="middle" style="font-family:var(--body);font-style:italic;font-size:13.5px;fill:var(--muted)">${t}</text>`; });
  s += `</g>`;
  svg.innerHTML = s;
  return {
    svg, vp: $(uid + '-vp'), labels: $(uid + '-labels'), incog: $(uid + '-incog'), traj: $(uid + '-traj'),
    towns: Array.from(svg.querySelectorAll(`#${uid}-towns .town`)),
    provs: Array.from(svg.querySelectorAll('.prov')), provlabs: Array.from(svg.querySelectorAll('.provlab')), uid, k: 1
  };
}

/* Apply a state: {focus:[camps], hl:[ids], a:[ids], b:[ids], incog:fnKey, traj:bool, all:bool} */
function applyState(m, st){
  const focus = st.focus ? new Set(st.focus) : null, hl = new Set(st.hl || []), A = new Set(st.a || []), B = new Set(st.b || []);
  const anyMark = hl.size || A.size || B.size;
  m.provs.forEach(p => p.classList.toggle('fade', !!focus && !focus.has(p.dataset.prov)));
  m.provlabs.forEach(p => p.classList.toggle('fade', !!focus && !focus.has(p.dataset.prov)));
  const incogSet = new Set();
  let ihtml = '';
  if (st.incog){
    Object.keys(GEO.P).forEach(k => {
      if (!ORGS.some(o => o.c === k && o.fn.includes(st.incog))){
        incogSet.add(k);
        ihtml += `<path d="${GEO.P[k].d}" fill="url(#${m.uid}-hatch)"/>`;
        const [x,y] = GEO.P[k].lab; ihtml += `<text class="incog" x="${x.toFixed(1)}" y="${(y+24).toFixed(1)}" font-size="14">terra incognita</text>`;
      }
    });
  }
  m.incog.innerHTML = ihtml;
  m.towns.forEach(t => {
    const o = BYID[t.dataset.id];
    const inFocus = !focus || focus.has(o.c);
    const fnHit = st.incog && o.fn.includes(st.incog);
    t.classList.toggle('hl', hl.has(o.id) || !!fnHit);
    t.classList.toggle('sa', A.has(o.id)); t.classList.toggle('sb', B.has(o.id));
    t.classList.toggle('sel', o.id === st.sel);
    const marked = hl.has(o.id) || A.has(o.id) || B.has(o.id) || fnHit;
    t.classList.toggle('fade', !inFocus || (anyMark && !marked) || (!!st.incog && !fnHit && !anyMark && false));
  });
  // trajectory marks
  let th = '';
  if (st.traj){
    ORGS.forEach(o => { if (o.tr === 'steady') return; const [x,y] = GEO.POS[o.id];
      const ch = o.tr === 'up' ? '▲' : o.tr === 'down' ? '▼' : '✱'; const col = o.tr === 'up' ? 'var(--sideA)' : o.tr === 'down' ? 'var(--hl)' : 'var(--sideB)';
      th += `<text class="traj" x="${(x - 11).toFixed(1)}" y="${(y - 7).toFixed(1)}" font-size="11" fill="${col}" text-anchor="end">${ch}</text>`; });
  }
  m.traj.innerHTML = th;
  m.state = st;
  placeLabels(m);
}

/* Labels with collision avoidance in screen space */
function placeLabels(m){
  const st = m.state || {}, k = m.k || 1;
  const fs = 13.5 / Math.pow(k, .8);
  const marked = id => (st.hl||[]).includes(id) || (st.a||[]).includes(id) || (st.b||[]).includes(id) || id === st.sel || (st.incog && BYID[id].fn.includes(st.incog));
  const focus = st.focus ? new Set(st.focus) : null;
  const want = ORGS.filter(o => {
    if (focus && !focus.has(o.c) && !marked(o.id)) return false;
    if (marked(o.id) || st.all) return true;
    const imp = o.gi + o.ii + o.pi;
    return k >= 2.2 || imp >= (k >= 1.5 ? 7 : 10);
  }).sort((a,b) => (marked(b.id) - marked(a.id)) || ((b.gi+b.ii+b.pi) - (a.gi+a.ii+a.pi)));
  const placed = []; let h = '';
  // reserve town symbols
  ORGS.forEach(o => { const [x,y] = GEO.POS[o.id]; const r = 5 / k; placed.push({x0:x-r, y0:y-r, x1:x+r, y1:y+r}); });
  want.forEach(o => {
    const [x,y] = GEO.POS[o.id]; const txt = short(o);
    const w = txt.length * fs * .47 + 2/k, hh = fs * 1.05, off = 9 / k;
    const cands = [[x+off, y+fs*.35, 'start'], [x-off, y+fs*.35, 'end'], [x, y-off-2/k, 'middle'], [x, y+off+fs*.85, 'middle']];
    for (const [lx, ly, anc] of cands){
      const x0 = anc === 'start' ? lx : anc === 'end' ? lx - w : lx - w/2;
      const b = {x0, y0: ly - fs*.85, x1: x0 + w, y1: ly - fs*.85 + hh};
      if (placed.some(p => !(b.x1 < p.x0 || b.x0 > p.x1 || b.y1 < p.y0 || b.y0 > p.y1))) continue;
      placed.push(b);
      h += `<text class="tlab${marked(o.id)?' hl':''}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anc}" font-size="${fs.toFixed(2)}" style="stroke-width:${(3.2/Math.pow(k,.8)).toFixed(2)}px">${esc(txt)}</text>`;
      break;
    }
  });
  m.labels.innerHTML = h;
  // keep symbol size readable when zoomed
  const ss = 1 / Math.pow(k, .55);
  m.towns.forEach(t => { const [x,y] = GEO.POS[t.dataset.id]; t.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${ss.toFixed(3)})`); });
}

/* =================== STORY =================== */
const STEPS = [
  {no:'I', t:'Two countries, thirty provinces', p:'Each party is drawn as its own country, divided into provinces by faction. Every town is an organization; the heavier the mark, the more governing power it holds. 121 institutions were surveyed as of November 15, 2026.', key:'Read the provinces as factions, not ideology scores. Distance across a border is a real argument.',
   st:{}, view:null},
  {no:'II', t:'The Democratic country has three live borders', p:'Markets against economic power, building against precaution, insiders against insurgents. After the midterm sweep, Third Way, Welcome and the New Dems hold the eastern coast; DSA, the Working Families Party and Justice Democrats push in from the west.', key:'Third Way has committed $15 million through 2028 to contest that western border.',
   st:{focus:['dcenter','dhet','dleft','dprog','dabund','dinst'], hl:['thirdway','welcome','newdems','dsa','wfp','jd','searchlight','majdems','roosevelt']}, view:[360,470,1.55]},
  {no:'III', t:'The right moved its capital', p:'Heritage built Project 2025, then split: its traditionalists decamped to Pence\'s Advancing American Freedom. AFPI and American Moment now hold the personnel, American Compass holds the economic ideas, and the Iran war has divided the hawks of the north from the restrainers of the northeast.', key:'Rockbridge, the Vance-aligned donor network, sits above it all.',
   st:{focus:['ramfirst','rnewright','rinst','rhawk','rrestraint','rmoney'], hl:['heritage','aafreedom','afpi','amoment','compass','fdd','tcn','rockbridge']}, view:[1200,430,1.5]},
  {no:'IV', t:'The crossing', p:'Both countries now ask the same question: why can\'t America build? Abundance Democrats and the tech right meet on a handful of islands, the Institute for Progress, Niskanen and the bipartisan Build America Caucus among them.', key:'The answers still diverge on labor, markets and corporate power.',
   st:{focus:['dabund','rtech','xbridge','dcenter'], hl:['ifp','niskanen','bac','inclab','fai','abinst','breakthrough','abnet']}, view:[780,470,1.65]},
  {no:'V', t:'Uncharted ground', p:'Hatched provinces have no organization doing the job selected here: placing junior staff into government. The right built American Moment, CPI and the Leadership Institute. Most Democratic provinces have nothing comparable.', key:'Use the layers on the full map below to chart other gaps: state networks, courts, polling.',
   st:{incog:'personnel'}, view:null}
];
$('steps').innerHTML = STEPS.map((s,i) => `<div class="step${i===0?' on':''}" data-step="${i}"><div class="stepcard">
  <div class="no">${s.no} of ${STEPS.length}</div><h3>${esc(s.t)}</h3><p>${esc(s.p)}</p><p class="key">${esc(s.key)}</p>
  ${i === STEPS.length-1 ? '<a class="toexplore" href="#explore" id="goexplore">Open the full map ↓</a>' : ''}</div></div>`).join('');
const SM = buildMap($('storymap'), {interactive:false});
$('storymap').setAttribute('preserveAspectRatio','xMidYMin meet');
function viewTo(m, v){
  if (!v){ m.vp.style.transform = 'translate(0px,0px) scale(1)'; m.k = 1; return; }
  const [x,y,k] = v; m.vp.style.transform = `translate(${(W/2 - x*k).toFixed(1)}px,${(H/2 - y*k).toFixed(1)}px) scale(${k})`; m.k = k;
}
let curStep = -1;
function goStep(i){ if (i === curStep) return; curStep = i; const s = STEPS[i]; viewTo(SM, s.view); applyState(SM, s.st);
  document.querySelectorAll('.step').forEach(el => el.classList.toggle('on', +el.dataset.step === i)); }
goStep(0);
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) goStep(+e.target.dataset.step); }); }, {rootMargin:'-40% 0px -50% 0px'});
  document.querySelectorAll('.step').forEach(el => io.observe(el));
}
$('goexplore').addEventListener('click', e => { e.preventDefault(); $('explore').scrollIntoView({behavior:'smooth'}); });

/* =================== EXPLORER =================== */
const BM = buildMap($('bigmap'), {interactive:true});
BM.vp.classList.add('live');
const EX = {sel:null, fault:'', incog:'', traj:false, all:false};
function exState(){
  const st = {sel:EX.sel, traj:EX.traj, all:EX.all, incog:EX.incog || null};
  if (EX.fault){ const [p,i] = EX.fault.split(':'); const f = FAULTS[p][+i]; st.a = f.a.ids; st.b = f.b.ids; }
  return st;
}
function refreshBig(){ applyState(BM, exState()); captionFor(); }
const zoom = d3.zoom().scaleExtent([1, 7]).translateExtent([[-200,-200],[W+200,H+200]])
  .filter(e => (e.type === 'wheel' ? (e.ctrlKey || e.metaKey) : !e.button))
  .on('zoom', e => { BM.vp.setAttribute('transform', e.transform.toString()); BM.k = e.transform.k; })
  .on('end', () => placeLabels(BM));
const bsel = d3.select('#bigmap'); bsel.call(zoom).on('dblclick.zoom', null);
$('zin').onclick = () => bsel.transition().duration(350).call(zoom.scaleBy, 1.6);
$('zout').onclick = () => bsel.transition().duration(350).call(zoom.scaleBy, 1/1.6);
$('zreset').onclick = () => bsel.transition().duration(450).call(zoom.transform, d3.zoomIdentity);
function zoomToOrg(id){ const [x,y] = GEO.POS[id]; const k = 2.6; bsel.transition().duration(650).call(zoom.transform, d3.zoomIdentity.translate(W/2 - x*k, H/2 - y*k).scale(k)); }

// legend
$('legend').innerHTML = `
  <svg width="22" height="16"><rect width="22" height="16" fill="${PWASH.dinst}" stroke="var(--dem)" stroke-width="2"/></svg><span>Democratic province</span>
  <svg width="22" height="16"><rect width="22" height="16" fill="${PWASH.rnewright}" stroke="var(--rep)" stroke-width="2"/></svg><span>Republican province</span>
  <svg width="22" height="16"><rect width="22" height="16" fill="${PWASH.xbridge}" stroke="var(--cross)" stroke-width="2"/></svg><span>Bridge isle (cross-party)</span>
  <svg width="22" height="16"><line x1="0" y1="8" x2="22" y2="8" stroke="var(--ink)" stroke-dasharray="1.5 3" stroke-linecap="round"/></svg><span>Faction border</span>
  <svg width="22" height="16" viewBox="-11 -8 22 16"><g class="town">${symbol({gi:5})}</g></svg><span>Capital: top governing influence</span>
  <svg width="22" height="16" viewBox="-11 -8 22 16"><g class="town">${symbol({gi:3})}</g></svg><span>Town: regular access</span>`;
$('legend').classList.add('mapsvg');
$('orgnames').innerHTML = ORGS.map(o => `<option value="${esc(o.n)}">`).join('');
$('find').addEventListener('change', e => {
  const v = e.target.value.trim().toLowerCase(); const o = ORGS.find(x => x.n.toLowerCase() === v || short(x).toLowerCase() === v) || ORGS.find(x => x.n.toLowerCase().includes(v));
  if (o){ EX.sel = o.id; refreshBig(); zoomToOrg(o.id); }
});
const fopts = [{v:'', t:'None'}];
[['D','Democratic'],['R','Republican'],['X','Across the strait']].forEach(([p,lab]) => FAULTS[p].forEach((f,i) => fopts.push({v:`${p}:${i}`, t:`${lab}: ${f.t}`})));
fill($('fault'), fopts, '');
fill($('uncharted'), [{v:'', t:'None'}].concat(Object.keys(FUNCS).map(k => ({v:k, t:FUNCS[k]}))), '');
$('fault').addEventListener('change', e => { EX.fault = e.target.value; refreshBig(); });
$('uncharted').addEventListener('change', e => { EX.incog = e.target.value; refreshBig(); });
$('trajbox').addEventListener('change', e => { EX.traj = e.target.checked; refreshBig(); });
$('alllabels').addEventListener('change', e => { EX.all = e.target.checked; refreshBig(); });
function captionFor(){
  const c = $('caption');
  if (EX.fault){ const [p,i] = EX.fault.split(':'); const f = FAULTS[p][+i];
    c.innerHTML = `<h3>${esc(f.t)}</h3><p style="margin:0;font-style:italic">${esc(f.q)}</p><div class="sides"><span><i class="sw" style="border-color:var(--sideA)"></i>${esc(f.a.label)}</span><span><i class="sw" style="border-color:var(--sideB)"></i>${esc(f.b.label)}</span></div><p style="margin:8px 0 0"><span class="caps" style="font-size:13px;color:var(--hl)">Where it stands </span>${esc(f.now)}</p>`;
    c.classList.add('on');
  } else if (EX.incog){
    const empty = Object.keys(GEO.P).filter(k => !ORGS.some(o => o.c === k && o.fn.includes(EX.incog)));
    c.innerHTML = `<h3>Uncharted: ${esc(FUNCS[EX.incog])}</h3><p style="margin:0">${empty.length} of ${Object.keys(GEO.P).length} provinces have no organization doing this. Towns that do it are ringed in red.</p>`;
    c.classList.add('on');
  } else c.classList.remove('on');
}
const tip = $('tip');
$('bigmap').addEventListener('mousemove', e => {
  const t = e.target.closest('.town[data-id]'); if (!t){ tip.style.display = 'none'; return; }
  const o = BYID[t.dataset.id]; const box = $('mapframe').getBoundingClientRect();
  tip.innerHTML = `<b>${esc(o.n)}</b><br><i>${esc(PLAB[o.c])} · ${gridRef(o.id)}</i><br>${esc(TYPES[o.t])}`;
  let l = e.clientX - box.left + 14; if (l > box.width - 270) l = e.clientX - box.left - 270;
  tip.style.left = l + 'px'; tip.style.top = (e.clientY - box.top + 14) + 'px'; tip.style.display = 'block';
});
$('bigmap').addEventListener('mouseleave', () => tip.style.display = 'none');
$('bigmap').addEventListener('click', e => { const t = e.target.closest('.town[data-id]'); if (t){ EX.sel = t.dataset.id; refreshBig(); openOrg(t.dataset.id); } });
$('bigmap').addEventListener('keydown', e => { const t = e.target.closest('.town[data-id]'); if (t && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); EX.sel = t.dataset.id; refreshBig(); openOrg(t.dataset.id); } });
refreshBig();

/* =================== DRAWER =================== */
const drawer = $('drawer'), scrim = $('scrim'); let lastFocus = null;
function openOrg(id){
  const o = BYID[id]; if (!o) return; lastFocus = document.activeElement;
  const srcs = (o.src||[]).map(k => SOURCES[k]).filter(Boolean);
  const scale = scored(o) ? DIMS.map((d,i) => `<div class="srow"><span>${esc(d.n)}</span><span class="ticks ${o.e}" aria-label="${o.sc[i]} of 5">${[1,2,3,4,5].map(v => `<i class="${v<=o.sc[i]?'f':''}"></i>`).join('')}</span></div>`).join('')
    : '<p class="note">Not scored on ideology: a funding network whose money crosses positions.</p>';
  drawer.innerHTML = `<div class="dhead"><div><div class="prov">${esc(PLAB[o.c])} · ${PNAME[o.e]} · grid ${gridRef(o.id)}</div><h2>${esc(o.n)}</h2></div><button class="close" id="dclose">Close</button></div>
    <p class="meta">${esc(TYPES[o.t])}, founded ${esc(o.f)}. Currently <span class="trj ${o.tr}">${TRL[o.tr]}</span>.</p>
    <p style="margin:0">${esc(o.role)}</p>
    <div class="infl"><div><b>${o.ii}</b><span>Ideas</span></div><div><b>${o.gi}</b><span>Governing</span></div><div><b>${o.pi}</b><span>Personnel</span></div></div>
    <dl class="entry">
      <dt>Key people</dt><dd>${esc(o.l)}</dd>
      ${o.fig ? `<dt>Linked figures</dt><dd>${esc(o.fig)}</dd>` : ''}
      <dt>2024-26</dt><dd>${esc(o.dev)}</dd>
      <dt>2028</dt><dd>${esc(o.r28)}</dd>
      <dt>What it does</dt><dd>${o.fn.map(f => esc(FUNCS[f])).join(', ')}</dd>
      <dt>Allies</dt><dd>${esc(o.al)}</dd>
      <dt>Opponents</dt><dd>${esc(o.op)}</dd>
      <dt>Funding</dt><dd>${esc(o.m)}</dd>
    </dl>
    <h3 style="margin-top:18px">Bearings</h3><div class="scale">${scale}</div>
    ${srcs.length ? `<h3 style="margin-top:18px">Sources</h3><ul class="srcs">${srcs.map(s => `<li><a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a></li>`).join('')}</ul>` : ''}
    <p style="margin-top:18px"><button class="smallbtn" id="dlocate">Locate on the map</button></p>`;
  drawer.classList.add('on'); scrim.classList.add('on'); drawer.setAttribute('aria-hidden','false'); drawer.scrollTop = 0;
  $('dclose').onclick = closeOrg; $('dclose').focus();
  $('dlocate').onclick = () => { closeOrg(); EX.sel = id; refreshBig(); location.hash = 'map'; setTimeout(() => { $('explore').scrollIntoView({behavior:'smooth'}); zoomToOrg(id); }, 60); };
}
function closeOrg(){ drawer.classList.remove('on'); scrim.classList.remove('on'); drawer.setAttribute('aria-hidden','true'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
scrim.onclick = closeOrg;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('on')) closeOrg(); });
document.addEventListener('click', e => { const b = e.target.closest('[data-org]'); if (b){ e.preventDefault(); openOrg(b.dataset.org); } });
const oLink = id => { const o = BYID[id]; return o ? `<button data-org="${o.id}">${esc(short(o))}</button>` : ''; };

/* =================== ROUTING =================== */
const VIEWS = ['map','cross','gazetteer','borders','uncharted','chronology','dispatches','notes'];
function route(){
  let v = (location.hash || '').replace('#',''); if (v === 'explore') v = 'map'; if (!VIEWS.includes(v)) v = 'map';
  VIEWS.forEach(x => $('v-' + x).classList.toggle('on', x === v));
  document.querySelectorAll('#platenav a').forEach(a => a.dataset.v === v ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'));
  if (v === 'cross') drawCross();
}
window.addEventListener('hashchange', route);


/* =================== CROSS-SECTIONS =================== */
const CX = {x:'iv', y:'bd', size:'gi', camp:'all', q:'', eco:{D:true,R:true,X:true}, sel:null};
const dimOpts2 = DIMS.map(d => ({v:d.k, t:d.n}));
fill($('cxx'), dimOpts2, CX.x); fill($('cxy'), dimOpts2, CX.y);
fill($('cxsize'), INFL.map(d => ({v:d.k, t:d.n})), CX.size);
fill($('cxcamp'), [{v:'all',t:'All provinces'}].concat(Object.keys(CAMPS).map(k => ({v:k, t:`${PLAB[k]} (${CAMPS[k].e})`}))), 'all');
[['cxx','x'],['cxy','y'],['cxsize','size'],['cxcamp','camp']].forEach(([id,k]) => $(id).addEventListener('change', e => { CX[k] = e.target.value; drawCross(); }));
$('cxq').addEventListener('input', e => { CX.q = e.target.value.trim().toLowerCase(); drawCross(); });
document.querySelectorAll('[data-ceco]').forEach(c => c.addEventListener('change', e => { CX.eco[e.target.dataset.ceco] = e.target.checked; drawCross(); }));
const CPRE = [['Abundance vs. corporate power','cp','bd'],['Markets vs. intervention','mk','iv'],['Insurgent vs. insider','po','in'],['Tariffs vs. hawkishness','tf','hk'],['Culture vs. immigration','cu','im'],['Deregulation vs. state capacity','dr','ca'],['Labor vs. moderation','lb','mo'],['Climate vs. energy','cl','en']];
$('cxpresets').innerHTML = CPRE.map((p,i) => `<button class="smallbtn" data-cp="${i}">${esc(p[0])}</button>`).join('');
$('cxpresets').addEventListener('click', e => { const b = e.target.closest('[data-cp]'); if (!b) return; const p = CPRE[+b.dataset.cp]; CX.x = p[1]; CX.y = p[2]; $('cxx').value = CX.x; $('cxy').value = CX.y; drawCross(); });
$('cunplot').innerHTML = 'Not charted, because their money crosses positions: ' + ORGS.filter(o => !scored(o)).map(o => `<a href="#" data-org="${o.id}">${esc(short(o))}</a>`).join(', ') + '.';
const jit = (id, salt) => { let h = 2166136261; const s = id + salt; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (((h >>> 0) % 1000) / 1000 - .5) * .56; };
function drawCross(){
  const svg = $('crossvg'), Wc = 900, Hc = 640, L = 74, R = 26, T = 34, Bm = 70;
  const sx = v => L + (v - .5) / 5 * (Wc - L - R), sy = v => Hc - Bm - (v - .5) / 5 * (Hc - T - Bm);
  const dx = DIMS[DI[CX.x]], dy = DIMS[DI[CX.y]];
  let g = `<rect x="2" y="2" width="${Wc-4}" height="${Hc-4}" fill="var(--card)" stroke="var(--ink)" stroke-width="1.4"/><rect x="8" y="8" width="${Wc-16}" height="${Hc-16}" fill="none" stroke="var(--ink)" stroke-width=".6"/>`;
  for (let i = 1; i <= 5; i++){
    g += `<line class="grid${i===3?' mid':''}" x1="${sx(i)}" y1="${T}" x2="${sx(i)}" y2="${Hc-Bm}"/><line class="grid${i===3?' mid':''}" x1="${L}" y1="${sy(i)}" x2="${Wc-R}" y2="${sy(i)}"/>`;
    g += `<text class="num" x="${sx(i)}" y="${Hc-Bm+24}" text-anchor="middle">${['I','II','III','IV','V'][i-1]}</text><text class="num" x="${L-14}" y="${sy(i)+5}" text-anchor="end">${['I','II','III','IV','V'][i-1]}</text>`;
  }
  for (let i = 1; i < 10; i++){ const v = .5 + i*.5; g += `<line x1="${sx(v)}" y1="${Hc-Bm}" x2="${sx(v)}" y2="${Hc-Bm+(i%2?4:7)}" stroke="var(--ink)"/><line x1="${L}" y1="${sy(v)}" x2="${L-(i%2?4:7)}" y2="${sy(v)}" stroke="var(--ink)"/>`; }
  g += `<rect x="${L}" y="${T}" width="${Wc-L-R}" height="${Hc-T-Bm}" fill="none" stroke="var(--ink)" stroke-width="1.1"/>`;
  g += `<text class="axt" x="${(L+Wc-R)/2}" y="${Hc-22}" text-anchor="middle">${esc(dx.n.toUpperCase())}  →</text>`;
  g += `<text class="axt" transform="translate(26 ${(T+Hc-Bm)/2}) rotate(-90)" text-anchor="middle">${esc(dy.n.toUpperCase())}  →</text>`;
  g += `<text class="quad" x="${L+10}" y="${T+20}">${esc(dx.lo)}, ${esc(dy.hi.toLowerCase())}</text><text class="quad" x="${Wc-R-10}" y="${T+20}" text-anchor="end">${esc(dx.hi)}, ${esc(dy.hi.toLowerCase())}</text>`;
  g += `<text class="quad" x="${L+10}" y="${Hc-Bm-12}">${esc(dx.lo)}, ${esc(dy.lo.toLowerCase())}</text><text class="quad" x="${Wc-R-10}" y="${Hc-Bm-12}" text-anchor="end">${esc(dx.hi)}, ${esc(dy.lo.toLowerCase())}</text>`;
  const pts = ORGS.filter(scored).map(o => {
    const on = CX.eco[o.e] && (CX.camp === 'all' || o.c === CX.camp);
    const hit = !!CX.q && (o.n.toLowerCase().includes(CX.q) || short(o).toLowerCase().includes(CX.q));
    return {o, on, hit, x: sx(val(o,CX.x) + jit(o.id,'x')), y: sy(val(o,CX.y) + jit(o.id,'y')), r: 3.4 + o[CX.size] * 1.9, fade: !on || (!!CX.q && !hit)};
  });
  pts.sort((a,b) => (b.fade - a.fade) || (b.r - a.r)).forEach(p => {
    g += `<g class="pt${p.fade?' fade':''}${p.o.id===CX.sel?' sel':''}${p.hit?' hit':''}" data-id="${p.o.id}" tabindex="${p.fade?-1:0}" role="button" aria-label="${esc(p.o.n)}"><circle class="r" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r+4}"/><circle class="m" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r}" fill="${PCOL[p.o.e]}"/></g>`;
  });
  const placed = pts.filter(p => !p.fade).map(p => ({x0:p.x-p.r, y0:p.y-p.r, x1:p.x+p.r, y1:p.y+p.r}));
  pts.filter(p => !p.fade && (p.hit || p.o.id === CX.sel || CX.camp !== 'all' || (p.o.ii+p.o.gi+p.o.pi) >= 10))
    .sort((a,b) => (b.hit - a.hit) || ((b.o.ii+b.o.gi+b.o.pi) - (a.o.ii+a.o.gi+a.o.pi)))
    .forEach(p => {
      const t = short(p.o), w = t.length * 6.3 + 4, h = 14;
      for (const [lx,ly,anc] of [[p.x+p.r+4,p.y+4.5,'start'],[p.x-p.r-4,p.y+4.5,'end'],[p.x,p.y-p.r-5,'middle'],[p.x,p.y+p.r+14,'middle']]){
        const x0 = anc==='start' ? lx : anc==='end' ? lx-w : lx-w/2, b = {x0, y0:ly-11, x1:x0+w, y1:ly-11+h};
        if (b.x0 < L+2 || b.x1 > Wc-R-2 || b.y0 < T+2 || b.y1 > Hc-Bm-2) continue;
        if (placed.some(q => !(b.x1 < q.x0 || b.x0 > q.x1 || b.y1 < q.y0 || b.y0 > q.y1))) continue;
        placed.push(b); g += `<text class="clab" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anc}">${esc(t)}</text>`; break;
      }
    });
  svg.innerHTML = g;
}
const ctip = $('ctip');
$('crossvg').addEventListener('mousemove', e => {
  const t = e.target.closest('.pt'); if (!t || t.classList.contains('fade')){ ctip.style.display = 'none'; return; }
  const o = BYID[t.dataset.id], box = $('crossframe').getBoundingClientRect();
  ctip.innerHTML = `<b>${esc(o.n)}</b><br><i>${esc(PLAB[o.c])}, ${PNAME[o.e]}</i><br>${esc(DIMS[DI[CX.x]].n)}: ${val(o,CX.x)} · ${esc(DIMS[DI[CX.y]].n)}: ${val(o,CX.y)}`;
  let l = e.clientX - box.left + 14; if (l > box.width - 270) l = e.clientX - box.left - 270;
  ctip.style.left = l + 'px'; ctip.style.top = (e.clientY - box.top + 14) + 'px'; ctip.style.display = 'block';
});
$('crossvg').addEventListener('mouseleave', () => ctip.style.display = 'none');
$('crossvg').addEventListener('click', e => { const t = e.target.closest('.pt'); if (t && !t.classList.contains('fade')){ CX.sel = t.dataset.id; drawCross(); openOrg(t.dataset.id); } });
$('crossvg').addEventListener('keydown', e => { const t = e.target.closest('.pt'); if (t && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); CX.sel = t.dataset.id; drawCross(); openOrg(t.dataset.id); } });
drawCross();

/* =================== GAZETTEER =================== */
const G = {q:'', eco:'all', camp:'all', type:'all', sort:'ref', dir:1};
fill($('deco'), [{v:'all',t:'All'},{v:'D',t:'Democratic'},{v:'R',t:'Republican'},{v:'X',t:'Bridge isles'}], 'all');
fill($('dcamp'), [{v:'all',t:'All provinces'}].concat(Object.keys(CAMPS).map(k => ({v:k, t:`${PLAB[k]} (${CAMPS[k].e})`}))), 'all');
fill($('dtype'), [{v:'all',t:'All kinds'}].concat(Object.keys(TYPES).map(k => ({v:k, t:TYPES[k]}))), 'all');
['dq','deco','dcamp','dtype'].forEach(id => $(id).addEventListener(id === 'dq' ? 'input' : 'change', e => { G[{dq:'q',deco:'eco',dcamp:'camp',dtype:'type'}[id]] = id === 'dq' ? e.target.value.trim().toLowerCase() : e.target.value; drawGaz(); }));
const TRO = {up:3, turbulent:2, steady:1, down:0};
const marks = v => `<span class="marks" aria-label="${v} of 5">${'●'.repeat(v)}<span class="o">${'●'.repeat(5-v)}</span></span>`;
function drawGaz(){
  const cols = [{k:'ref',t:'Grid'},{k:'n',t:'Town'},{k:'c',t:'Province'},{k:'t',t:'Kind'},{k:'f',t:'Founded'},{k:'ii',t:'Ideas'},{k:'gi',t:'Governing'},{k:'pi',t:'Personnel'},{k:'tr',t:'Trend'}];
  const rows = ORGS.filter(o => (G.eco==='all'||o.e===G.eco) && (G.camp==='all'||o.c===G.camp) && (G.type==='all'||o.t===G.type) && (!G.q || [o.n,o.s,o.l,o.role,o.dev,o.fig].join(' ').toLowerCase().includes(G.q)));
  const key = o => G.sort==='ref' ? gridRef(o.id).replace(/^([A-M])(\d)$/, '$1$2') : G.sort==='c' ? PLAB[o.c] : G.sort==='t' ? TYPES[o.t] : G.sort==='tr' ? TRO[o.tr] : G.sort==='f' ? (parseInt(String(o.f).replace(/\D/g,'').slice(0,4)) || 9999) : o[G.sort];
  rows.sort((a,b) => { const A = key(a), B = key(b); return (A > B ? 1 : A < B ? -1 : a.n.localeCompare(b.n)) * G.dir; });
  $('dtable').innerHTML = `<thead><tr>${cols.map(c => `<th data-k="${c.k}" tabindex="0" scope="col" ${G.sort===c.k?`aria-sort="${G.dir>0?'ascending':'descending'}"`:''}>${c.t}</th>`).join('')}</tr></thead><tbody>` +
    rows.map(o => `<tr data-org="${o.id}" tabindex="0"><td class="ref">${gridRef(o.id)}</td><td><b style="font-weight:500">${esc(o.n)}</b> <span class="pty ${o.e}">${o.e}</span><div class="note" style="font-size:14px;max-width:52ch">${esc(o.role.split('. ')[0])}.</div></td><td>${esc(PLAB[o.c])}</td><td style="font-style:italic">${esc(TYPES[o.t])}</td><td class="c">${esc(o.f)}</td><td class="c">${marks(o.ii)}</td><td class="c">${marks(o.gi)}</td><td class="c">${marks(o.pi)}</td><td><span class="trj ${o.tr}">${TRL[o.tr]}</span></td></tr>`).join('') + '</tbody>';
  $('dcount').textContent = `${rows.length} of ${ORGS.length} towns listed.`;
}
function sortBy(k){ if (G.sort === k) G.dir *= -1; else { G.sort = k; G.dir = ['ii','gi','pi','tr'].includes(k) ? -1 : 1; } drawGaz(); }
$('dtable').addEventListener('click', e => { const h = e.target.closest('th'); if (h) sortBy(h.dataset.k); });
$('dtable').addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const h = e.target.closest('th'); if (h){ e.preventDefault(); sortBy(h.dataset.k); return; } const r = e.target.closest('tr[data-org]'); if (r){ e.preventDefault(); openOrg(r.dataset.org); } });
drawGaz();

/* =================== BORDERS =================== */
let FLP = 'D';
function drawFL(){
  $('fltabs').innerHTML = [['D','Democratic country'],['R','Republican country'],['X','Across the strait']].map(([k,t]) => `<button data-fl="${k}" aria-pressed="${FLP===k}">${t}</button>`).join('');
  $('flgrid').innerHTML = FAULTS[FLP].map((f,i) => `<article class="fl"><h3>${esc(f.t)}</h3><p class="q">${esc(f.q)}</p>
    <div class="vs2"><div><div class="sidehd a">${esc(f.a.label)}</div><div class="olist">${f.a.ids.map(oLink).join('')}</div></div><div class="v">against</div><div><div class="sidehd b">${esc(f.b.label)}</div><div class="olist">${f.b.ids.map(oLink).join('')}</div></div></div>
    <p class="now"><b>Where it stands</b>${esc(f.now)}</p><button class="smallbtn" data-trace="${FLP}:${i}">Trace on the map</button></article>`).join('');
}
$('fltabs').addEventListener('click', e => { const b = e.target.closest('[data-fl]'); if (b){ FLP = b.dataset.fl; drawFL(); } });
$('flgrid').addEventListener('click', e => { const b = e.target.closest('[data-trace]'); if (!b) return;
  EX.fault = b.dataset.trace; $('fault').value = EX.fault; refreshBig(); location.hash = 'map'; setTimeout(() => $('explore').scrollIntoView({behavior:'smooth'}), 60); });
drawFL();

/* =================== UNCHARTED =================== */
(function ledger(){
  const fks = Object.keys(FUNCS);
  const SH = {ideas:'Ideas',agenda:'Agenda',personnel:'Personnel',electoral:'Elections',caucus:'Hill',state:'States',legal:'Courts',media:'Media',money:'Money',polling:'Polling',field:'Field'};
  let h = `<thead><tr><th class="rowh"></th>${fks.map(f => `<th title="${esc(FUNCS[f])}">${SH[f]}</th>`).join('')}</tr></thead><tbody>`;
  [['D','The Democratic country'],['X','The bridge isles'],['R','The Republican country']].forEach(([e,lab]) => {
    h += `<tr class="part"><th colspan="${fks.length+1}">${lab}</th></tr>`;
    Object.keys(CAMPS).filter(k => CAMPS[k].e === e).forEach(k => {
      h += `<tr><th class="rowh">${esc(PLAB[k])}</th>` + fks.map(f => { const n = ORGS.filter(o => o.c === k && o.fn.includes(f)).length; return `<td class="${n?'n1':'z'}" data-cov="${k}|${f}" aria-label="${n}">${n||''}</td>`; }).join('') + '</tr>';
    });
  });
  $('ledger').innerHTML = h + '</tbody>';
  $('ledger').addEventListener('click', e => {
    const td = e.target.closest('[data-cov]'); if (!td) return; const [k,f] = td.dataset.cov.split('|');
    const list = ORGS.filter(o => o.c === k && o.fn.includes(f)); const box = $('ledgerlist'); box.style.display = 'block';
    box.innerHTML = list.length ? `<h3>${esc(PLAB[k])}: ${esc(FUNCS[f])}</h3><div class="olist">${list.map(o => oLink(o.id)).join('')}</div>`
      : `<h3>${esc(PLAB[k])}: ${esc(FUNCS[f])}</h3><p style="margin:0">Uncharted. Elsewhere in the same country, these do this job:</p><div class="olist" style="margin-top:4px">${ORGS.filter(o => o.fn.includes(f) && (CAMPS[k].e === 'X' || o.e === CAMPS[k].e)).sort((a,b) => (b.pi+b.gi) - (a.pi+a.gi)).slice(0,8).map(o => oLink(o.id)).join('')}</div>
         <p style="margin:8px 0 0"><button class="smallbtn" data-incog="${f}">Show on the map</button></p>`;
  });
  $('ledgerlist').addEventListener('click', e => { const b = e.target.closest('[data-incog]'); if (!b) return; EX.incog = b.dataset.incog; $('uncharted').value = EX.incog; refreshBig(); location.hash = 'map'; setTimeout(() => $('explore').scrollIntoView({behavior:'smooth'}), 60); });
})();
const B = {eco:'D', x:'po', y:'bd', cell:null};
const dimOpts = DIMS.map(d => ({v:d.k, t:d.n}));
fill($('geco'), [{v:'D',t:'Democratic + isles'},{v:'R',t:'Republican + isles'},{v:'all',t:'Both countries'}], B.eco);
fill($('gx'), dimOpts, B.x); fill($('gy'), dimOpts, B.y);
['geco','gx','gy'].forEach(id => $(id).addEventListener('change', e => { B[{geco:'eco',gx:'x',gy:'y'}[id]] = e.target.value; B.cell = null; drawBearings(); }));
function drawBearings(){
  const set = ORGS.filter(o => scored(o) && (B.eco === 'all' || o.e === B.eco || o.e === 'X'));
  const grid = {}; let mx = 0; set.forEach(o => { const k = val(o,B.x) + '-' + val(o,B.y); grid[k] = (grid[k]||0) + 1; mx = Math.max(mx, grid[k]); });
  let h = '';
  for (let y = 5; y >= 1; y--){ h += `<div class="ax">${y}</div>`;
    for (let x = 1; x <= 5; x++){ const v = grid[x+'-'+y] || 0;
      h += `<button class="bcell${v?'':' empty'}${B.cell===x+'-'+y?' on':''}" data-cell="${x}-${y}" style="${v?`background:rgba(42,34,25,${(.06 + .5*v/mx).toFixed(2)});color:${v/mx>.55?'var(--paper)':'var(--ink)'}`:''}">${v || 'open'}</button>`; } }
  h += '<div></div>' + [1,2,3,4,5].map(x => `<div class="ax">${x}</div>`).join('');
  $('bearings').innerHTML = h;
  const dx = DIMS[DI[B.x]], dy = DIMS[DI[B.y]];
  $('bcap').textContent = `Across: ${dx.n} (${dx.lo} to ${dx.hi}). Up: ${dy.n} (${dy.lo} to ${dy.hi}).`;
  if (B.cell){ const [x,y] = B.cell.split('-').map(Number); const inC = set.filter(o => val(o,B.x) === x && val(o,B.y) === y);
    $('bcell').innerHTML = inC.length ? `<h3>${inC.length} here</h3><div class="olist">${inC.map(o => oLink(o.id)).join('')}</div>`
      : `<h3>Open ground</h3><p style="margin:0">Nobody stands at ${esc(dx.n)} ${x}, ${esc(dy.n)} ${y}. Nearest:</p><div class="olist" style="margin-top:4px">${set.map(o => ({o, d:Math.hypot(val(o,B.x)-x, val(o,B.y)-y)})).sort((a,b) => a.d-b.d).slice(0,5).map(z => oLink(z.o.id)).join('')}</div>`; }
}
$('bearings').addEventListener('click', e => { const c = e.target.closest('[data-cell]'); if (c){ B.cell = c.dataset.cell; drawBearings(); } });
drawBearings();
let GN = 'D';
function drawGN(){
  $('gntabs').innerHTML = [['D','Democratic country'],['R','Republican country']].map(([k,t]) => `<button data-gn="${k}" aria-pressed="${GN===k}">${t}</button>`).join('');
  $('gapnotes').innerHTML = GAPNOTES[GN].map(n => `<div class="gapnote"><h3>${esc(n.t)}</h3><p>${esc(n.d)}</p><div class="olist">${n.ids.map(oLink).join('')}</div></div>`).join('');
}
$('gntabs').addEventListener('click', e => { const b = e.target.closest('[data-gn]'); if (b){ GN = b.dataset.gn; drawGN(); } });
drawGN();

/* =================== CHRONOLOGY / DISPATCHES / NOTES =================== */
(function(){ let h = '', era = ''; TIMELINE.forEach(ev => { if (ev.era !== era){ era = ev.era; h += `<div class="era">${esc(era)}</div>`; } h += `<div class="ev"><div class="y">${esc(ev.y)}</div><div><h3>${esc(ev.t)}</h3><p>${esc(ev.d)}</p></div></div>`; }); $('chron').innerHTML = h; })();
$('dgrid').innerHTML = STATEPLAY.map(s => `<div class="disp"><h3>${esc(s.h)}</h3><p>${esc(s.d)}</p><div class="srcs">${s.src.map(k => SOURCES[k]).filter(Boolean).map(x => `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)}</a>`).join('<br>')}</div></div>`).join('');
$('dimtable').innerHTML = '<thead><tr><th>Key</th><th>Dimension</th><th>1 means</th><th>5 means</th></tr></thead><tbody>' + DIMS.map(d => `<tr><td>${d.k}</td><td>${esc(d.n)}</td><td>${esc(d.lo)}</td><td>${esc(d.hi)}</td></tr>`).join('') + '</tbody>';
$('typelist').textContent = Object.values(TYPES).join(' · ');
$('srclist').innerHTML = Object.values(SOURCES).map(s => `<li><a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a></li>`).join('');

route();
})();
