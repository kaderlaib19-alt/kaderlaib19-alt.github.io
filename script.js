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
