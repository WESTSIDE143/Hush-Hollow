'use strict';
/* ---------- beat interpreter for the real-life scenes ---------- */
G.reach=(x,z,r=1.6)=>new Promise(res=>{const f=()=>{if(Math.hypot(G.P.x-x,G.P.z-z)<r){const i=G.ticks.indexOf(f);if(i>=0)G.ticks.splice(i,1);res()}};G.ticks.push(f)});
G.interact=(x,z,label,r=2.3)=>new Promise(res=>{const it=G.addItem({x,z,r,label,use:()=>{G.rmItem(it);res()}})});
G.walker=(g,speed=1.3)=>{
  const w={g,tx:g.position.x,tz:g.position.z,speed,res:null,moving:false};
  G.ticks.push((dt,t)=>{
    const dx=w.tx-g.position.x,dz=w.tz-g.position.z,d=Math.hypot(dx,dz);
    if(d>.08){const s=Math.min(d,w.speed*dt);g.position.x+=dx/d*s;g.position.z+=dz/d*s;g.rotation.y=Math.atan2(dx,dz);w.moving=true;G.animPerson(g,true,t)}
    else{if(w.moving){w.moving=false;G.animPerson(g,false,t);if(w.res){const r=w.res;w.res=null;r()}}}
  });
  w.go=(x,z)=>new Promise(res=>{w.tx=x;w.tz=z;if(Math.hypot(x-g.position.x,z-g.position.z)<.1){res();return}w.res=res});
  w.face=(x,z)=>{g.rotation.y=Math.atan2(x-g.position.x,z-g.position.z)};
  return w;
};
G.beats=async list=>{
  for(const b of list){
    const k=b[0];
    if(k==='say')await G.say(b[2],b[3]||2800,b[1]||undefined);
    else if(k==='obj')G.obj(b[1]);
    else if(k==='reach')await G.reach(b[1],b[2],b[3]);
    else if(k==='use')await G.interact(b[1],b[2],b[3]);
    else if(k==='wait')await G.wait(b[1]);
    else if(k==='card')await G.card(b[1],b[2]);
    else if(k==='fn')await b[1]();
    else if(k==='mom')await G.mom.go(b[1],b[2]);
    else if(k==='dad')await G.dad.go(b[1],b[2]);
    else if(k==='sfx'){const f=G.sfx[b[1]];if(f)f(...(b.slice(2)))}
    else if(k==='muffle')G.audio.muffle(b[1]);
    else if(k==='amb')G.audio.ambience(b[1]);
    else if(k==='shake')G.shake(b[1],b[2]);
    else if(k==='still')G.P.still=b[1];
    else if(k==='look')G.lookAt(b[1],b[2],b[3]);
    else if(k==='unlook')G.P.lookT=null;
    else if(k==='held')G.heldSet(b[1]);
    else if(k==='eat')await G.eat();
    else if(k==='sit')await G.sit();
    else if(k==='stand')await G.standUp();
    else if(k==='lie')await G.lie();
    else if(k==='eyes')await G.eyes();
    else if(k==='fade')await G.fade(b[1],b[2]||900);
    else if(k==='choice'){const i=await G.choice(b[1],b[2]);await G.beats(b[3+i]||[])}
  }
};
G.sleepOut=async()=>{G.P.still=true;G.sfx.wake&&0;await G.fade(1,1800)};

