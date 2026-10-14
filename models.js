'use strict';
/* Modelled props: pines, rocks, grass, lathe-turned objects and furniture. */
G.M=(geo,mat,x=0,y=0,z=0,parent)=>{
  const m=new THREE.Mesh(geo,typeof mat==='string'?G.mat(mat,1,1):mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(parent||G.scene).add(m);return m;
};
const jit=(geo,amt,seed)=>{const p=geo.attributes.position,r=G.rng(seed||3);for(let i=0;i<p.count;i++){p.setXYZ(i,p.getX(i)+(r()-.5)*amt,p.getY(i)+(r()-.5)*amt,p.getZ(i)+(r()-.5)*amt)}geo.computeVertexNormals();return geo};
const V2=(a)=>a.map(p=>new THREE.Vector2(p[0],p[1]));
G.lathe=(pts,mat,seg=14)=>{const m=new THREE.Mesh(new THREE.LatheGeometry(V2(pts),seg),mat);m.castShadow=true;m.receiveShadow=true;return m};

/* soft-edged box: every prop uses this instead of a hard cube */
G.RB=(w,h,d,r)=>{
  const m=Math.min(w,h,d);r=Math.min(r===undefined?Math.max(.008,m*.28):r,m*.49,.09);
  const g=new THREE.BoxGeometry(w,h,d,2,2,2),p=g.attributes.position,n=g.attributes.normal;
  const hx=w/2-r,hy=h/2-r,hz=d/2-r;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const ix=Math.max(-hx,Math.min(hx,x)),iy=Math.max(-hy,Math.min(hy,y)),iz=Math.max(-hz,Math.min(hz,z));
    let dx=x-ix,dy=y-iy,dz=z-iz;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;
    p.setXYZ(i,ix+dx*r,iy+dy*r,iz+dz*r);n.setXYZ(i,dx,dy,dz);
  }
  return g;
};
const hs3=(x,y,z)=>{const s=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return s-Math.floor(s)};
const vn3=(x,y,z)=>{const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),fx=x-i,fy=y-j,fz=z-k,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);
  const L=(a,b,t)=>a+(b-a)*t;
  return L(L(L(hs3(i,j,k),hs3(i+1,j,k),u),L(hs3(i,j+1,k),hs3(i+1,j+1,k),u),v),L(L(hs3(i,j,k+1),hs3(i+1,j,k+1),u),L(hs3(i,j+1,k+1),hs3(i+1,j+1,k+1),u),v),w)};
