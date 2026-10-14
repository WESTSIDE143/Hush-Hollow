'use strict';
/* ---------- people ---------- */
G.part=(g,w,h,d,c,x,y,z,em)=>{const m=new THREE.Mesh(G.RB(w,h,d),G.col(c,em));m.position.set(x,y,z);g.add(m);return m};
G.person=(o={})=>{
  const g=new THREE.Group();
  const cl=o.cloth===undefined?0x6a3a3a:o.cloth,pn=o.pants===undefined?0x2b2b3a:o.pants,sk=o.skin||0xb88a68,hr=o.hair===undefined?0x15110e:o.hair,sl=o.sleeve===undefined?cl:o.sleeve;
  const P=(geo,c,x,y,z,parent)=>{const m=new THREE.Mesh(geo,G.col(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(parent||g).add(m);return m};
  const pivot=(x,y,z)=>{const p=new THREE.Group();p.position.set(x,y,z);g.add(p);return p};
  const legL=pivot(-.1,.74,0),legR=pivot(.1,.74,0);
  [legL,legR].forEach(l=>{P(new THREE.CylinderGeometry(.075,.058,.7,8),pn,0,-.35,0,l);P(new THREE.BoxGeometry(.11,.06,.21),0x1a1410,0,-.72,.04,l)});
  if(o.skirt)P(new THREE.CylinderGeometry(.2,.31,.66,14),o.skirt,0,.55,0);
  const torso=P(new THREE.CylinderGeometry(.19,.16,.62,12),cl,0,1.04,0);torso.scale.set(1,1,.72);
  P(new THREE.SphereGeometry(.2,12,8),cl,0,1.3,0).scale.set(1,.5,.7);
  const armL=pivot(-.27,1.3,0),armR=pivot(.27,1.3,0);
  [armL,armR].forEach(a=>{P(new THREE.CylinderGeometry(.052,.042,.56,8),sl,0,-.28,0,a);P(new THREE.SphereGeometry(.05,8,6),sk,0,-.6,0,a)});
  P(new THREE.CylinderGeometry(.05,.055,.1,8),sk,0,1.4,0);
  const head=P(new THREE.SphereGeometry(.15,16,12),sk,0,1.56,0);head.scale.set(.94,1.12,1);
  const hairCap=P(new THREE.SphereGeometry(.158,16,10,0,Math.PI*2,0,Math.PI*.56),hr,0,1.565,-.01);hairCap.scale.set(.96,1.14,1.02);
  if(o.long){P(new THREE.SphereGeometry(.17,10,8),hr,0,1.42,-.07).scale.set(.95,1.7,.62)}
  P(new THREE.ConeGeometry(.02,.05,5),sk,0,1.55,.15).rotation.x=Math.PI/2;
  [-1,1].forEach(s=>P(new THREE.SphereGeometry(.014,6,5),0x0a0806,s*.055,1.585,.14));
  g.scale.setScalar(o.scale||1);g.userData={legL,legR,armL,armR,head,torso,ph:Math.random()*6};
  return g;
};
G.animPerson=(g,moving,t)=>{
  const u=g.userData,s=moving?Math.sin(t*7+u.ph)*.5:0;
  u.legL.rotation.x=s;u.legR.rotation.x=-s;u.armL.rotation.x=-s*.8;u.armR.rotation.x=s*.8;
  g.position.y=moving?Math.abs(Math.sin(t*7+u.ph))*.03:0;
};
G.faceTo=(g,x,z)=>{g.rotation.y=Math.atan2(x-g.position.x,z-g.position.z)};

/* ---------- maze ---------- */
G.maze=o=>{
  const n=o.n,cs=o.cs,H=o.h,T=o.t||.35,rng=G.rng(o.seed||3),x0=-n*cs/2,z0=-n*cs/2;
  const R=[],D=[],vis=[];
  for(let i=0;i<n;i++){R.push(new Array(n).fill(true));D.push(new Array(n).fill(true));vis.push(new Array(n).fill(false))}
  const st=[[0,0]];vis[0][0]=true;
  while(st.length){
    const [i,j]=st[st.length-1],nb=[];
    if(i<n-1&&!vis[i+1][j])nb.push([i+1,j,1]);if(i>0&&!vis[i-1][j])nb.push([i-1,j,2]);
    if(j<n-1&&!vis[i][j+1])nb.push([i,j+1,3]);if(j>0&&!vis[i][j-1])nb.push([i,j-1,4]);
    if(!nb.length){st.pop();continue}
    const [a,b,k]=nb[(rng()*nb.length)|0];
    if(k===1)R[i][j]=false;else if(k===2)R[a][b]=false;else if(k===3)D[i][j]=false;else D[a][b]=false;
    vis[a][b]=true;st.push([a,b]);
  }
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){if(i<n-1&&R[i][j]&&rng()<(o.open||0))R[i][j]=false;if(j<n-1&&D[i][j]&&rng()<(o.open||0))D[i][j]=false}
  const wm=o.wall,tm=o.ts||3;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    if(i<n-1&&R[i][j])G.box(T,H,cs+T,wm,x0+(i+1)*cs,H/2,z0+(j+.5)*cs,{solid:true,ts:tm});
    if(j<n-1&&D[i][j])G.box(cs+T,H,T,wm,x0+(i+.5)*cs,H/2,z0+(j+1)*cs,{solid:true,ts:tm});
  }
  const L=n*cs;
  G.box(L+T,H,T,wm,0,H/2,z0,{solid:true,ts:tm});G.box(L+T,H,T,wm,0,H/2,z0+L,{solid:true,ts:tm});
  G.box(T,H,L+T,wm,x0,H/2,0,{solid:true,ts:tm});G.box(T,H,L+T,wm,x0+L,H/2,0,{solid:true,ts:tm});
  if(o.floor)G.floor(L,L,o.floor,0,0,0,o.fts||2);
  if(o.ceil)G.ceiling(L,L,o.ceil,0,H,0,o.cts||2);
  const dead=[];
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const open=(i<n-1&&!R[i][j]?1:0)+(i>0&&!R[i-1][j]?1:0)+(j<n-1&&!D[i][j]?1:0)+(j>0&&!D[i][j-1]?1:0);
    if(open===1&&(i+j)>3)dead.push([i,j]);
  }
  const m={n,cs,x0,z0,H,R,D,dead,L,cell:(i,j)=>[x0+(i+.5)*cs,z0+(j+.5)*cs],rng};
  G.bounds={x0:x0+T/2,x1:x0+L-T/2,z0:z0+T/2,z1:z0+L-T/2};
  return m;
};
G.lampPanel=(x,y,z,w=1.6,d=.8,c=0xfff6c8)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.06,d),G.basic(c));m.position.set(x,y,z);G.scene.add(m);return m};

