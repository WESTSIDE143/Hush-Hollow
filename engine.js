'use strict';
const $=id=>document.getElementById(id);
const G={cols:[],items:[],monsters:[],ticks:[],safe:[],grid:null,bounds:null,t:0,paused:true,over:false,last:0,
  P:{x:0,z:0,yaw:0,pitch:0,eye:1.05,hidden:false,frozen:false,stam:1,tired:false,bob:0,fear:0,run:false,lookT:null},
  in:{f:0,s:0,run:false},shakeT:0,shakeM:0,flashOn:false,flashAllowed:false,cur:null,slow:1};
G.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
G.rng=seed=>{let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}};
G.sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- renderer ---------- */
G.canvas=$('view');
try{G.renderer=new THREE.WebGLRenderer({canvas:G.canvas,antialias:false,powerPreference:'high-performance'})}
catch(e){document.body.insertAdjacentHTML('beforeend','<p style="position:fixed;inset:0;display:grid;place-items:center;margin:0;padding:24px;text-align:center;background:#050606;color:#d9d2bf;z-index:99">This browser could not start 3D graphics. Please open the game in a recent Chrome, Edge, Firefox or Safari with hardware acceleration on.</p>');throw e}
G.renderer.setPixelRatio(1);G.renderer.toneMapping=THREE.ACESFilmicToneMapping;G.renderer.toneMappingExposure=1.35;G.renderer.shadowMap.enabled=true;G.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
G.camera=new THREE.PerspectiveCamera(74,16/9,.05,100);
G.camera.rotation.order='YXZ';
G.flash=new THREE.SpotLight(0xffe0a8,1.6,26,.62,.7,1.2);
G.camera.add(G.flash);
{const ft=new THREE.Object3D();ft.position.set(0,0,-3);G.camera.add(ft);G.flash.target=ft}
G.flash.visible=false;G.flash.castShadow=true;G.flash.shadow.mapSize.set(512,512);G.flash.shadow.camera.near=.2;G.flash.shadow.camera.far=26;G.flash.shadow.bias=-.0008;
G.resize=()=>{
  const r=G.canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  const h=r.height>760?600:r.height>420?480:360,w=Math.round(h*r.width/r.height);
  G.renderer.setSize(w,h,false);G.camera.aspect=w/h;G.camera.updateProjectionMatrix();
};
addEventListener('resize',G.resize);
if(window.ResizeObserver)new ResizeObserver(G.resize).observe(G.canvas);

G.reset=(o={})=>{
  if(G.scene)G.scene.traverse(n=>{if(n.geometry)n.geometry.dispose()});
  G.scene=new THREE.Scene();G.scene.add(G.camera);
  const bg=new THREE.Color(o.bg===undefined?0x000000:o.bg);
  G.scene.background=bg;G.scene.fog=o.fog?new THREE.FogExp2(bg,o.fog):null;
  G.cols=[];G.items=[];G.monsters=[];G.ticks=[];G.grid=null;G.safe=[];G.bounds=o.bounds||null;G.skyMesh=null;G.sunL=null;
  G.over=false;G.cur=null;G.slow=1;G.noRun=false;
  Object.assign(G.P,{hidden:false,still:false,frozen:false,stam:1,tired:false,fear:0,lookT:null,eye:1.05,pitch:0,bob:0});
  G.flashAllowed=!!o.flash;G.flashOn=!!o.flash;G.flash.visible=G.flashOn;
  G.scene.add(new THREE.AmbientLight(o.ambC===undefined?0x404858:o.ambC,o.amb===undefined?.3:o.amb));
  if(o.hemi)G.scene.add(new THREE.HemisphereLight(o.hemi[0],o.hemi[1],o.hemi[2]));
  $('prompt').hidden=true;$('hud').hidden=!o.hud;$('cross').hidden=!o.hud;
  $('mHunger').hidden=!o.hunger;
};

