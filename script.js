const heroSection=document.querySelector(".hero-journey");
const siteHeader=document.querySelector(".site-header");
const heroVideos=[...document.querySelectorAll(".hero-video")];
const heroPanels=[...document.querySelectorAll(".hero-panel")];
const heroSteps=[...document.querySelectorAll(".hero-step")];
const heroCount=document.querySelector(".hero-count");
const canvas=document.querySelector(".architecture-lines");
const ctx=canvas.getContext("2d");
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
const lastSeek=new WeakMap();
let target=0,position=0,active=-1,raf=0,dpr=1,w=0,h=0,turn=0;
const pointer={x:0,y:0},pointerEase={x:0,y:0};

// Always start the demo at its opening frame after refresh or browser restoration.
history.scrollRestoration="manual";
if(location.hash)history.replaceState(history.state,"",location.pathname+location.search);
window.scrollTo({top:0,left:0,behavior:"instant"});
function requestRender(){if(!raf)raf=requestAnimationFrame(render)}
function resizeCanvas(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+"px";canvas.style.height=h+"px"}
function updateTarget(){const rect=heroSection.getBoundingClientRect();siteHeader.classList.toggle("is-over-hero",rect.bottom>siteHeader.offsetHeight);target=Math.max(0,Math.min(1,-rect.top/Math.max(1,heroSection.offsetHeight-innerHeight)));requestRender()}
function playHeroVideo(video){
 const playPromise=video.play();
 if(playPromise)playPromise.catch(error=>console.warn("La vidéo du hero n’a pas pu démarrer.",error));
}
function activate(step){
 if(step===active)return;active=step;
 heroPanels.forEach((panel,i)=>panel.classList.toggle("is-active",i===step));
 heroSteps.forEach((button,i)=>button.classList.toggle("is-active",i===step));
 heroVideos.forEach((video,i)=>{video.classList.toggle("is-active",i===step);if(i!==step)video.pause()});
 playHeroVideo(heroVideos[step]);
 heroCount.innerHTML="0"+(step+1)+" <i>/</i> 03";
}
function seek(video,time){
 if(video.readyState<2||video.seeking)return;
 const now=performance.now(),last=lastSeek.get(video)||0;
 if(now-last<36||Math.abs(video.currentTime-time)<.035)return;
 lastSeek.set(video,now);try{video.currentTime=time}catch(_){}
}
function render(){
 raf=0;position+=(target-position)*(reducedMotion?.3:.13);if(Math.abs(target-position)<.0004)position=target;
 const scaled=position*3,step=Math.min(2,Math.floor(scaled)),local=Math.max(0,Math.min(1,scaled-step));
 activate(step);
 const video=heroVideos[step],duration=Number.isFinite(video.duration)?video.duration:5;
 seek(video,Math.max(0,Math.min(duration-.04,local*(duration-.08))));
 heroSection.style.setProperty("--hero-drift",(reducedMotion?0:(position-.5)*-12).toFixed(2)+"px");
 if(Math.abs(target-position)>.0004)requestRender();
}
heroVideos.forEach(video=>{video.muted=true;video.playsInline=true;video.loop=true;video.preload="auto";video.addEventListener("loadedmetadata",requestRender);video.addEventListener("loadeddata",requestRender);video.addEventListener("seeked",()=>{if(video===heroVideos[active])requestRender()})});
heroSteps.forEach(button=>button.addEventListener("click",()=>{const step=Number(button.dataset.go),top=heroSection.getBoundingClientRect().top+scrollY,range=heroSection.offsetHeight-innerHeight;window.scrollTo({top:top+range*(step/3+.01),behavior:reducedMotion?"instant":"smooth"})}));
window.addEventListener("scroll",updateTarget,{passive:true});
window.addEventListener("resize",()=>{resizeCanvas();updateTarget()},{passive:true});
window.addEventListener("pageshow",()=>{window.scrollTo({top:0,left:0,behavior:"instant"});target=0;position=0;heroVideos.forEach(video=>{video.pause();try{video.currentTime=0}catch(_){}});active=-1;activate(0);requestRender()});
window.addEventListener("pointermove",event=>{pointer.x=event.clientX/innerWidth*2-1;pointer.y=event.clientY/innerHeight*2-1},{passive:true});