/* craggy stone: radial noise on shared positions, so there are never holes or cracks */
G.stoneGeo=(seed,detail=2,rough=.3)=>{
  const g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position,sd=(seed||1)*7.13;
  for(let i=0;i<p.count;i++){
    let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const l=Math.hypot(x,y,z)||1;x/=l;y/=l;z/=l;
    let d=1+rough*(vn3(x*1.5+sd,y*1.5,z*1.5)-.5)*2+rough*.45*(vn3(x*3.4+sd,y*3.4,z*3.4)-.5)*2+rough*.16*(vn3(x*8+sd,y*8,z*8)-.5)*2;
    if(y<-.25)y=-.25+(y+.25)*.3;
    p.setXYZ(i,x*d,y*d,z*d);
  }
  g.computeVertexNormals();return g;
};
G.rock=(x,z,size,seed,solid)=>{
  const m=G.M(G.stoneGeo(seed||1,2,.3),G.mat('rockg',2,2,{bump:2.2}),x,size*.38,z);
  m.scale.set(size,size*(.6+((seed||1)%3)*.1),size*.85);m.rotation.y=(seed||1)*1.7;
  if(solid)G.cols.push({x0:x-size*.8,x1:x+size*.8,z0:z-size*.7,z1:z+size*.7});
  return m;
};
/* a boulder is a few stones leaning together */
G.boulder=(x,z,size,seed)=>{
  G.rock(x,z,size,seed,true);G.rock(x+size*.7,z+size*.3,size*.62,(seed||1)+3,false);G.rock(x-size*.5,z+size*.55,size*.5,(seed||1)+5,false);
};
/* a berry bush: woody stems, a dome of real leaves, and round glossy berries */
G.bush=(x,z,s=1,berries=true,seed=1)=>{
  const r=G.rng(seed*97+5),g=new THREE.Group();g.position.set(x,0,z);G.scene.add(g);
  const wood=G.mat('bark',1,2,{bump:1.5});
  for(let i=0;i<7;i++){const a=r()*6.28,l=.5+r()*.45,st=G.M(new THREE.CylinderGeometry(.012*s,.022*s,l*s,5),wood,Math.cos(a)*.14*s,l*.45*s,Math.sin(a)*.14*s,g);st.rotation.set(Math.sin(a)*.7,0,-Math.cos(a)*.7)}
  const N=130,leaf=new THREE.SphereGeometry(1,7,5);
  const lm=new THREE.MeshPhongMaterial({color:0xffffff,specular:0x2a3a22,shininess:14});
  const im=new THREE.InstancedMesh(leaf,lm,N),dm=new THREE.Object3D(),col=new THREE.Color();
  for(let i=0;i<N;i++){
    const a=r()*6.28,e=Math.acos(r()*.92),rad=(.3+r()*.32)*s;
    dm.position.set(Math.cos(a)*Math.sin(e)*rad*1.1,.2*s+Math.cos(e)*rad*1.15,Math.sin(a)*Math.sin(e)*rad*1.1);
    dm.rotation.set((r()-.5)*1.6,r()*6.28,(r()-.5)*1.6);const k=(.8+r()*.8)*s;dm.scale.set(.11*k,.016*k,.058*k);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);
    col.setHSL(.27+r()*.07,.45+r()*.2,.14+r()*.14);im.setColorAt(i,col);
  }
  im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;g.add(im);
  const bm=new THREE.MeshPhongMaterial({color:0xb01a2c,emissive:0x2a0408,specular:0xffc0c0,shininess:90}),bs=[];
  if(berries)for(let i=0;i<16;i++){
    const a=r()*6.28,e=.25+r()*.9,rad=(.36+r()*.12)*s;
    const b=G.M(new THREE.SphereGeometry(.034*s,12,10),bm,Math.cos(a)*Math.sin(e)*rad*1.1,.2*s+Math.cos(e)*rad*1.1,Math.sin(a)*Math.sin(e)*rad*1.1,g);
    const sp=G.M(new THREE.CylinderGeometry(.002*s,.002*s,.05*s,4),G.col(0x2a3a1a),b.position.x,b.position.y+.04*s,b.position.z,g);bs.push(b,sp);
  }
  return{g,bs};
};
/* ferns from the same drooping-frond geometry as the pines */
G.ferns=(pts,r)=>{
  const geo=G.whorlGeo(6),m=new THREE.MeshPhongMaterial({map:G.frondTex(),alphaTest:.45,side:THREE.DoubleSide,color:0x6a8a50,specular:0,shininess:0});
  const im=new THREE.InstancedMesh(geo,m,pts.length),dm=new THREE.Object3D();
  pts.forEach((p,i)=>{const s=.4+r()*.5;dm.position.set(p[0],.12,p[1]);dm.scale.set(s,s*1.3,s);dm.rotation.set(0,r()*6.28,0);dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});
  im.frustumCulled=false;im.receiveShadow=true;G.scene.add(im);
};
/* pine forest: instanced trunks + whorls of drooping needle fronds (alpha cards) */
G.frondTex=(()=>{let t=null;return()=>{if(t)return t;
  const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d'),R=G.rng(21);
  g.lineCap='round';
  g.strokeStyle='#2a1c10';g.lineWidth=3;g.beginPath();g.moveTo(0,64);g.lineTo(250,64);g.stroke();
  for(let i=0;i<340;i++){
    const x=6+R()*240,len=(54-x*.15)*(.6+R()*.5),side=R()<.5?-1:1,ang=.7+R()*.5;
    const k=R(),col='rgb('+(16+k*26|0)+','+(44+k*46|0)+','+(24+k*20|0)+')';
    g.strokeStyle=col;g.lineWidth=1.6+R()*1.2;g.beginPath();g.moveTo(x,64);
    g.lineTo(x+Math.cos(ang)*len*.7,64+side*Math.sin(ang)*len);g.stroke();
  }
  for(let i=0;i<60;i++){const x=R()*250,side=R()<.5?-1:1;g.strokeStyle='rgba(120,150,70,.55)';g.lineWidth=1;g.beginPath();g.moveTo(x,64);g.lineTo(x+14,64+side*(10+R()*16));g.stroke()}
  t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}})();