/* ---------- materials (colour + bump, per-pixel lit) ---------- */
const TXB={};
G.mat=(name,rx=1,ry=1,o={})=>{
  const k=name+'|'+rx+'|'+ry+'|'+(o.em||0);if(TXB[k])return TXB[k];
  const T=G.makeTex(name),m0=T.map.clone(),b0=T.bump.clone();
  [m0,b0].forEach(t=>{t.needsUpdate=true;t.repeat.set(rx,ry)});
  const m=new THREE.MeshPhongMaterial({map:m0,bumpMap:b0,bumpScale:o.bump===undefined?1.8:o.bump,specular:o.spec||0x16130f,shininess:o.shin||9});
  if(o.em)m.emissive=new THREE.Color(o.em);
  return TXB[k]=m;
};
const CM={};
G.col=(c,em)=>{const k=c+'|'+(em||'');return CM[k]||(CM[k]=new THREE.MeshPhongMaterial({color:c,emissive:em||0x000000,specular:0x000000,shininess:0}))};
G.basic=c=>{const k='b'+c;return CM[k]||(CM[k]=new THREE.MeshBasicMaterial({color:c}))};

/* ---------- geometry helpers ---------- */
G.box=(w,h,d,mat,x,y,z,o={})=>{
  const ts=o.ts||2,len=Math.max(w,d);
  let rx=Math.max(1,Math.round(len/ts)),ry=Math.max(1,Math.round(h/ts));
  if(typeof mat==='string'&&G.isVert(mat)){ry=1;rx=Math.max(1,Math.round(len/(h*(o.va||1))))}
  const m=typeof mat==='string'?G.mat(mat,rx,ry):mat;
  const mesh=new THREE.Mesh(typeof mat==='string'?new THREE.BoxGeometry(w,h,d):G.RB(w,h,d),m);
  mesh.position.set(x,y,z);mesh.castShadow=o.cast!==false;mesh.receiveShadow=true;G.scene.add(mesh);
  if(o.solid){const c={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,mesh};if(o.pass)c.pass=o.pass;G.cols.push(c);mesh.userData.col=c}
  return mesh;
};
G.floor=(w,d,name,x,y,z,ts=2)=>{
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),typeof name==='string'?G.mat(name,Math.round(w/ts),Math.round(d/ts)):name);
  m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;G.scene.add(m);return m;
};
G.ceiling=(w,d,name,x,y,z,ts=2)=>{
  const m=G.floor(w,d,name,x,y,z,ts);m.rotation.x=Math.PI/2;return m;
};
G.light=(c,i,dist,x,y,z)=>{const l=new THREE.PointLight(c,i,dist,2);l.position.set(x,y,z);G.scene.add(l);return l};
G.hit=(x,z,r)=>{
  const b=G.bounds;if(b&&(x<b.x0+r||x>b.x1-r||z<b.z0+r||z>b.z1-r))return true;
  for(let i=0;i<G.cols.length;i++){const c=G.cols[i];
    if(x>c.x0-r&&x<c.x1+r&&z>c.z0-r&&z<c.z1+r){if(c.pass&&c.pass())continue;return true}}
  return false;
};
G.move=(o,dx,dz,r)=>{if(!G.hit(o.x+dx,o.z,r))o.x+=dx;if(!G.hit(o.x,o.z+dz,r))o.z+=dz};
G.los=(ax,az,bx,bz)=>{
  const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.6);
  for(let i=1;i<n;i++){const t=i/n;if(G.hit(ax+(bx-ax)*t,az+(bz-az)*t,.02))return false}
  return true;
};

/* ---------- navigation grid (BFS) ---------- */
G.buildGrid=(cs,x0,z0,x1,z1,rad=.65)=>{
  const w=Math.ceil((x1-x0)/cs),h=Math.ceil((z1-z0)/cs),b=new Uint8Array(w*h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)b[j*w+i]=G.hit(x0+(i+.5)*cs,z0+(j+.5)*cs,rad)?1:0;
  G.grid={cs,x0,z0,w,h,b};
};
G.nav=(ax,az,bx,bz)=>{
  const g=G.grid;if(!g)return[bx,bz];
  const ci=x=>G.clamp(Math.floor((x-g.x0)/g.cs),0,g.w-1),cj=z=>G.clamp(Math.floor((z-g.z0)/g.cs),0,g.h-1);
  const si=ci(ax),sj=cj(az),ti=ci(bx),tj=cj(bz);
  if(si===ti&&sj===tj)return[bx,bz];
  const N=g.w*g.h,prev=new Int32Array(N).fill(-1),q=new Int32Array(N);let qh=0,qt=0;
  const s=sj*g.w+si,t=tj*g.w+ti;prev[s]=s;q[qt++]=s;
  const D=[1,0,-1,0,0,1,0,-1];
  while(qh<qt){
    const c=q[qh++];if(c===t)break;const ci2=c%g.w,cj2=(c/g.w)|0;
    for(let k=0;k<4;k++){const ni=ci2+D[k*2],nj=cj2+D[k*2+1];
      if(ni<0||nj<0||ni>=g.w||nj>=g.h)continue;const n=nj*g.w+ni;
      if(prev[n]!==-1||(g.b[n]&&n!==t))continue;prev[n]=c;q[qt++]=n}
  }
  if(prev[t]===-1)return[bx,bz];
  let c=t,p=prev[c];while(p!==s){c=p;p=prev[c]}
  return[g.x0+((c%g.w)+.5)*g.cs,g.z0+(((c/g.w)|0)+.5)*g.cs];
};

