const STATES = {AK:[0,0,"Alaska"],ME:[0,11,"Maine"],VT:[1,10,"Vermont"],NH:[1,11,"New Hampshire"],
WA:[2,1,"Washington"],ID:[2,2,"Idaho"],MT:[2,3,"Montana"],ND:[2,4,"North Dakota"],MN:[2,5,"Minnesota"],IL:[2,6,"Illinois"],WI:[2,7,"Wisconsin"],MI:[2,8,"Michigan"],NY:[2,9,"New York"],RI:[2,10,"Rhode Island"],MA:[2,11,"Massachusetts"],
OR:[3,1,"Oregon"],NV:[3,2,"Nevada"],WY:[3,3,"Wyoming"],SD:[3,4,"South Dakota"],IA:[3,5,"Iowa"],IN:[3,6,"Indiana"],OH:[3,7,"Ohio"],PA:[3,8,"Pennsylvania"],NJ:[3,9,"New Jersey"],CT:[3,10,"Connecticut"],
CA:[4,1,"California"],UT:[4,2,"Utah"],CO:[4,3,"Colorado"],NE:[4,4,"Nebraska"],MO:[4,5,"Missouri"],KY:[4,6,"Kentucky"],WV:[4,7,"West Virginia"],VA:[4,8,"Virginia"],MD:[4,9,"Maryland"],DE:[4,10,"Delaware"],
AZ:[5,2,"Arizona"],NM:[5,3,"New Mexico"],KS:[5,4,"Kansas"],AR:[5,5,"Arkansas"],TN:[5,6,"Tennessee"],NC:[5,7,"North Carolina"],SC:[5,8,"South Carolina"],DC:[5,9,"District of Columbia"],
OK:[6,4,"Oklahoma"],LA:[6,5,"Louisiana"],MS:[6,6,"Mississippi"],AL:[6,7,"Alabama"],GA:[6,8,"Georgia"],
HI:[7,0,"Hawaii"],TX:[7,4,"Texas"],FL:[7,9,"Florida"]};
const OFFICE = {us_senate:"U.S. Senate",us_house:"U.S. House",governor:"Governor",state_senate:"State Senate",state_house:"State House"};
const ORDER = {us_senate:0,governor:1,us_house:2,state_senate:3,state_house:4};

let races = [], threshold = 5, view = "all", showPending = true, selected = null;
const $ = id => document.getElementById(id);

try { const s = JSON.parse(localStorage.getItem("btp-filters") || "{}");
  if (s.t) threshold = s.t; if (["all","three","two"].includes(s.v)) view = s.v; if (s.p === false) showPending = false; } catch (e) {}
function saveFilters(){ try { localStorage.setItem("btp-filters", JSON.stringify({t:threshold,v:view,p:showPending})); } catch(e){} }

function qualifies(r){
  const two = r.category === "two_way";
  if (view === "three" && two) return false;
  if (view === "two" && !two) return false;
  if (r.pct == null) return showPending;
  return r.pct >= threshold;
}
function visible(){ return races.filter(qualifies); }

function buildGrid(){
  const g = $("grid"); g.innerHTML = "";
  for (let row=0; row<8; row++) for (let col=0; col<12; col++){
    const code = Object.keys(STATES).find(k => STATES[k][0]===row && STATES[k][1]===col);
    if (!code){ const d=document.createElement("div"); g.appendChild(d); continue; }
    const b = document.createElement("button");
    b.type="button"; b.className="tile"; b.dataset.state=code; b.id="tile-"+code;
    b.innerHTML = `<span>${code}</span><span class="n"></span>`;
    b.addEventListener("click", ()=>{ selected = selected===code ? null : code; render(); });
    b.addEventListener("mouseenter", e=>showTip(code,b));
    b.addEventListener("focus", e=>showTip(code,b));
    b.addEventListener("mouseleave", hideTip); b.addEventListener("blur", hideTip);
    g.appendChild(b);
  }
}
function showTip(code, el){
  const list = visible().filter(r=>r.state===code);
  const scored = list.filter(r=>r.pct!=null).length, pend = list.length-scored;
  const tip=$("tip"), card=el.closest(".mapcard").getBoundingClientRect(), r=el.getBoundingClientRect();
  tip.innerHTML = `<b>${STATES[code][2]}</b><br>${list.length ? `${list.length} race${list.length>1?"s":""}${pend?` (${pend} awaiting votes)`:""}` : "No qualifying races"}`;
  tip.hidden=false;
  let left = r.left-card.left + r.width/2 - tip.offsetWidth/2;
  left = Math.max(4, Math.min(left, card.width - tip.offsetWidth - 4));
  tip.style.left = left+"px"; tip.style.top = (r.top-card.top - tip.offsetHeight - 6)+"px";
}
function hideTip(){ $("tip").hidden = true; }