G.whorlGeo=(arms=7)=>{
  const pos=[],uv=[],idx=[],SEG=4;let v0=0;
  for(let a=0;a<arms;a++){
    const ang=a*Math.PI*2/arms+(a%2)*.12,dx=Math.cos(ang),dz=Math.sin(ang),px=-dz,pz=dx;
    for(let i=0;i<=SEG;i++){
      const s=i/SEG,y=.06*Math.sin(s*3)-.3*s*s,w=.5*(.25+.75*Math.min(1,s*2.4))*(1-.3*s);
      [-1,1].forEach((sd,j)=>{pos.push(dx*s*1.0+px*w*sd*.5,y,dz*s*1.0+pz*w*sd*.5);uv.push(s,j?1:0)});
    }
    for(let i=0;i<SEG;i++){const q=v0+i*2;idx.push(q,q+1,q+2,q+1,q+3,q+2)}
    v0+=(SEG+1)*2;
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);   // lit from above like a canopy
  return g;
};
G.pineForest=(pts,r,LAY=12,shadow=true)=>{
  const n=pts.length,dm=new THREE.Object3D();
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.2,.62,1,10),G.mat('bark',2,6,{bump:2.8}),n);
  const fm=new THREE.MeshPhongMaterial({map:G.frondTex(),alphaTest:.45,side:THREE.DoubleSide,specular:0x0a0c06,shininess:6,color:0xbfd0a8});
  const layers=[],geo=G.whorlGeo(8);
  for(let k=0;k<LAY;k++)layers.push(new THREE.InstancedMesh(geo,fm,n));
  pts.forEach((p,i)=>{
    const x=p[0],z=p[1],s=p[2],H=15*s;
    dm.position.set(x,H*.5,z);dm.scale.set(s,H,s);dm.rotation.set(0,r()*6,0);dm.updateMatrix();trunk.setMatrixAt(i,dm.matrix);
    for(let k=0;k<LAY;k++){
      const t=k/(LAY-1),y=H*(.16+t*.8),rad=s*(3.6-3.0*t)*(1+(r()-.5)*.3);
      dm.position.set(x,y,z);dm.scale.set(rad,rad*(1.1-.3*t),rad);dm.rotation.set((r()-.5)*.1,r()*6,(r()-.5)*.1);dm.updateMatrix();layers[k].setMatrixAt(i,dm.matrix);
    }
  });
  [trunk,...layers].forEach(m=>{m.instanceMatrix.needsUpdate=true;m.castShadow=shadow;m.receiveShadow=shadow;m.frustumCulled=false;G.scene.add(m)});
};
G.grass=(pts,r,color=0xffffff)=>{
  const mat=new THREE.MeshPhongMaterial({map:G.bladeTex(),alphaTest:.5,side:THREE.DoubleSide,specular:0x000000,shininess:0,color});
  const dm=new THREE.Object3D(),geo=new THREE.PlaneGeometry(1,1);geo.translate(0,.5,0);
  const a=new THREE.InstancedMesh(geo,mat,pts.length),b=new THREE.InstancedMesh(geo,mat,pts.length);
  pts.forEach((p,i)=>{const s=.7+r()*.9;dm.position.set(p[0],0,p[1]);dm.scale.set(s*1.1,s*.8,s);dm.rotation.set(0,r()*3,0);dm.updateMatrix();a.setMatrixAt(i,dm.matrix);
    dm.rotation.y+=Math.PI/2;dm.updateMatrix();b.setMatrixAt(i,dm.matrix)});
  [a,b].forEach(m=>{m.instanceMatrix.needsUpdate=true;m.receiveShadow=true;m.frustumCulled=false;G.scene.add(m)});
};
G.hills=(color,fogged=true,sc=1)=>{
  // ring of low hills beyond the play area, silhouetted against the sky
  const g=new THREE.CylinderGeometry(78,78,22,48,6,true),p=g.attributes.position,r=G.rng(8);
  for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),y=p.getY(i);const h=Math.max(0,y+11)/22;p.setY(i,y+Math.sin(a*5)*3*h+Math.sin(a*11+1)*1.6*h+(r()-.5)*.4*h)}
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,side:THREE.BackSide,fog:fogged}));m.position.y=-4*sc;m.scale.set(sc,sc*.55,sc);G.scene.add(m);return m;
};

