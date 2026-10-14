const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],HOODS=["Newport Beach","Huntington Beach","Costa Mesa","Irvine","Laguna Beach","Dana Point","San Clemente","Anaheim","Fullerton","Santa Ana","Tustin","All"],TZ="America/Los_Angeles";
let spots=[],day="All",hood=null,searched=true,here=null,map,layer,markers={};const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const toMin=t=>{if(!t)return null;if(t==="close")return 26*60;const[h,m]=t.split(":").map(Number);return h*60+m};
const fmt=t=>{if(t==="close")return"close";const[h,m]=t.split(":").map(Number);return(h%12||12)+(m?":"+String(m).padStart(2,"0"):"")+(h>=12&&h<24?"pm":"am")};
function pt(){const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:TZ,weekday:"short",hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(new Date()).map(x=>[x.type,x.value]));return{day:p.weekday,min:(+p.hour%24)*60+ +p.minute}}
function isNow(s){const P=pt(),n=P.min,a=toMin(s.start),b=toMin(s.end);return s.days.includes(P.day)&&a!=null&&b!=null&&n>=a&&n<b}
function miles(s){if(!here||s.lat==null)return null;const R=3958.8,r=x=>x*Math.PI/180,dl=r(s.lat-here.lat),dg=r(s.lng-here.lng);const a=Math.sin(dl/2)**2+Math.cos(r(here.lat))*Math.cos(r(s.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(a))}
function tick(){$("#clock").textContent=new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:TZ})}
function show(){searched=true;render()}
function render(){if(!searched)return;const q=$("#q").value.trim().toLowerCase(),t=$("#type").value,now=$("#nowOnly").checked;
let list=spots.filter(s=>(day==="All"||s.days.includes(day))&&(!hood||hood==="All"||s.neighborhood===hood)&&(!t||s.dealTypes.includes(t))&&(!now||isNow(s))&&(!q||[s.name,s.neighborhood,s.address,s.zip].join(" ").toLowerCase().includes(q)));
list.forEach(s=>s._d=miles(s));
list.sort((a,b)=>here?((a._d??1e9)-(b._d??1e9)):(isNow(b)-isNow(a)));
$("#count").textContent=list.length+" spot"+(list.length===1?"":"s");
drawMap(list);
$("#grid").innerHTML=list.map((s,i)=>`<article class="card" data-i="${spots.indexOf(s)}"><div class="tags">${isNow(s)?'<span class="tag live">Happening now</span>':""}${s._d!=null?`<span class="tag dist">${s._d.toFixed(1)} mi</span>`:""}${s.verified?"":'<span class="tag warn">verify</span>'}${s.dealTypes.map(x=>`<span class="tag">${x}</span>`).join("")}</div>
<h3>${esc(s.name)}</h3><div class="meta">${esc(s.neighborhood)} · ${esc(s.hoursText||"Hours: verify with venue")}</div>
<ul>${s.deals.map(d=>`<li>${esc(d)}</li>`).join("")}</ul>${s.notes?`<div class="meta">${esc(s.notes)}</div>`:""}<div class="meta">${esc(s.address)}</div>
<div class="links">${s.happyHourUrl?`<a href="${esc(s.happyHourUrl)}" target="_blank" rel="noopener">${s.happyHourDedicated?"See happy hour deals":"Visit venue site"}</a>`:""}<a href="${esc(s.source)}" target="_blank" rel="noopener">Source</a><span class="confirm">Confirm deals on venue site</span></div></article>`).join("")||'<p class="meta">No spots match. Try another area, day, or filter.</p>';}
$("#grid").addEventListener("click",e=>{const c=e.target.closest(".card");if(!c||e.target.closest("a"))return;const s=spots[c.dataset.i],m=markers[c.dataset.i];document.querySelectorAll(".card.sel").forEach(x=>x.classList.remove("sel"));c.classList.add("sel");
if(m){if(innerWidth<900)$("#map").scrollIntoView({behavior:"smooth"});map.flyTo(m.getLatLng(),15,{duration:.8});setTimeout(()=>m.openPopup(),850)}else{$("#hint").textContent=s.name+" isn't on the map yet (no confirmed coordinates)."}});
tick();setInterval(tick,15000);
HOODS.forEach(h=>{const b=document.createElement("button");b.className="hchip";b.textContent=h;b.onclick=()=>{hood=hood===h?null:h;document.querySelectorAll(".hchip").forEach(c=>c.classList.toggle("on",c.textContent===hood));show()};$("#hoodChips").append(b)});
["All",...DAYS.slice(1),"Sun"].forEach(d=>{const b=document.createElement("button");b.className="chip"+(d===day?" on":"");b.textContent=d;b.onclick=()=>{day=d;document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b));render()};$("#dayChips").append(b)});
$("#searchForm").onsubmit=e=>{e.preventDefault();show()};$("#q").addEventListener("input",()=>searched&&render());
["#type","#nowOnly"].forEach(s=>$(s).addEventListener("input",render));
$("#locate").onclick=()=>{if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(p=>{here={lat:p.coords.latitude,lng:p.coords.longitude};$("#locate").classList.add("on");const m=$("#locmsg");m.hidden=false;m.textContent="Sorted by distance. Spots without a mapped address are listed after.";show()},()=>{const m=$("#locmsg");m.hidden=false;m.textContent="Couldn't get your location.";show()})};
fetch("data/spots.json?v=1").then(r=>r.json()).then(j=>{spots=j.spots;render();const p=new URLSearchParams(location.search);if(p.get("q")){$("#q").value=p.get("q");show()}if(p.get("hood")){document.querySelectorAll(".hchip").forEach(c=>c.textContent===p.get("hood")&&c.click())}});

