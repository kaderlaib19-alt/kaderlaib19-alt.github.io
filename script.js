<<<<<<< HEAD
const SOURCE_REPO = "kaderlaib19-alt/m3allKanfor";
const SOURCE_BRANCH = "main";
const API_ROOT = `https://api.github.com/repos/${SOURCE_REPO}/git/trees/${SOURCE_BRANCH}?recursive=1`;

const state = {
  files: [],
  path: "",
  filter: "all",
  query: "",
  history: [],
  historyIndex: -1,
  view: localStorage.getItem("fileExplorerView") || "grid"
};

const els = {
  area: document.getElementById("fileArea"),
  empty: document.getElementById("empty"),
  status: document.getElementById("status"),
  count: document.getElementById("count"),
  title: document.getElementById("folderTitle"),
  address: document.getElementById("address"),
  crumbs: document.getElementById("crumbs"),
  search: document.getElementById("search"),
  back: document.getElementById("backBtn"),
  forward: document.getElementById("forwardBtn"),
  up: document.getElementById("upBtn"),
  grid: document.getElementById("gridBtn"),
  list: document.getElementById("listBtn")
};

function ext(path){
  const n = path.split("/").pop().toLowerCase();
  const i = n.lastIndexOf(".");
  return i > -1 ? n.slice(i+1) : "";
}
function typeOf(path){
  const e = ext(path);
  if(["jpg","jpeg","png","gif","webp","bmp","svg"].includes(e)) return "image";
  if(["pdf","doc","docx","txt","xls","xlsx","ppt","pptx","csv"].includes(e)) return "document";
  if(["mp4","webm","mov","mkv","avi"].includes(e)) return "video";
  if(["mp3","wav","ogg","m4a","flac"].includes(e)) return "audio";
  if(["zip","rar","7z","tar","gz"].includes(e)) return "archive";
  return "other";
}
function iconFor(type){
  return {image:"▧",document:"▤",video:"▶",audio:"♫",archive:"▱",other:"□"}[type] || "□";
}
function formatBytes(n){
  if(!n || n < 0) return "";
  const u=["B","KB","MB","GB"];
  let i=0, v=n;
  while(v>=1024 && i<u.length-1){v/=1024;i++}
  return `${v.toFixed(v>=100||i===0?0:1)} ${u[i]}`;
}
function rawUrl(path){
  return `https://raw.githubusercontent.com/${SOURCE_REPO}/${SOURCE_BRANCH}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
function fileName(path){ return path.split("/").pop(); }
function parentPath(path){
  const p=path.split("/").filter(Boolean);
  p.pop();
  return p.join("/");
}

function setStatus(msg=""){ els.status.textContent=msg; }

function normalizeTree(data){
  return (data.tree || [])
    .filter(x => x.type === "blob")
    .map(x => ({path:x.path, size:x.size || 0, type:typeOf(x.path)}))
    .sort((a,b)=>a.path.localeCompare(b.path));
}

async function loadFiles(){
  setStatus("Loading file index...");
  try{
    const r=await fetch(API_ROOT, {headers:{Accept:"application/vnd.github+json"}});
    if(!r.ok) throw new Error(`GitHub API returned ${r.status}`);
    const data=await r.json();
    if(data.truncated) setStatus("GitHub returned a partial file list because the repository tree is very large.");
    state.files=normalizeTree(data);
    render();
  }catch(err){
    console.error(err);
    state.files=[];
    setStatus("Could not load the GitHub file list. The interface is ready, but GitHub API access is unavailable from this network.");
    render();
  }
}

function visibleFiles(){
  return state.files.filter(f=>{
    const inFolder = state.path ? f.path.startsWith(state.path + "/") : true;
    const rest = state.path ? f.path.slice(state.path.length+1) : f.path;
    const direct = !rest.includes("/");
    const matchesFilter = state.filter==="all" || f.type===state.filter;
    const q=state.query.trim().toLowerCase();
    const matchesSearch = !q || f.path.toLowerCase().includes(q);
    return inFolder && direct && matchesFilter && matchesSearch;
  });
}

function render(){
  els.area.className=`file-area ${state.view}`;
  els.grid.classList.toggle("active",state.view==="grid");
  els.list.classList.toggle("active",state.view==="list");
  els.title.textContent=state.path ? fileName(state.path) : "Home";
  els.address.textContent=state.path ? "/" + state.path : "Home";

  const files=visibleFiles();
  els.count.textContent=`${files.length} item${files.length===1?"":"s"}`;
  renderCrumbs();
  els.area.innerHTML="";

  if(!files.length){
    els.empty.classList.remove("hidden");
    return;
  }
  els.empty.classList.add("hidden");

  files.forEach(f=>{
    const card=document.createElement("div");
    card.className="file-card";
    const thumb=document.createElement("div");
    thumb.className="file-thumb";

    if(f.type==="image"){
      const img=document.createElement("img");
      img.loading="lazy";
      img.alt=f.path;
      img.src=rawUrl(f.path);
      img.onerror=()=>{thumb.innerHTML=`<div class="file-icon">▧</div>`};
      thumb.appendChild(img);
    }else{
      const ico=document.createElement("div");
      ico.className="file-icon";
      ico.textContent=iconFor(f.type);
      thumb.appendChild(ico);
    }

    const info=document.createElement("div");
    info.className="file-info";
    info.innerHTML=`<div class="file-name" title="${escapeHtml(f.path)}">${escapeHtml(fileName(f.path))}</div>
      <div class="file-meta">${f.type.toUpperCase()}${f.size?` · ${formatBytes(f.size)}`:""}</div>
      <div class="file-actions">
        <button class="action open">Open</button>
        <button class="action download">Download</button>
      </div>`;

    card.append(thumb,info);
    card.querySelector(".open").onclick=e=>{e.stopPropagation();openFile(f)};
    card.querySelector(".download").onclick=e=>{e.stopPropagation();downloadFile(f)};
    card.onclick=()=>openFile(f);
    els.area.appendChild(card);
  });
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function openFile(f){
  const url=rawUrl(f.path);
  // Images are the only files intentionally previewed in the explorer.
  if(f.type==="image"){
    window.open(url,"_blank","noopener");
    return;
  }
  // Everything else opens as a normal GitHub file/download URL.
  window.open(`https://github.com/${SOURCE_REPO}/blob/${SOURCE_BRANCH}/${f.path.split("/").map(encodeURIComponent).join("/")}`,"_blank","noopener");
}