/* ---------- interaction ---------- */
G.addItem=o=>{o.r=o.r||2.1;G.items.push(o);return o};
G.rmItem=o=>{const i=G.items.indexOf(o);if(i>=0)G.items.splice(i,1);if(o.mesh&&o.mesh.parent)o.mesh.parent.remove(o.mesh);if(G.cur===o)G.cur=null};
G.updateItems=()=>{
  const P=G.P,pr=$('prompt');
  if(P.frozen){G.cur=null;pr.hidden=true;return}
  if(P.hidden){G.cur=null;pr.hidden=false;pr.textContent=G.touch?'tap use to leave':'[E] Leave hiding place';return}
  const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let best=null,bd=1e9;
  for(const it of G.items){
    if(it.off&&it.off())continue;
    const dx=it.x-P.x,dz=it.z-P.z,d=Math.hypot(dx,dz);
    if(d<it.r&&(d<.9||(dx*fx+dz*fz)/d>.3)&&d<bd){best=it;bd=d}
  }
  G.cur=best;
  if(best){const l=typeof best.label==='function'?best.label():best.label;pr.hidden=false;pr.textContent=(G.touch?'use: ':'[E] ')+l}else pr.hidden=true;
};
G.use=()=>{
  if(G.paused||G.P.frozen)return;
  if(G.P.hidden){G.unhide();return}
  const it=G.cur;if(!it)return;
  if(it.hide)G.hide(it);else if(it.use)it.use(it);
};
G.hide=it=>{
  const P=G.P;P.saved={x:P.x,z:P.z,eye:P.eye};P.x=it.hide.x;P.z=it.hide.z;P.eye=it.hide.eye||.55;P.hidden=true;
  G.hidSpot=it;$('vig').dataset.h=1;if(G.sfx)G.sfx.door();
};
G.unhide=()=>{
  const P=G.P;if(!P.hidden)return;delete $('vig').dataset.h;P.hidden=false;if(P.saved){P.x=P.saved.x;P.z=P.saved.z;P.eye=P.saved.eye}G.hidSpot=null;
};
G.shake=(m,t)=>{G.shakeM=m;G.shakeT=t};
G.lookAt=(x,z,y=1)=>{G.P.lookT={x,z,y}};