/* ---------- glowing pickups, fire, drawings ---------- */
G.glow=(x,y,z,color,size=.3)=>{
  const m=new THREE.Mesh(new THREE.OctahedronGeometry(size*.75,0),G.basic(color));m.scale.set(1,1,.35);m.position.set(x,y,z);
  const l=new THREE.PointLight(color,.9,7,2);m.add(l);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:G.glowTex(),color,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.85}));sp.scale.set(size*5,size*5,1);m.add(sp);G.scene.add(m);
  G.ticks.push((dt,t)=>{if(m.parent){m.rotation.y=t*1.5;m.rotation.x=t*.9;m.position.y=y+Math.sin(t*2+x)*.08}});
  return m;
};
G.fire=(x,z)=>{
  const g=new THREE.Group();g.position.set(x,0,z);G.scene.add(g);
  const lm=G.mat('bark',1,1);
  for(let i=0;i<5;i++){const l=G.M(new THREE.CylinderGeometry(.07,.08,.9,7),lm,0,.12+i*.015,0,g);l.rotation.z=Math.PI/2;l.rotation.y=i*Math.PI/5+.3}
  const fl=[];[[.2,.75,0xd9621c,0x662200],[.15,.62,0xf0a02e,0x884400],[.09,.45,0xffe08a,0xaa8830]].forEach((c,i)=>{
    const m=new THREE.Mesh(new THREE.ConeGeometry(c[0],c[1],7),new THREE.MeshPhongMaterial({color:c[2],emissive:c[3],shininess:0}));m.position.set(0,.3+c[1]/2,0);g.add(m);fl.push(m)});
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:G.glowTex(),color:0xff9a40,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.9}));sp.scale.set(3.2,3.2,1);sp.position.y=.7;g.add(sp);
  const light=new THREE.PointLight(0xff9a40,1.7,19,2);light.position.set(0,1.1,0);light.castShadow=false;g.add(light);
  const f={g,light,x,z,t:0};
  G.ticks.push((dt,t)=>{
    const k=1+Math.sin(t*13+x)*.12+Math.sin(t*23)*.08;light.intensity=1.6*k;sp.scale.setScalar(3.2*k);
    fl.forEach((m,i)=>{m.scale.y=k*(1+Math.sin(t*9+i*2)*.15);m.scale.x=m.scale.z=1+Math.sin(t*11+i)*.1;m.rotation.y=t*2+i});
    if(Math.random()<.03&&G.sfx)G.sfx.crackle();
  });
  return f;
};
G.drawingTex=kind=>{
  const c=document.createElement('canvas');c.width=48;c.height=36;const g=c.getContext('2d');
  g.fillStyle='#e9e0c4';g.fillRect(0,0,48,36);g.fillStyle='#d8cfb2';for(let i=0;i<40;i++)g.fillRect((i*13)%48,(i*7)%36,1,1);
  const P=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
  if(kind===0){P('#d8a020',3,3,7,7);P('#d8a020',1,6,11,1);P('#a03a2a',16,16,22,16);P('#a03a2a',14,13,26,3);P('#3a6a3a',26,24,5,8);P('#2a5aa0',19,19,4,4);P('#2a5aa0',33,19,4,4)}
  else if(kind===1){P('#202020',14,8,6,6);P('#202020',16,14,2,12);P('#202020',12,16,10,1);P('#202020',14,26,2,6);P('#202020',18,26,2,6);
    P('#b03030',28,12,5,5);P('#b03030',30,17,2,10);P('#b03030',25,19,10,1);P('#b03030',28,27,2,5);P('#b03030',31,27,2,5);P('#202020',22,20,4,1);P('#d83030',33,5,4,3);P('#d83030',35,4,2,2)}
  else{P('#6a4a2a',22,14,4,20);P('#3a7a3a',14,4,20,12);P('#e0c020',6,4,3,3);P('#e0c020',39,8,3,3);P('#e0c020',9,22,3,3);P('#3a7a3a',2,34,44,2)}
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;return t;
};
G.staticTex=()=>{
  const c=document.createElement('canvas');c.width=32;c.height=24;const g=c.getContext('2d');
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;
  t.userData={draw:()=>{const im=g.createImageData(32,24);for(let i=0;i<im.data.length;i+=4){const v=60+Math.random()*190;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}g.putImageData(im,0,0);t.needsUpdate=true}};
  t.userData.draw();return t;
};