function downloadFile(f){
  // Use GitHub's normal file URL. This avoids embedding video/audio/PDF readers.
  const url=`https://github.com/${SOURCE_REPO}/raw/${SOURCE_BRANCH}/${f.path.split("/").map(encodeURIComponent).join("/")}`;
  const a=document.createElement("a");
  a.href=url;
  a.target="_blank";
  a.rel="noopener";
  a.click();
}

function renderCrumbs(){
  els.crumbs.innerHTML="";
  const home=document.createElement("button");
  home.className="crumb"; home.textContent="Home";
  home.onclick=()=>navigate("");
  els.crumbs.appendChild(home);
  if(!state.path) return;
  const parts=state.path.split("/");
  let current="";
  parts.forEach((p,i)=>{
    const sep=document.createElement("span"); sep.textContent="›"; els.crumbs.appendChild(sep);
    current=current?`${current}/${p}`:p;
    const b=document.createElement("button");
    b.className="crumb"; b.textContent=p;
    const target=current;
    b.onclick=()=>navigate(target);
    els.crumbs.appendChild(b);
  });
}

function navigate(path,push=true){
  if(path===state.path) return;
  if(push){
    state.history=state.history.slice(0,state.historyIndex+1);
    state.history.push(path);
    state.historyIndex++;
  }
  state.path=path;
  render();
}