/* ---------- sky dome, sun/moon, glow sprites ---------- */
G.sky=o=>{
  const W=256,H=128,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),im=g.createImageData(W,H),r=G.rng(o.seed||5);
  const L=(a,b,t)=>a+(b-a)*t,hx=h=>[h>>16&255,h>>8&255,h&255];
  const T=hx(o.top),M=hx(o.mid),B=hx(o.hor),GL=o.glow?hx(o.glow.c):null;
  const nz=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j;const h=(a,b)=>{let n=Math.imul(a*374761393+b*668265263,1274126177);n^=n>>>13;return((n>>>0)%1000)/1000};
    const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return h(i,j)*(1-sx)*(1-sy)+h(i+1,j)*sx*(1-sy)+h(i,j+1)*(1-sx)*sy+h(i+1,j+1)*sx*sy};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const v=y/(H-1);let col;
    if(v<.55)col=T.map((t,i)=>L(t,M[i],v/.55));else col=M.map((m,i)=>L(m,B[i],Math.min(1,(v-.55)/.3)));
    const cn=nz(x/18+3,y/9)*.6+nz(x/8,y/4)*.4,cm=Math.max(0,cn-.5-(o.clear||0))*(1-v*.5)*(o.cloud===undefined?.9:o.cloud);
    if(GL){const dx=(x/W-o.glow.x),dy=(v-o.glow.y),d=Math.hypot(dx*1.6,dy*2.2),k=Math.max(0,1-d/o.glow.r);col=col.map((cv,i)=>cv+GL[i]*k*k*(1+cm*1.2));}
    col=col.map((cv,i)=>L(cv,GL?cv*.55+GL[i]*.35:cv*1.3,cm*1.1));
    if(o.stars&&v<.5&&r()<o.stars*(1-v*2)){const s=130+r()*120;col=[s,s,s*.95]}
    const k=(y*W+x)*4;im.data[k]=col[0];im.data[k+1]=col[1];im.data[k+2]=col[2];im.data[k+3]=255;
  }
  g.putImageData(im,0,0);
  const big=document.createElement('canvas');big.width=1024;big.height=512;const bg=big.getContext('2d');bg.imageSmoothingEnabled=true;bg.drawImage(c,0,0,1024,512);
  if(o.dapple){const rr=G.rng((o.seed||5)*13+1),gc=GL||[255,170,110];
    for(let i=0;i<2600;i++){const x=rr()*1024,y=40+rr()*230,band=nz(x/90+7,y/40)*.8+nz(x/30,y/14)*.4;if(band<.62)continue;
      const lit=Math.max(0,1-Math.hypot((x/1024-(o.glow?o.glow.x:.5))*1.4,(y/512-(o.glow?o.glow.y:.5))*2.4)/.9);
      const w=6+rr()*18,h=2+rr()*5,cc=[T[0]*.5+gc[0]*lit,T[1]*.45+gc[1]*lit*.8,T[2]*.6+gc[2]*lit*.6];
      bg.fillStyle='rgba('+(cc[0]|0)+','+(cc[1]|0)+','+(cc[2]|0)+','+(.22+rr()*.25)+')';bg.beginPath();bg.ellipse(x,y,w,h,0,0,7);bg.fill()}}
  if(o.birds){const rr=G.rng(77);bg.strokeStyle='rgba(20,14,22,.85)';bg.lineWidth=1.6;
    for(let i=0;i<9;i++){const x=o.birds[0]*1024+rr()*70,y=o.birds[1]*512+rr()*30;bg.beginPath();bg.moveTo(x-5,y-2);bg.quadraticCurveTo(x-2,y-4,x,y);bg.quadraticCurveTo(x+2,y-4,x+5,y-2);bg.stroke()}}
  if(o.moon){bg.fillStyle='rgba(255,250,230,.95)';bg.beginPath();bg.arc(o.moon[0]*1024,o.moon[1]*512,10,0,7);bg.fill();bg.fillStyle='rgba(255,250,230,.12)';bg.beginPath();bg.arc(o.moon[0]*1024,o.moon[1]*512,34,0,7);bg.fill()}
  const t=new THREE.CanvasTexture(big);
  const m=new THREE.Mesh(new THREE.SphereGeometry(80,40,24),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,fog:false,depthWrite:false}));
  m.renderOrder=-10;m.frustumCulled=false;G.scene.add(m);G.skyMesh=m;return m;
};
G.sun=(color,inten,dx,dy,dz,reach=42)=>{
  const l=new THREE.DirectionalLight(color,inten);l.castShadow=true;l.shadow.mapSize.set(1024,1024);
  const c=l.shadow.camera;c.left=-reach;c.right=reach;c.top=reach;c.bottom=-reach;c.near=1;c.far=130;l.shadow.bias=-.0007;
  G.scene.add(l);G.scene.add(l.target);G.sunL=l;G.sunDir=[dx,dy,dz];return l;
};
G.glowSprite=(x,y,z,color,size=3,op=.8)=>{
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:G.glowTex(),color,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:op}));
  s.position.set(x,y,z);s.scale.set(size,size,1);G.scene.add(s);return s;
};
const bl=document.getElementById('bloom'),blc=bl?bl.getContext('2d'):null;let bf=0;
try{if(blc)blc.filter='contrast(1.7) brightness(.85)'}catch(e){}
G.bloom=()=>{if(!blc||(bf++&1))return;try{blc.drawImage(G.canvas,0,0,bl.width,bl.height)}catch(e){}};

