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
