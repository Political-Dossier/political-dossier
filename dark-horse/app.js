const SECTIONS = [
  {key:"dem", label:"Democrat", party:"dem", people:DEM},
  {key:"gop", label:"Republican", party:"gop", people:GOP},
  {key:"ind", label:"Independent / third party", party:"ind", people:IND}
];
const SIZES={1:38,2:46,3:56};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

SECTIONS.forEach(sec=>{
  const plot=document.getElementById("plot-"+sec.key);
  const filters=document.getElementById("filters-"+sec.key);
  const active=new Set(Object.keys(STATUS));
  document.getElementById(sec.key+"-count").textContent=sec.people.length+" tracked";
  sec.people.forEach(p=>{
    p.sec=sec;
    const b=document.createElement("button");
    b.className="bubble";
    b.style.left=p.x+"%"; b.style.top=p.y+"%";
    b.style.setProperty("--sz",SIZES[p.w]+"px");
    b.dataset.status=p.status;
    b.setAttribute("aria-label",p.name+", "+STATUS[p.status].label);
    b.innerHTML=`<span class="badge st-${p.status}">${p.ini}</span><span class="bname">${esc(p.name)}</span>`;
    b.addEventListener("click",()=>openPanel(p,b));
    plot.appendChild(b);
  });
  Object.entries(STATUS).forEach(([k,s])=>{
    const n=sec.people.filter(p=>p.status===k).length;
    if(!n) return;
    const c=document.createElement("button");
    c.className="chip"; c.setAttribute("aria-pressed","true");
    c.innerHTML=`<span class="dot st-${k}"></span>${s.label} <span class="n">${n}</span>`;
    c.addEventListener("click",()=>{
      if(active.has(k)) active.delete(k); else active.add(k);
      c.setAttribute("aria-pressed",active.has(k));
      plot.querySelectorAll(".bubble").forEach(el=>el.hidden=!active.has(el.dataset.status));
    });
    filters.appendChild(c);
  });
});

(function renderUpdates(){
  const MONTHS=["Jan.","Feb.","March","April","May","June","July","Aug.","Sept.","Oct.","Nov.","Dec."];
  const parse=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);};
  const monday=dt=>{const d=new Date(dt);const off=(d.getDay()+6)%7;d.setDate(d.getDate()-off);d.setHours(0,0,0,0);return d;};
  const fmt=d=>MONTHS[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();
  const key=d=>d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
  const list=items=>`<ul class="upd-list">${items.map(u=>`<li><b>${esc(u.name)}:</b> ${esc(u.text)} (<a href="${u.url}" target="_blank" rel="noopener">${esc(u.outlet)}</a>)</li>`).join("")}</ul>`;
  const weeks=new Map();
  UPDATES.slice().sort((a,b)=>b.date.localeCompare(a.date)).forEach(u=>{
    const wk=monday(parse(u.date)); const k=key(wk);
    if(!weeks.has(k)) weeks.set(k,{start:wk,items:[]});
    weeks.get(k).items.push(u);
  });
  const thisWk=monday(new Date());
  document.getElementById("upd-weekof").textContent="Week of "+fmt(thisWk);
  const cur=weeks.get(key(thisWk));
  document.getElementById("upd-current").innerHTML=cur?list(cur.items):`<p class="upd-empty">No updates yet this week.</p>`;
  const prev=[...weeks.values()].filter(w=>w.start<thisWk).sort((a,b)=>b.start-a.start);
  document.getElementById("upd-prev").innerHTML=prev.length?prev.map(w=>`<details><summary>${fmt(w.start)} <span class="n">${w.items.length} update${w.items.length>1?"s":""}</span></summary>${list(w.items)}</details>`).join(""):`<p class="upd-empty">No earlier weeks yet.</p>`;
})();

(function shareBar(){
  const total=SECTIONS.reduce((a,s)=>a+s.people.length,0);
  document.getElementById("share").innerHTML=SECTIONS.map(s=>`<span style="flex:${s.people.length};background:var(--${s.party})"></span>`).join("");
  document.getElementById("share-key").innerHTML=`<span><b>${total}</b> dark horses tracked:</span>`+SECTIONS.map(s=>`<span style="color:var(--${s.party})"><b>${s.people.length}</b> ${s.key==="dem"?"Democrats":s.key==="gop"?"Republicans":"Independents"}</span>`).join("");
})();

const panel=document.getElementById("panel"), scrim=document.getElementById("scrim");
let lastBtn=null;
function openPanel(p,btn){
  lastBtn=btn;
  const s=STATUS[p.status];
  panel.style.setProperty("--p","var(--"+p.sec.party+")");

  panel.innerHTML=`
    <div class="ph">
      <span class="badge st-${p.status}">${p.ini}</span>
      <div><h3 id="p-name">${esc(p.name)}</h3><div class="role">${esc(p.role)}${p.age?" · age "+p.age:""}</div></div>
      <button class="close" id="closeBtn">Close</button>
    </div>
    <div class="tags">
      <span class="tag party-tag">${esc(p.sec.label)}</span>
      <span class="tag status"><i class="dot st-${p.status}" style="width:9px;height:9px;vertical-align:-1px;margin-right:5px"></i>${s.label}</span>
      <span class="tag">${esc(p.lane)}</span>
      <span class="tag">${esc(p.axis)}</span>
    </div>
    <p class="why">${esc(p.why)}</p>
    <div class="sec"><h4>Signals</h4><ul>${p.signals.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    ${p.quotes.length?`<div class="sec"><h4>What's being said</h4>${p.quotes.map(q=>`<blockquote><p>“${esc(q[0])}”</p><cite>${esc(q[1])}</cite></blockquote>`).join("")}</div>`:""}
    <div class="sec"><h4>Recent polling</h4><ul class="poll">${p.polls.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="sec arts"><h4>Coverage</h4><ul>${p.arts.map(a=>`<li><a href="${a[3]}" target="_blank" rel="noopener">${esc(a[0])}</a><span class="src">${esc(a[1])} · ${esc(a[2])}</span></li>`).join("")}</ul></div>`;
  panel.hidden=false; scrim.hidden=false; panel.scrollTop=0;
  document.getElementById("closeBtn").addEventListener("click",closePanel);
  document.getElementById("closeBtn").focus();
}
function closePanel(){panel.hidden=true;scrim.hidden=true;if(lastBtn)lastBtn.focus();}
scrim.addEventListener("click",closePanel);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)closePanel();});