els.search.addEventListener("input",e=>{state.query=e.target.value;render()});
els.grid.onclick=()=>{state.view="grid";localStorage.setItem("fileExplorerView","grid");render()};
els.list.onclick=()=>{state.view="list";localStorage.setItem("fileExplorerView","list");render()};
els.back.onclick=()=>{
  if(state.historyIndex>0){state.historyIndex--;state.path=state.history[state.historyIndex];render()}
};
els.forward.onclick=()=>{
  if(state.historyIndex<state.history.length-1){state.historyIndex++;state.path=state.history[state.historyIndex];render()}
};
els.up.onclick=()=>navigate(parentPath(state.path));

document.querySelectorAll(".side-item").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".side-item").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    state.filter=btn.dataset.filter;
    state.path="";
    state.query="";
    els.search.value="";
    render();
  });
});

state.history=[""];
state.historyIndex=0;
render();
loadFiles();
=======
const OWNER="kaderlaib19-alt",REPO="m3allKanfor";
const NAMES=["DD.mp4", "Doc3.docx", "LICENSE", "README.md", "V20260001186062.pdfعبد القادر.pdf", "_#فلاش سريع لنشاط الظهرات #تعريف الظهرة المحيطية #ثالثةمتوسط.mp4", "downloadfile-1[1].docملخصx.docx", "videoplayback.mp4", "أغلفة مذكرات sefiane snv وميادين_260806_170212.pdf", "الجمهورية الجزائرية الديمقراطية الشعبية.docx", "الدفتر اليومي نموذج.pdf", "الدفتر اليومي_260829_173220.pdf", "السنة 3️⃣ متوسط فيديو شكل المنظر الطبيعي وخصائص الصخور برطاجي و طاڨي زميلك ليستفيد منقول.mp4", "المعالجة البيداغوجية لموناليزا.pdf", "النشاط التفاعل الالتهابي.docx", "انتقال الرسالة العصبيةينة تنتقل من المستقبلات الى المراكز العصبية.docx", "تقرير توصيفي.pdf", "حل_مشكلة (1).pdf", "س1 مذكرة 6[1].docx", "كراس يومي 25 26_260829_172921.pdf", "كل-مذكرات-مقطع-الدينامية-الخارجية-للكرة-الأرضية-للأستاذة-dina-bio.pdf · إصدار _١_.pdf", "مخطط الاولى.pdf", "مذكرات سميرة_1_260923_211438.pdf", "مذكرة مورد التربة وسط حي هش للأستاذة dina bio.pdf · إصدار _١_.pdf", "مذكرة-مورد-الموارد-الطبيعية-في-الجزائر-للأستاذة-dina-bio.pdf", "مطبوعات الإستجابة المناعية بحلة جديدةللتلاميذ-Copie.pdf", "مطبوعة الرابعة اتصال.docx", "ملف شامل لمذكرات و بطاقات العمل الفوجي لبرنامج السنة الثالثة متوسط للاستاذة درقاوي سميرة.pdf · version 1(1).rar", "مواضيع بيام علوم من 2010-2025 بالحل تجميعية الأستا_260421_151033.pdf", "نشاط الظهرات.mp4"];
const BASE="https://raw.githubusercontent.com/"+OWNER+"/"+REPO+"/main/";
const $=x=>document.getElementById(x);
const map={pdf:["pdf","📕","PDF"],doc:["documents","📘","DOC"],docx:["documents","📘","DOCX"],txt:["documents","📄","TXT"],zip:["archives","📦","ZIP"],rar:["archives","📦","RAR"],"7z":["archives","📦","7Z"],jpg:["images","🖼️","JPG"],jpeg:["images","🖼️","JPEG"],png:["images","🖼️","PNG"],gif:["images","🖼️","GIF"],webp:["images","🖼️","WEBP"],svg:["images","🖼️","SVG"],mp4:["videos","🎬","MP4"],mkv:["videos","🎬","MKV"],avi:["videos","🎬","AVI"],mov:["videos","🎬","MOV"],webm:["videos","🎬","WEBM"],mp3:["audio","🎵","MP3"],wav:["audio","🎵","WAV"],ogg:["audio","🎵","OGG"],m4a:["audio","🎵","M4A"],flac:["audio","🎵","FLAC"]};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ext=n=>{let p=n.toLowerCase().split(".");return p.length>1?p.pop():""};
const info=n=>map[ext(n)]||["other","📄",ext(n).toUpperCase()||"FILE"];
const url=n=>BASE+encodeURIComponent(n).replace(/%2F/g,"/");
let data=NAMES.map((name,i)=>{let [category,icon,label]=info(name);return {name,category,icon,label,path:name,url:url(name),size:0};});
let filter="all",view="grid";

