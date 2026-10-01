const OWNER="kaderlaib19-alt",REPO="kaderlaib19-alt.github.io";
const API=`https://api.github.com/repos/${OWNER}/${REPO}/contents/`;
let files=[],filter="all",list=false;

const $=id=>document.getElementById(id);
const extMap={
 pdf:["pdf","📕"],docx:["docx","📘"],doc:["docx","📘"],rtf:["docx","📘"],
 rar:["archive","📦"],zip:["archive","📦"],7z:["archive","📦"],tar:["archive","📦"],gz:["archive","📦"],
 jpg:["image","🖼️"],jpeg:["image","🖼️"],png:["image","🖼️"],gif:["image","🖼️"],webp:["image","🖼️"],svg:["image","🖼️"],
 mp4:["video","🎬"],webm:["video","🎬"],mkv:["video","🎬"],mov:["video","🎬"],avi:["video","🎬"],
 mp3:["audio","🎵"],wav:["audio","🎵"],ogg:["audio","🎵"],m4a:["audio","🎵"],flac:["audio","🎵"]
};

function kind(name){
 const e=name.split(".").pop().toLowerCase();
 return extMap[e]||["file","📄"];
}
function formatSize(n){
 if(!n)return "—";
 const units=["B","KB","MB","GB"];let i=0;
 while(n>=1024&&i<units.length-1){n/=1024;i++}
 return `${n<10&&i>0?n.toFixed(1):Math.round(n)} ${units[i]}`;
}
function esc(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function getDir(url,depth=0){
 const r=await fetch(url);
 if(!r.ok)throw new Error("GitHub API error");
 const data=await r.json();
 let out=[];
 for(const x of data){
   if(x.type==="file")out.push(x);
   else if(x.type==="dir"&&depth<3){
     try{out=out.concat(await getDir(x.url,depth+1))}catch{}
   }
 }
 return out;
}

async function loadFiles(){
 $("error").hidden=true;$("files").innerHTML="";$("status").textContent="Loading live GitHub data...";
 try{
   files=await getDir(API);
   render();
 }catch(e){
   $("error").hidden=false;$("status").textContent="Could not load repository";
 }
}

function render(){
 let q=$("search").value.trim().toLowerCase();
 let arr=files.filter(f=>{
   const [k]=kind(f.name);
   const matchType=filter==="all"||filter===k||(filter==="recent"&&f.name);
   return matchType&&(!q||f.name.toLowerCase().includes(q));
 });
 const s=$("sort").value;
 arr.sort((a,b)=>{
   if(s==="name")return a.name.localeCompare(b.name);
   if(s==="size")return (b.size||0)-(a.size||0);
   if(s==="type")return kind(a.name)[0].localeCompare(kind(b.name)[0]);
   return (b.git_url||"").localeCompare(a.git_url||"");
 });
 $("title").textContent={all:"All files",pdf:"PDF",docx:"Documents",archive:"Archives",image:"Images",video:"Videos",audio:"Audio",recent:"Recent"}[filter]||"Files";
 $("status").textContent=`${arr.length} file${arr.length===1?"":"s"} • Live from GitHub`;
 $("files").className=list?"list":"grid";
 $("files").innerHTML=arr.map(f=>{
   const [k,ico]=kind(f.name), url=f.html_url||f.download_url;
   return `<article class="card">
     <div class="icon ${k}">${ico}</div>
     <div><div class="name" title="${esc(f.name)}">${esc(f.name)}</div>
     <div class="meta">${formatSize(f.size)} • ${k==="file"?"File":k.toUpperCase()}</div></div>
     <div class="card-foot"><span class="type">${k.toUpperCase()}</span><a class="open" href="${url}" target="_blank" rel="noopener">Open</a></div>
   </article>`;
 }).join("");
 $("empty").style.display=arr.length?"none":"block";
 updateCounts();
}

function updateCounts(){
 const c={all:files.length,pdf:0,docx:0,archive:0,image:0,video:0,audio:0};
 files.forEach(f=>c[kind(f.name)[0]]++);
 Object.keys(c).forEach(k=>{if($("c-"+k))$("c-"+k).textContent=c[k]});
 $("repoInfo").textContent=`${files.length} files • ${OWNER}/${REPO}`;
}

document.querySelectorAll(".nav[data-type]").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 filter=b.dataset.type;render();$("sidebar").classList.remove("open");
});
$("search").oninput=render;$("sort").onchange=render;
$("clear").onclick=()=>{$("search").value="";render();$("search").focus()};
$("grid").onclick=()=>{list=false;$("grid").classList.add("active");$("list").classList.remove("active");render()};
$("list").onclick=()=>{list=true;$("list").classList.add("active");$("grid").classList.remove("active");render()};
$("layout").onclick=()=>$("list").click();
$("menu").onclick=()=>$("sidebar").classList.toggle("open");
$("theme").onclick=()=>{document.body.classList.toggle("dark");localStorage.theme=document.body.classList.contains("dark")?"dark":"light"};
if(localStorage.theme==="dark")document.body.classList.add("dark");
loadFiles();