/* ---------- per-frame ---------- */
G.updatePlayer=dt=>{
  const P=G.P,I=G.in;
  if(P.lookT){
    const dx=P.lookT.x-P.x,dz=P.lookT.z-P.z,ty=Math.atan2(-dx,-dz),tp=Math.atan2(P.lookT.y-P.eye,Math.hypot(dx,dz));
    let dy=ty-P.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
    P.yaw+=dy*Math.min(1,dt*5);P.pitch+=(tp-P.pitch)*Math.min(1,dt*5);
  }
  if(P.frozen||P.hidden||P.still)return;
  let f=I.f,s=I.s;const len=Math.hypot(f,s);if(len>1){f/=len;s/=len}
  const moving=len>.08;
  if(P.stam<=0)P.tired=true;else if(P.stam>.3)P.tired=false;
  const run=I.run&&moving&&!P.tired&&!G.noRun;P.run=run;
  const sp=(run?3.6:2.1)*G.slow;
  if(run)P.stam=Math.max(0,P.stam-dt*.2);else P.stam=Math.min(1,P.stam+dt*(moving?.1:.22));
  const sn=Math.sin(P.yaw),cs=Math.cos(P.yaw);
  G.move(P,(-sn*f+cs*s)*sp*dt,(-cs*f-sn*s)*sp*dt,.28);
  if(moving){P.bob+=dt*(run?12:7);if(G.sfx&&Math.sin(P.bob)>.98&&!P.stepped){P.stepped=true;G.sfx.step(run)}else if(Math.sin(P.bob)<.5)P.stepped=false}
};
let lastFov=0,lastVig=-1;
G.applyCam=dt=>{
  const P=G.P;let sx=0,sy=0;
  if(G.shakeT>0){G.shakeT-=dt;sx=(Math.random()-.5)*G.shakeM;sy=(Math.random()-.5)*G.shakeM}
  G.camera.position.set(P.x+sx,P.eye+Math.sin(P.bob)*.03+sy,P.z);
  G.camera.rotation.set(P.pitch,P.yaw,0);
  const fov=74-P.fear*8;if(Math.abs(fov-lastFov)>.3){lastFov=fov;G.camera.fov=fov;G.camera.updateProjectionMatrix()}
  const v=Math.round(P.fear*20)/20;
  if(v!==lastVig){lastVig=v;$('vig').style.boxShadow='inset 0 0 '+(60+v*80)+'px '+(v*30)+'px rgba(150,12,0,'+(v*.7).toFixed(2)+')'}
  const st=$('mStam').querySelector('b');st.style.width=Math.round(P.stam*100)+'%';st.style.background=P.tired?'#a3321f':'';
};
const gctx=$('grain').getContext('2d');let gf=0;
function grain(){
  if((gf++%3)!==0)return;
  const im=gctx.createImageData(160,90),d=im.data;
  for(let i=0;i<d.length;i+=4){const v=Math.random()*255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}
  gctx.putImageData(im,0,0);
}
G.loop=ts=>{
  requestAnimationFrame(G.loop);
  const dt=Math.min(.05,(ts-G.last)/1000||0);G.last=ts;
  if(!G.scene)return;
  if(!G.paused){
    G.t+=dt;G.updatePlayer(dt);
    G.fearT=0;
    if(G.updateMonsters)G.updateMonsters(dt);
    for(let i=0;i<G.ticks.length;i++)G.ticks[i](dt,G.t);
    G.updateItems();
    G.P.fear+=((G.fearT||0)-G.P.fear)*Math.min(1,dt*2.5);
    if(G.audio&&G.audio.ready)G.audio.setFear(G.P.fear);
  }
  if(G.skyMesh)G.skyMesh.position.copy(G.camera.position);
  if(G.sunL){const d=G.sunDir,P=G.P;G.sunL.position.set(P.x+d[0]*50,d[1]*50,P.z+d[2]*50);G.sunL.target.position.set(P.x,0,P.z);G.sunL.target.updateMatrixWorld()}
  G.applyCam(dt);G.renderer.render(G.scene,G.camera);G.bloom();grain();
};