function render(){
 let q=$("search").value.trim().toLowerCase(),list=data.filter(f=>(filter==="all"||f.category===filter)&&(!q||f.name.toLowerCase().includes(q)));
 if($("sort").value==="name")list.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
 if($("sort").value==="type")list.sort((a,b)=>a.label.localeCompare(b.label)||a.name.localeCompare(b.name));
 $("count").textContent=list.length+" files";
 $("files").className="files "+view;
 $("files").innerHTML=list.map((f,i)=>`<article class="file"><div class="ico">${f.icon}</div><div><div class="name" title="${esc(f.name)}">${esc(f.name)}</div><div class="path">${esc(f.path)}</div><div class="meta"><b>${f.label}</b><span>GitHub file</span></div></div><div class="actions"><button class="open" data-i="${i}">Open</button><a href="${f.url}" target="_blank" rel="noopener">Download</a></div></article>`).join("");
 document.querySelectorAll(".open").forEach(b=>b.onclick=()=>openFile(list[+b.dataset.i]));
}
function openFile(f){
 $("viewer").hidden=false;$("viewerName").textContent=f.name;$("download").href=f.url;$("viewerBody").innerHTML="";
 let e=ext(f.name);
 if(["jpg","jpeg","png","gif","webp","svg"].includes(e)){let x=document.createElement("img");x.src=f.url;x.alt=f.name;$("viewerBody").appendChild(x);return;}
 if(["mp4","webm","ogg"].includes(e)){let x=document.createElement("video");x.src=f.url;x.controls=true;$("viewerBody").appendChild(x);return;}
 if(["mp3","wav","m4a","flac"].includes(e)){let x=document.createElement("audio");x.src=f.url;x.controls=true;$("viewerBody").appendChild(x);return;}
 if(e==="pdf"){let x=document.createElement("iframe");x.src=f.url;$("viewerBody").appendChild(x);return;}
 if(["txt"].includes(e)){fetch(f.url).then(r=>r.text()).then(t=>{let x=document.createElement("pre");x.className="textView";x.textContent=t;$("viewerBody").appendChild(x)}).catch(()=>unsupported(f));return;}
 unsupported(f);
}
function unsupported(f){$("viewerBody").innerHTML=`<div class="textView"><h2>${esc(f.icon)} ${esc(f.name)}</h2><p>This file type is not previewable in a browser.</p><p>Use the <b>Download</b> button above.</p></div>`}
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();$("side").classList.remove("open")});
document.querySelectorAll(".view").forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x===b));render()});
$("search").oninput=render;$("sort").onchange=render;$("clear").onclick=()=>{$("search").value="";render()};
$("close").onclick=()=>{$("viewer").hidden=true;$("viewerBody").innerHTML=""};
$("viewer").onclick=e=>{if(e.target===$("viewer"))$("close").click()};
$("menu").onclick=()=>$("side").classList.toggle("open");
$("theme").onclick=()=>{document.body.classList.toggle("dark");localStorage.oriloDark=document.body.classList.contains("dark")};
if(localStorage.oriloDark==="true")document.body.classList.add("dark");
render();
>>>>>>> f594473ae3459a56ef3d3a3ad6d39d579b393302