function project(point,ax,ay,cx,cy,scale){
 const cosY=Math.cos(ay),sinY=Math.sin(ay),cosX=Math.cos(ax),sinX=Math.sin(ax);
 const rx=point[0]*cosY-point[2]*sinY,rz=point[0]*sinY+point[2]*cosY;
 const ry=point[1]*cosX-rz*sinX,rz2=point[1]*sinX+rz*cosX,zoom=5.6/(5.6-rz2);
 return[cx+rx*scale*zoom,cy+ry*scale*zoom];
}
function drawArchitecture(){
 pointerEase.x+=(pointer.x-pointerEase.x)*.045;pointerEase.y+=(pointer.y-pointerEase.y)*.045;
 if(!reducedMotion)turn+=.0022;
 const mobile=w<760,scale=Math.min(w,h)*(mobile?.16:.28),cx=w*(mobile?.77:.73)+pointerEase.x*18,cy=h*(mobile?.29:.5)+pointerEase.y*12;
 const ax=-.28+pointerEase.y*.12+position*.18,ay=turn+pointerEase.x*.18+position*.55;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const boxes=[{x:1.45,y:1.05,z:1.35,a:.29,o:0},{x:1.17,y:.8,z:1.05,a:.18,o:.16},{x:.88,y:.58,z:.8,a:.3,o:.34}];
 boxes.forEach((box,index)=>{
  const vertices=[];for(let z=-1;z<=1;z+=2)for(let y=-1;y<=1;y+=2)for(let x=-1;x<=1;x+=2)vertices.push([x*box.x,y*box.y,z*box.z]);
  const p=vertices.map(v=>project(v,ax+box.o,ay-box.o,cx,cy,scale));
  ctx.lineWidth=index===0?1.1:.7;ctx.strokeStyle="rgba(232,205,181,"+box.a+")";ctx.beginPath();
  for(let i=0;i<8;i++)for(let bit=0;bit<3;bit++){const j=i^(1<<bit);if(j>i){ctx.moveTo(p[i][0],p[i][1]);ctx.lineTo(p[j][0],p[j][1])}}
  ctx.stroke();
 });
 ctx.strokeStyle="rgba(221,190,164,.17)";ctx.lineWidth=.65;ctx.beginPath();
 for(let i=-2;i<=2;i++){const a=project([i*.43,-1.03,-1.35],ax,ay,cx,cy,scale),b=project([i*.43,-1.03,1.35],ax,ay,cx,cy,scale);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1])}
 for(let j=-2;j<=2;j++){const a=project([-1.35,-1.03,j*.43],ax,ay,cx,cy,scale),b=project([1.35,-1.03,j*.43],ax,ay,cx,cy,scale);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1])}
 ctx.stroke();
 const light=project([1.46,.95,-.35],ax,ay,cx,cy,scale),glow=ctx.createRadialGradient(light[0],light[1],0,light[0],light[1],w<760?48:82);
 glow.addColorStop(0,"rgba(221,169,132,.18)");glow.addColorStop(1,"rgba(221,169,132,0)");ctx.fillStyle=glow;ctx.fillRect(light[0]-90,light[1]-90,180,180);
}
function animateArchitecture(){drawArchitecture();requestAnimationFrame(animateArchitecture)}
resizeCanvas();updateTarget();animateArchitecture();

const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-revealed");revealObserver.unobserve(entry.target)}}),{threshold:.16});
document.querySelectorAll(".reveal").forEach(element=>revealObserver.observe(element));
document.querySelectorAll(".project-video").forEach(video=>{const showFinalFrame=()=>{if(Number.isFinite(video.duration)&&video.duration>0){video.pause();video.currentTime=Math.min(4.5,video.duration-.08)}};if(video.readyState>=1)showFinalFrame();else video.addEventListener("loadedmetadata",showFinalFrame,{once:true});video.addEventListener("play",()=>video.pause())});
document.querySelectorAll(".atelier-video").forEach(video=>{video.muted=true;video.loop=true;const startPlayback=()=>video.play().catch(error=>console.warn("La vidéo de l’atelier n’a pas pu démarrer.",error));startPlayback();video.addEventListener("canplay",startPlayback,{once:true})});

const menuToggle=document.querySelector(".menu-toggle"),mainNav=document.querySelector(".main-nav");
function setMenuOpen(open){
 mainNav.classList.toggle("is-open",open);
 menuToggle.setAttribute("aria-expanded",String(open));
 menuToggle.setAttribute("aria-label",open?"Fermer le menu":"Ouvrir le menu");
 document.body.classList.toggle("menu-open",open);
}
menuToggle.addEventListener("click",()=>{
 const open=menuToggle.getAttribute("aria-expanded")!=="true";
 setMenuOpen(open);
 if(open)mainNav.querySelector("a").focus({preventScroll:true});
});
mainNav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
 setMenuOpen(false);
 menuToggle.focus({preventScroll:true});
}));
document.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&menuToggle.getAttribute("aria-expanded")==="true"){
  setMenuOpen(false);
  menuToggle.focus({preventScroll:true});
 }
});
matchMedia("(min-width: 801px)").addEventListener("change",event=>{if(event.matches)setMenuOpen(false)});

const briefForm=document.querySelector("#project-brief-form");
briefForm.addEventListener("submit",event=>{
 event.preventDefault();
 if(!briefForm.reportValidity())return;
 const fields=new FormData(briefForm);
 const values={
  name:fields.get("name").trim(),
  email:fields.get("email").trim(),
  project:fields.get("project"),
  location:fields.get("location").trim(),
  area:fields.get("area").trim(),
  timeline:fields.get("timeline"),
  details:fields.get("details").trim(),
  availability:fields.get("availability").trim()
 };
 const brief=[
  "Nom : "+values.name,
  "E-mail : "+values.email,
  "Projet : "+values.project,
  "Lieu : "+values.location,
  "Surface : "+(values.area?values.area+" m²":"À préciser"),
  "Horizon : "+values.timeline,
  "Disponibilités : "+(values.availability||"À convenir"),
  "",
  "Le projet :",
  values.details
 ].join("\n");
 document.querySelector("#brief-preview").textContent=brief;
 document.querySelector("#brief-email-link").href="mailto:bonjour@atelierforma.fr?subject="+encodeURIComponent("Demande de rendez-vous — "+values.project)+"&body="+encodeURIComponent("Bonjour Atelier Forma,\n\nJe souhaite échanger au sujet de mon projet.\n\n"+brief);
 document.querySelector("#brief-result").hidden=false;
});