/* ---------- the house ---------- */
G.buildHome=(o={})=>{
  G.reset({bg:0x040302,fog:.04,amb:.34,ambC:0x7a6850,hemi:[0x8a7458,0x100c08,.3],flash:false,hud:true,bounds:{x0:-4.2,x1:4.2,z0:-2.7,z1:2.7}});
  const S=G.scene;G.audio.ambience('home');G.audio.muffle(false);
  G.floor(9,6,'concrete',0,0,0,1.5);G.ceiling(9,6,'metal',0,2.6,0,1.5);
  G.box(9.2,2.6,.2,'plaster',0,1.3,-3.1,{});G.box(9.2,2.6,.2,'plaster',0,1.3,3.1,{});G.box(.2,2.6,6,'plaster',-4.5,1.3,0,{});G.box(.2,2.6,6,'plaster',4.5,1.3,0,{});
  // skirting + tin-roof beams
  const bm=G.col(0x2a1c12);
  for(let i=-3;i<=3;i++)G.M(G.RB(.12,.14,6),bm,i*1.3,2.5,0,S);
  G.M(G.RB(9,.1,.05),bm,0,.06,-2.98,S);
  const moon=new THREE.DirectionalLight(0x6a86b8,.4);moon.position.set(-2,3,-8);S.add(moon);
  const wd=G.windowModel(1.1,.9,0x2a4a7a);wd.position.set(-1.6,1.5,-2.99);S.add(wd);
  G.glowSprite(-1.6,1.5,-2.8,0x4a6aa8,2.4,.35);
  const bulb=G.bulb(0,2.2,0,0xffc070,1.25,12);
  G.bulbOff=false;
  G.ticks.push((dt,t)=>{bulb.intensity=G.bulbOff?0:1.15+Math.sin(t*17)*.05+(Math.random()<.01?-.5:0)});
  // bed with paper stars above
  const bed=G.bed();bed.position.set(-3.4,0,-2);S.add(bed);G.cols.push({x0:-4.35,x1:-2.45,z0:-2.5,z1:-1.5});
  for(let i=0;i<3;i++){const st=new THREE.Mesh(new THREE.OctahedronGeometry(.08,0),G.basic(0xffe27a));st.scale.z=.2;st.position.set(-3.9+i*.5,1.5+i*.12,-2.96);S.add(st)}
  G.glowSprite(-3.4,1.6,-2.8,0xffe27a,1.6,.2);
  // table, stools
  const tb=G.table(1.2,.8,.55);tb.position.set(.4,0,.2);S.add(tb);G.cols.push({x0:-.2,x1:1,z0:-.2,z1:.6});
  const st1=G.stool();st1.position.set(-.5,0,.3);S.add(st1);const st2=G.stool();st2.position.set(1.3,0,.1);S.add(st2);
  const pt=G.pot();pt.position.set(.2,.55,.2);S.add(pt);
  const bt=G.bottle(0x3a8a50);bt.position.set(.7,.55,.4);bt.rotation.z=Math.PI/2;bt.position.y=.58;S.add(bt);
  // kitchen: counter, fridge, jar
  G.box(1.9,.9,.6,G.mat('wood',2,1),3.1,.45,-2.55,{solid:true});
  const pot2=G.pot(0x6a6a68);pot2.position.set(2.7,.9,-2.55);S.add(pot2);
  const fr=G.fridge(true);fr.position.set(.7,0,-2.6);S.add(fr);G.cols.push({x0:.3,x1:1.1,z0:-3,z1:-2.2});
  const jr=new THREE.Group();jr.add(G.lathe([[0,0],[.18,0],[.2,.1],[.2,.5],[.14,.62],[.15,.7],[0,.7]],new THREE.MeshPhongMaterial({color:0x8a5a34,shininess:20}),14));jr.position.set(1.55,0,-2.55);S.add(jr);
  G.cols.push({x0:1.35,x1:1.75,z0:-2.75,z1:-2.35});
  const jar=jr;
  // bag, photo, empties
  const bg=new THREE.Mesh(G.RB(.45,.5,.22),G.col(0x2a3a5a));bg.position.set(-2.5,.25,-1.1);bg.castShadow=true;S.add(bg);
  G.M(G.RB(.5,.4,.03),G.col(0x4a3a2a),-2.4,1.5,-2.98,S);G.M(new THREE.PlaneGeometry(.4,.3),G.basic(0x6a5a40),-2.4,1.5,-2.96,S);
  [[3.8,.0,.5],[-1.2,0,2.2],[2.2,0,2.1]].forEach((p,i)=>{const b=G.bottle(0x3a8a50);b.position.set(p[0],0,p[2]);b.rotation.z=Math.PI/2;b.rotation.y=i;b.position.y=.056;S.add(b)});
  // front door with light under it
  const dr=G.doorModel(1.1,2.1,0x3a2a1c);dr.position.set(4.4,0,1.2);dr.rotation.y=-Math.PI/2;S.add(dr);
  G.M(G.RB(.02,.03,1.0),G.basic(0xffa040),4.32,.02,1.2,S);
  const dl=new THREE.PointLight(0xffa040,.35,3,2);dl.position.set(4.1,.1,1.2);S.add(dl);
  // lantern on the table, clothesline, shelf, calendar, rice sack, matka
  const lan=new THREE.Group();lan.add(G.lathe([[0,0],[.05,0],[.07,.04],[.06,.1],[.04,.16],[.03,.2],[0,.2]],new THREE.MeshPhongMaterial({color:0x6a5a3a,shininess:60,specular:0x886644}),12));
  const gl=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),new THREE.MeshBasicMaterial({color:0xffd890}));gl.position.y=.1;lan.add(gl);lan.position.set(.65,.55,.0);S.add(lan);
  G.glowSprite(.65,.68,0,0xffa850,1.5,.7);
  const ll=new THREE.PointLight(0xff9a48,.9,7,2);ll.position.set(.65,.8,0);S.add(ll);
  G.ticks.push((dt,t)=>{ll.intensity=.85+Math.sin(t*11)*.08+Math.sin(t*27)*.05});
  G.M(new THREE.CylinderGeometry(.008,.008,6.2,5),G.col(0x6a5a40),-.5,2.1,-1.6,S).rotation.z=Math.PI/2;
  [[-2.9,0x4a6a8a],[-2.1,0x8a5a4a],[-1.3,0x6a6a5a]].forEach(([x,c],i)=>{const cl=new THREE.Mesh(new THREE.PlaneGeometry(.55,.75-.1*i),new THREE.MeshPhongMaterial({color:c,side:THREE.DoubleSide,map:G.makeTex('cloth').map,shininess:2}));cl.position.set(x,1.7-.05*i,-1.6);cl.rotation.y=.15*i;cl.castShadow=true;S.add(cl)});
  G.M(G.RB(1.5,.04,.26),G.mat('wood',2,1),3.0,1.55,-2.86,S);
  [[2.5,0x7a3a2a],[2.85,0x5a5a58],[3.2,0x8a6a2a],[3.5,0x4a5a4a]].forEach(([x,c],i)=>{const jr=G.lathe([[0,0],[.06,0],[.07,.05],[.07,.14],[.05,.18],[.05,.2],[0,.2]],new THREE.MeshPhongMaterial({color:c,shininess:25}),12);jr.position.set(x,1.57,-2.86);S.add(jr)});
  const cal=G.poster('alpha',.32,.42);cal.position.set(.0,1.6,-2.985);S.add(cal);
  const sack=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),G.mat('cloth',1,1));sack.scale.set(.26,.34,.2);sack.position.set(4.2,.34,-2.4);sack.castShadow=true;S.add(sack);
  const mt=G.lathe([[0,0],[.1,0],[.22,.15],[.26,.3],[.17,.42],[.12,.48],[.14,.52],[0,.52]],new THREE.MeshPhongMaterial({color:0x8a4a30,shininess:12}),16);mt.position.set(-4.0,0,.8);S.add(mt);G.cols.push({x0:-4.3,x1:-3.7,z0:.5,z1:1.1});
  G.dust([-4,4,.3,2.4,-2.6,2.6],160,0xffd8a0,.03,.5);
  // mother
  const mg=G.cast.mom();mg.position.set(3.0,0,-1.5);S.add(mg);
  G.mom=G.walker(mg,1.1);G.speakers={Mama:mg};
  const dg=G.cast.dad();dg.position.set(8,0,1.2);dg.visible=false;S.add(dg);
  G.dad=G.walker(dg,1.6);G.speakers.Papa=dg;
  G.bedPos={x:-3.4,z:-1.2};
  const s=G.P;s.x=-2.2;s.z=-.6;s.yaw=-Math.PI/2;s.pitch=0;
  return{jar};
};