/* floating dust in light, and printed posters */
G.dust=(b,n=140,color=0xffe0b0,size=.035,op=.55)=>{
  const geo=new THREE.BufferGeometry(),a=new Float32Array(n*3),r=G.rng(5),ph=[];
  for(let i=0;i<n;i++){a[i*3]=b[0]+(b[1]-b[0])*r();a[i*3+1]=b[2]+(b[3]-b[2])*r();a[i*3+2]=b[4]+(b[5]-b[4])*r();ph.push(r()*6)}
  geo.setAttribute('position',new THREE.BufferAttribute(a,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({color,size,map:G.glowTex(),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));
  pts.frustumCulled=false;G.scene.add(pts);
  G.ticks.push((dt,t)=>{const p=geo.attributes.position.array;for(let i=0;i<n;i++){p[i*3]+=Math.sin(t*.25+ph[i])*.0007;p[i*3+1]+=Math.sin(t*.4+ph[i]*2)*.0005-.0001;p[i*3+2]+=Math.cos(t*.22+ph[i])*.0007}geo.attributes.position.needsUpdate=true});
  return pts;
};
G.poster=(kind,w,h)=>{
  const c=document.createElement('canvas');c.width=256;c.height=Math.round(256*h/w);const g=c.getContext('2d'),R=G.rng(kind.length*7+3);
  g.fillStyle=kind==='alpha'?'#e8dfb8':kind==='map'?'#cfd8c0':'#d8c9a0';g.fillRect(0,0,c.width,c.height);
  for(let i=0;i<500;i++){g.fillStyle='rgba(90,70,40,'+R()*.06+')';g.fillRect(R()*c.width,R()*c.height,12,3)}
  if(kind==='alpha'){const cols=['#c0392b','#2a6fb0','#2f8f4a','#d4a017'];g.font='bold 34px sans-serif';g.textBaseline='top';for(let i=0;i<24;i++){g.fillStyle=cols[i%4];g.fillText(String.fromCharCode(65+i),10+(i%6)*40,10+Math.floor(i/6)*52)}}
  else if(kind==='map'){g.fillStyle='#7aa0c8';g.fillRect(14,14,c.width-28,c.height-28);g.fillStyle='#8ab070';for(let i=0;i<9;i++){g.beginPath();g.ellipse(30+R()*190,30+R()*(c.height-60),14+R()*34,10+R()*22,R()*3,0,7);g.fill()}}
  else{g.fillStyle='#ff9933';g.fillRect(16,30,c.width-32,40);g.fillStyle='#fff';g.fillRect(16,70,c.width-32,40);g.fillStyle='#138808';g.fillRect(16,110,c.width-32,40);g.strokeStyle='#1a2a8a';g.lineWidth=2;g.beginPath();g.arc(c.width/2,90,16,0,7);g.stroke()}
  g.strokeStyle='rgba(60,40,20,.7)';g.lineWidth=4;g.strokeRect(2,2,c.width-4,c.height-4);
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshPhongMaterial({map:t,specular:0,shininess:0}));m.receiveShadow=true;return m;
};