/* objects */
G.bottle=(c=0x2f7a48)=>{
  const g=new THREE.Group();
  const m=new THREE.MeshPhongMaterial({color:c,emissive:0x061a0c,transparent:true,opacity:.88,shininess:90,specular:0x88aa88});
  g.add(G.lathe([[0,0],[.05,0],[.056,.03],[.056,.2],[.03,.27],[.022,.33],[.027,.355],[.0,.355]],m,12));
  return g;
};
G.pot=(c=0x8a8a88)=>{
  const g=new THREE.Group(),m=new THREE.MeshPhongMaterial({color:c,shininess:50,specular:0x666666});
  g.add(G.lathe([[0,0],[.14,0],[.18,.05],[.2,.2],[.19,.23],[.0,.23]],m,14));
  const h=G.M(new THREE.TorusGeometry(.06,.012,6,10),m,.21,.15,0,g);h.rotation.y=Math.PI/2;
  return g;
};
G.table=(w,d,h,mat='wood')=>{
  const g=new THREE.Group();G.M(G.RB(w,.06,d),G.mat(mat,Math.max(1,w|0),1),0,h-.03,0,g);
  const lm=G.col(0x4a2e1c);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(s=>G.M(new THREE.CylinderGeometry(.035,.028,h-.06,8),lm,s[0]*(w/2-.07),(h-.06)/2,s[1]*(d/2-.07),g));
  return g;
};
G.stool=()=>{
  const g=new THREE.Group(),m=G.col(0x5a3a22);G.M(new THREE.CylinderGeometry(.17,.17,.045,12),m,0,.36,0,g);
  [0,1,2].forEach(i=>{const a=i*2.094+.5,l=G.M(new THREE.CylinderGeometry(.022,.018,.36,6),m,Math.cos(a)*.1,.18,Math.sin(a)*.1,g);l.rotation.z=Math.cos(a)*.1;l.rotation.x=-Math.sin(a)*.1});
  return g;
};
G.bed=()=>{
  const g=new THREE.Group(),wood=G.col(0x4a3220);
  G.M(G.RB(1.9,.14,1),wood,0,.16,0,g);
  [[-.9,-.45],[.9,-.45],[-.9,.45],[.9,.45]].forEach(p=>G.M(new THREE.CylinderGeometry(.04,.04,.18,6),wood,p[0],.09,p[1],g));
  G.M(G.RB(1.84,.14,.94),G.mat('cloth',2,1,{bump:1}),0,.3,0,g);
  const bl=G.M(G.RB(1.2,.07,.98),G.col(0x3c4c5e),.32,.4,0,g);
  const pl=G.M(new THREE.SphereGeometry(.2,10,8),G.col(0xb8b2a0),-.7,.42,0,g);pl.scale.set(1.3,.45,1.5);
  G.M(G.RB(.06,.5,1),wood,-.95,.4,0,g);
  return g;
};
G.doorModel=(w=1.0,h=2.1,c=0x3a2a1c)=>{
  const g=new THREE.Group(),m=G.col(c);
  G.M(G.RB(w,h,.08),m,0,h/2,0,g);
  [[.0,h*.7],[.0,h*.28]].forEach(p=>G.M(G.RB(w*.7,h*.32,.02),G.col(c-0x0a0a0a),p[0],p[1],.045,g));
  G.M(new THREE.SphereGeometry(.035,8,6),new THREE.MeshPhongMaterial({color:0xb08a3a,shininess:80}),w*.38,h*.48,.07,g);
  const fm=G.col(0x2a1c12);G.M(G.RB(.08,h+.08,.14),fm,-w/2-.04,h/2,0,g);G.M(G.RB(.08,h+.08,.14),fm,w/2+.04,h/2,0,g);G.M(G.RB(w+.16,.08,.14),fm,0,h+.04,0,g);
  return g;
};
G.windowModel=(w,h,glow=0x23406a)=>{
  const g=new THREE.Group(),fm=G.col(0x30221a);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:glow}));gl.position.z=.01;g.add(gl);
  G.M(G.RB(w+.1,.06,.1),fm,0,h/2+.03,0,g);G.M(G.RB(w+.1,.06,.1),fm,0,-h/2-.03,0,g);
  G.M(G.RB(.05,h,.1),fm,-w/2-.02,0,0,g);G.M(G.RB(.05,h,.1),fm,w/2+.02,0,0,g);G.M(G.RB(.04,h,.08),fm,0,0,.02,g);G.M(G.RB(w,.04,.08),fm,0,0,.02,g);
  return g;
};
G.bulb=(x,y,z,color=0xffc070,inten=1.2,dist=11)=>{
  G.M(new THREE.CylinderGeometry(.008,.008,.5,4),G.col(0x111111),x,y+.28,z);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:0xfff0c8}));b.position.set(x,y,z);G.scene.add(b);
  G.glowSprite(x,y,z,color,1.6,.9);
  const l=new THREE.PointLight(color,inten,dist,2);l.position.set(x,y-.1,z);G.scene.add(l);return l;
};
/* an old fridge with its door open, warm light spilling out */
G.fridge=(sparse=true)=>{
  const g=new THREE.Group(),body=new THREE.MeshPhongMaterial({color:0xd6d0be,shininess:35,specular:0x555544});
  G.M(G.RB(.8,1.5,.72),body,0,.75,0,g);
  G.M(G.RB(.7,1.4,.5),G.col(0xe8e2cc,0x20180c),0,.75,.07,g).material.side=THREE.BackSide;
  const sh=G.col(0x888a84);[.45,.8,1.15].forEach(y=>G.M(G.RB(.68,.015,.5),sh,0,y,.08,g));
  const door=new THREE.Group();door.position.set(-.4,0,.36);door.rotation.y=-1.7;g.add(door);
  G.M(G.RB(.8,1.46,.07),body,.4,.75,0,door);G.M(G.RB(.04,.24,.04),G.col(0x222222),.7,.95,.06,door);
  const food=(geo,c,x,y,z,sx=1,sy=1,sz=1)=>{const m=G.M(geo,G.col(c),x,y,z,g);m.scale.set(sx,sy,sz);return m};
  food(new THREE.SphereGeometry(.07,8,6),0xc8a050,-.15,.5,.1,1,.8,1);
  G.M(new THREE.CylinderGeometry(.09,.07,.07,10),new THREE.MeshPhongMaterial({color:0xaaaaaa,shininess:70}),.05,.485,.12,g);
  g.add(G.bottle(0x88bbdd).translateX(.22).translateY(.455).translateZ(.12));
  if(!sparse){food(new THREE.SphereGeometry(.1,8,6),0xe08a30,-.2,.9,.1,1.3,.8,1);for(let i=0;i<4;i++)food(new THREE.SphereGeometry(.035,6,5),0xeee6d0,.1+i*.07,.84,.1,1,1.3,1)}
  const l=new THREE.PointLight(0xffd8a0,1.1,6,2);l.position.set(0,1,.5);g.add(l);g.userData.light=l;
  return g;
};
G.deskModel=()=>{
  const g=new THREE.Group(),w=G.mat('wood',1,1);
  G.M(G.RB(.9,.05,.55),w,0,.6,0,g);
  [[-.4,-.22],[.4,-.22],[-.4,.22],[.4,.22]].forEach(p=>G.M(new THREE.CylinderGeometry(.018,.018,.6,6),G.col(0x555a5c),p[0],.3,p[1],g));
  G.M(G.RB(.4,.04,.4),w,0,.34,.68,g);G.M(G.RB(.4,.4,.04),w,0,.55,.88,g);
  [[-.17,.5],[.17,.5],[-.17,.86],[.17,.86]].forEach(p=>G.M(new THREE.CylinderGeometry(.014,.014,.34,6),G.col(0x555a5c),p[0],.17,p[1]-.0,g));
  return g;
};
G.locker=(c=0x4a5e6a)=>{
  const g=new THREE.Group(),m=new THREE.MeshPhongMaterial({color:c,shininess:30,specular:0x445555});
  G.M(G.RB(.5,2,.5),m,0,1,0,g);
  for(let i=0;i<4;i++)G.M(G.RB(.3,.015,.02),G.col(0x111111),0,1.6+i*.05,.26,g);
  G.M(G.RB(.03,.14,.03),G.col(0x999999),.17,1.0,.27,g);
  return g;
};