/* ---------- the school ---------- */
G.chalkTex=text=>{
  const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d');
  g.fillStyle='#1f3a2c';g.fillRect(0,0,256,96);
  for(let i=0;i<500;i++){g.fillStyle='rgba(255,255,255,'+(Math.random()*.05)+')';g.fillRect(Math.random()*256,Math.random()*96,18,2)}
  g.fillStyle='rgba(235,235,225,.85)';g.font='bold 15px "Comic Sans MS",cursive';
  text.forEach((l,i)=>g.fillText(l,12,24+i*22));
  const t=new THREE.CanvasTexture(c);return t;
};
G.buildSchool=(day)=>{
  G.reset({bg:0x9aa58f,fog:.028,amb:.7,ambC:0xd8dcc4,hemi:[0xe8ecd0,0x6a6a58,.45],flash:false,hud:true,bounds:{x0:-6.7,x1:6.7,z0:-4.2,z1:4.2}});
  const S=G.scene;G.audio.ambience('night');G.audio.muffle(false);
  G.floor(14,9,'tile',0,0,0,1.5);G.ceiling(14,9,'ceil',0,3.2,0,1.5);
  G.box(14.2,3.2,.2,'wallG',0,1.6,-4.6,{ts:2.5});G.box(14.2,3.2,.2,'wallG',0,1.6,4.6,{ts:2.5});G.box(.2,3.2,9,'wallG',-7,1.6,0,{ts:2.5});G.box(.2,3.2,9,'wallG',7,1.6,0,{ts:2.5});
  const sun=new THREE.DirectionalLight(0xfff0cc,.7);sun.position.set(-3,6,12);S.add(sun);
  for(let i=0;i<4;i++){const w=G.windowModel(1.6,1.2,0xdcecff);w.position.set(-4.5+i*3,1.9,4.48);w.rotation.y=Math.PI;S.add(w);G.glowSprite(-4.5+i*3,1.9,4.2,0xfff0cc,2.6,.25)}
  // ceiling tube lights
  for(let i=0;i<3;i++)for(let j=0;j<2;j++){G.lampPanel(-4+i*4,3.15,-1.8+j*3.6,1.4,.22,0xfffbe8);const l=new THREE.PointLight(0xfff4d8,.35,9,2);l.position.set(-4+i*4,3,-1.8+j*3.6);S.add(l)}
  // chalkboard
  const frame=G.col(0x5a3a22);G.M(new THREE.BoxGeometry(4.2,1.5,.08),frame,0,1.7,-4.46,S);
  const cb=new THREE.Mesh(new THREE.PlaneGeometry(4,1.3),new THREE.MeshBasicMaterial({map:G.chalkTex(['TODAY: SUMS','12 + 9 = 21','Silence in class!']),color:0xdddddd}));cb.position.set(0,1.7,-4.41);S.add(cb);
  const td=G.table(2.2,.8,.9);td.position.set(3,0,-3.6);S.add(td);G.cols.push({x0:1.9,x1:4.1,z0:-4,z1:-3.2});
  // ceiling fans, posters, barred windows, dust
  [[-3.5,0],[3.5,0]].forEach(([x,z],i)=>{const f=new THREE.Group();f.position.set(x,3.0,z);S.add(f);G.M(new THREE.CylinderGeometry(.01,.01,.3,5),G.col(0x222222),0,.15,0,f);G.M(new THREE.CylinderGeometry(.09,.09,.08,10),G.col(0x2a2a2a),0,0,0,f);
    for(let k=0;k<3;k++){const bl=G.M(G.RB(.7,.012,.12),G.col(0xb8b4a4),0,0,0,f);bl.position.set(Math.cos(k*2.094)*.45,0,Math.sin(k*2.094)*.45);bl.rotation.y=-k*2.094}
    G.ticks.push((dt,t)=>{f.rotation.y+=dt*(i?5:3.6)})});
  [['alpha',-1.4,-6.88],['map',1.2,-6.88]].forEach(([k,z,x])=>{const ps=G.poster(k,.9,1.2);ps.position.set(x,1.7,z+1.0);ps.rotation.y=Math.PI/2;S.add(ps)});
  const fl=G.poster('flag',.9,.7);fl.position.set(6.88,1.8,1.5);fl.rotation.y=-Math.PI/2;S.add(fl);
  for(let i=0;i<4;i++)for(let k=-2;k<=2;k++)G.M(new THREE.CylinderGeometry(.012,.012,1.2,5),G.col(0x3a3a3a),-4.5+i*3+k*.3,1.9,4.44,S);
  G.dust([-6,6,.4,3,-4,4],220,0xfff0cc,.03,.45);
  const spots=[];
  for(let r=0;r<3;r++)for(let c=0;c<4;c++){
    const x=-3+c*2.2,z=-.9+r*1.7+(r===0?.4:0);
    const d=G.deskModel();d.position.set(x,0,z);d.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});S.add(d);
    G.cols.push({x0:x-.45,x1:x+.45,z0:z-.28,z1:z+.28});
    spots.push([x,z+.6]);
  }
  const uni={cloth:0xeeeeee,pants:0x1a2a5a};
  const kids=[];
  [[-2.4,0],[-1.8,.7],[-2.8,.8]].forEach((p,i)=>{const k=G.cast.kid(i);k.position.set(p[0],0,p[1]);k.rotation.y=Math.PI/2;S.add(k);kids.push(k);G.ticks.push((dt,t)=>{k.userData.head.rotation.y=Math.sin(t*1.3+i)*.2})});
  const tg=G.cast.teacher();tg.position.set(0,0,-3.4);S.add(tg);
  G.teacher=G.walker(tg,1.2);G.kids=kids;G.speakers={Teacher:tg,Rohan:kids[0]};
  const P=G.P;P.x=-6;P.z=0;P.yaw=-Math.PI/2;P.pitch=0;
  return{spots,kids};
};