const ICON={bar:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16l-8 9z"/><path d="M12 13v7M8 20h8"/></svg>',
restaurant:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2 1-3 4-3 8h3"/></svg>'};
function todayLine(s){const t=pt().day;if(!s.days.includes(t))return s.days.length?"No listed deal today ("+s.days.join(", ")+")":"Days: verify with venue";return"Today"+(s.start?` · ${fmt(s.start)}–${fmt(s.end)}`:" · times: verify with venue")}
function initMap(){map=L.map("map",{zoomControl:true,scrollWheelZoom:true}).setView([33.68,-117.85],10);
const E="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
L.tileLayer(E+"World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",{maxZoom:16,className:"warm-tiles",attribution:'Tiles &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
L.tileLayer(E+"World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",{maxZoom:16}).addTo(map);
layer=L.layerGroup().addTo(map)}
function drawMap(list){if(!map)return;layer.clearLayers();markers={};const pts=[];
list.forEach(s=>{if(s.lat==null)return;const i=spots.indexOf(s),live=isNow(s);
const icon=L.divIcon({className:"",html:`<div class="mk ${s.venueType}${live?" live":""}">${ICON[s.venueType]}</div>`,iconSize:[34,34],iconAnchor:[17,34],popupAnchor:[0,-30]});
const m=L.marker([s.lat,s.lng],{icon,title:s.name}).bindPopup(`<div class="pop"><h4>${esc(s.name)}</h4><div class="meta">${esc(s.neighborhood)} · ${s.venueType}${live?' · <b style="color:#D9533F">Happening now</b>':""}</div><div class="meta">${todayLine(s)}</div><ul>${s.deals.map(d=>`<li>${esc(d)}</li>`).join("")}</ul>${s.happyHourUrl?`<a href="${esc(s.happyHourUrl)}" target="_blank" rel="noopener">${s.happyHourDedicated?"See happy hour deals":"Visit venue site"}</a>`:""}<a href="${esc(s.source)}" target="_blank" rel="noopener">Source</a><span class="confirm">Confirm deals on venue site</span><a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}" target="_blank" rel="noopener">Directions</a></div>`,{maxWidth:280});
m.addTo(layer);markers[i]=m;pts.push([s.lat,s.lng])});
if(pts.length>1)map.fitBounds(pts,{padding:[40,40],maxZoom:15});else if(pts.length===1)map.setView(pts[0],15)}
function setPh(){$("#q").placeholder=matchMedia("(max-width:640px)").matches?"City, bar, or zip...":"City, bar, restaurant, or zip..."}
setPh();addEventListener("resize",setPh);initMap();