function esc(s){ return String(s ?? "").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

function render(){
  document.querySelectorAll("#thresh button").forEach(b=>b.setAttribute("aria-pressed", String(+b.dataset.t===threshold)));
  document.querySelectorAll("#view button").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.v===view)));
  $("pending").checked = showPending; $("pending").disabled = view === "three";
  const vis = visible();
  document.querySelectorAll(".tile").forEach(t=>{
    const list = vis.filter(r=>r.state===t.dataset.state);
    const n = list.length;
    t.dataset.level = n===0 ? "0" : n===1 ? "1" : n<5 ? "2" : "3";
    t.dataset.pending = String(list.some(r=>r.pct==null));
    t.querySelector(".n").textContent = n ? n : "";
    t.setAttribute("aria-pressed", String(selected===t.dataset.state));
    t.setAttribute("aria-label", `${STATES[t.dataset.state][2]}: ${n} qualifying race${n===1?"":"s"}`);
  });
  const shown = (selected ? vis.filter(r=>r.state===selected) : vis)
    .sort((a,b)=> (b.pct??-1)-(a.pct??-1) || a.state.localeCompare(b.state) || (ORDER[a.office]-ORDER[b.office]));
  $("ledgerTitle").textContent = selected ? STATES[selected][2] : `All states · ${vis.length}`;
  $("clear").hidden = !selected;
  const ul = $("races");
  if (!races.length){ ul.innerHTML = `<li class="empty">No races loaded yet. The hourly check fills this list.</li>`; return; }
  if (!shown.length){ ul.innerHTML = `<li class="empty">No races meet the current filters${selected?" in this state":""}.</li>`; return; }
  const item = r=>{
    const pct = r.pct==null ? `<span class="pct na">Awaiting votes</span>` : `<span class="pct">${r.pct.toFixed(1)}%</span>`;
    const chips = [
      r.rank ? `<span class="chip">${["","1st","2nd","3rd"][r.rank]||r.rank+"th"}</span>`:"",
      r.category==="two_way" ? `<span class="chip two">No ${esc(r.missing||"D or R")} on ballot</span>`:"",
      r.reported ? `<span class="chip">${esc(r.reported)} in</span>`:"",
      r.called ? `<span class="chip">${esc(r.called)}</span>`:""
    ].join("");
    return `<li class="race">
      <div class="race-top"><div><div class="office">${esc(r.state)} · ${esc(OFFICE[r.office]||r.office)}${r.district?` · ${esc(r.district)}`:""}</div>
      <div class="cand">${esc(r.candidate)} <span class="party">${esc(r.party)}</span></div></div>${pct}</div>
      ${r.pct!=null?`<div class="bar"><i style="width:${Math.min(100,r.pct)}%"></i></div>`:""}
      ${r.votes?`<div class="meta">${Number(r.votes).toLocaleString()} votes</div>`:""}
      ${r.opponents?`<div class="meta">vs. ${esc(r.opponents)}</div>`:""}
      ${r.note?`<div class="meta">${esc(r.note)}</div>`:""}
      <div class="chips">${chips}</div>
      ${r.source?`<a href="${esc(r.source)}" target="_blank" rel="noopener">Source</a>`:""}
    </li>`;
  };
  const three = shown.filter(r=>r.category!=="two_way"), two = shown.filter(r=>r.category==="two_way");
  const group = (title, desc, list) => list.length ? `<li class="group"><h3>${title} <span>${list.length}</span></h3><p>${desc}</p></li>` + list.map(item).join("") : "";
  ul.innerHTML =
    group("Three-way races", "A Democrat and a Republican are both on the ballot, so the share shows real pull from both parties.", three) +
    group("Head-to-heads", "The non-major-party candidate faces only a Democrat or only a Republican, so their share isn't comparable to a three-way race.", two);
}

$("thresh").addEventListener("click", e=>{ const b=e.target.closest("button"); if(!b) return; threshold=+b.dataset.t; saveFilters(); render(); });
$("view").addEventListener("click", e=>{ const b=e.target.closest("button"); if(!b) return; view=b.dataset.v; saveFilters(); render(); });
$("pending").addEventListener("change", e=>{ showPending=e.target.checked; saveFilters(); render(); });
$("clear").addEventListener("click", ()=>{ selected=null; render(); });

buildGrid(); render();

(async()=>{
  try {
    const [r, s] = await Promise.all([
      fetch("data/races.json", {cache:"no-cache"}).then(x=>{ if(!x.ok) throw new Error(x.status); return x.json(); }),
      fetch("data/status.json", {cache:"no-cache"}).then(x=>x.ok ? x.json() : null).catch(()=>null)
    ]);
    races = r; render();
    if (s && s.checkedAt){
      const t = new Date(s.checkedAt);
      $("checked").textContent = isNaN(t) ? s.checkedAt : t.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
      $("checknote").textContent = s.note || "";
    } else { $("checked").textContent = "not recorded"; }
  } catch (e) {
    $("races").innerHTML = `<li class="empty">Couldn't load race data. Reload the page to try again.</li>`;
    $("checked").textContent = "unavailable";
  }
})();
