'use strict';
function exitDoor(M,i,j,doorCol,glowCol,onUse,labels){
  const [ex,ez]=M.cell(i,j),dz=ez+M.cs/2-.3,S=G.scene;
  G.box(1.6,2.7,.2,G.col(doorCol),ex,1.35,dz,{});
  const sign=new THREE.Mesh(G.RB(1.3,.4,.1),G.basic(0x2a2a2a));sign.position.set(ex,3,dz);S.add(sign);
  const st={open:false,sign};
  const it=G.addItem({x:ex,z:dz-1,r:2.8,label:()=>st.open?labels[1]:labels[0](),use:()=>{if(st.open)onUse();else G.say('(It will not open yet.)',2400)}});
  st.unlock=()=>{st.open=true;sign.material=G.basic(glowCol);const l=new THREE.PointLight(glowCol,1.4,12,2);l.position.set(ex,2,dz-1.2);S.add(l)};
  return st;
}
function deadEnds(M,k){
  const far=M.dead.map(d=>({d,k:Math.hypot(d[0],d[1])})).sort((a,b)=>b.k-a.k).map(o=>o.d),out=[];
  const step=Math.max(1,Math.floor(far.length/k));
  for(let q=0;q<far.length&&out.length<k;q+=step)out.push(far[q]);
  while(out.length<k)out.push([Math.floor(M.rng()*M.n),Math.floor(M.rng()*M.n)]);
  return out;
}
function lockers(M,count,col){
  const used=new Set(),color=typeof col==='number'?col:0x4a5e6a;
  for(let k=0,t=0;k<count&&t<80;t++){
    const i=1+((M.rng()*(M.n-1))|0),j=(M.rng()*M.n)|0,key=i+','+j;if(used.has(key))continue;used.add(key);k++;
    const [x,z]=M.cell(i,j);G.lockerSpot(x+M.cs/2-.9,z-M.cs/2+1,color);
  }
}
/* ===== SLEEP III — The Drowned School ===== */
G.dreams.school=()=>{
  G.reset({bg:0x071210,fog:.075,amb:.34,ambC:0x4a6a62,hemi:[0x587a70,0x101818,.3],flash:true,hud:true});
  const S=G.scene;G.audio.ambience('school');G.audio.muffle(false);
  const M=G.maze({n:9,cs:6,h:3.4,wall:'wallG',ts:3,floor:'tile',ceil:'ceil',open:.18,seed:21});
  for(let k=0;k<12;k++){const [cx,cz]=M.cell(1+((M.rng()*(M.n-1))|0),(M.rng()*M.n)|0),px=cx+(M.rng()<.5?-1:1)*M.cs*.3,pz=cz+(M.rng()<.5?-1:1)*M.cs*.3;
    const d=G.deskModel();d.position.set(px,0,pz);d.rotation.y=M.rng()*6;S.add(d);G.cols.push({x0:px-.5,x1:px+.5,z0:pz-.4,z1:pz+.4})}
  const water=new THREE.Mesh(new THREE.PlaneGeometry(M.L,M.L),new THREE.MeshPhongMaterial({color:0x2a5a60,transparent:true,opacity:.62,specular:0x223344,shininess:30}));
  water.rotation.x=-Math.PI/2;water.position.y=.38;S.add(water);G.slow=.82;
  for(let i=0;i<M.n;i+=2)for(let j=0;j<M.n;j+=2){const [x,z]=M.cell(i,j);const p=G.lampPanel(x,M.H-.04,z,1.4,.5,0xcfe8e0);p.material=new THREE.MeshBasicMaterial({color:0xcfe8e0});
    G.ticks.push((dt,t)=>{p.material.color.setHex(Math.sin(t*(5+i)+j*2)>-.4?0xcfe8e0:0x203030)})}
  let n=0,drained=false,mon2=null;
  const speak=['Where is your lunch, Kabir?','Your shoes are from the dustbin.','Why does your father always shout?','Liar. Liar. Liar.'];
  deadEnds(M,3).forEach((c,k)=>{
    const [x,z]=M.cell(c[0],c[1]);
    const g=new THREE.Group();g.position.set(x,1.3,z);G.part(g,.14,.14,.8,0x555a5c,0,0,0);
    const wh=new THREE.Mesh(new THREE.TorusGeometry(.32,.06,6,10),G.col(0xa03020,0x300800));wh.position.set(0,0,.5);g.add(wh);S.add(g);
    const it=G.addItem({x,z,r:2.2,label:'Turn the valve',mesh:g,use:()=>{
      n++;G.rmItem(it);G.sfx.thud(.5);G.shake(.06,.6);G.sfx.whisper();G.obj('Turn the 3 valves  ('+n+'/3)');
      G.say(speak[n-1],3000,'Whisper');
      G.monsters[0].chase+=.15;
      if(n===2&&!mon2){const c2=M.cell(M.n-2,1);mon2=G.spawnFather({x:c2[0],z:c2[1],v:2,speed:1.5,chase:3,sight:16})}
      if(n===3){drained=true;G.obj('The water is leaving. Reach the principal\'s door.');G.say('(The pipes groan. The water drains.)',3400);door.unlock()}
    }});
  });
  G.ticks.push((dt)=>{if(drained&&water.position.y>-.2){water.position.y-=dt*.12;G.slow=Math.min(1,G.slow+dt*.1)}});
  const door=exitDoor(M,M.n-1,M.n-1,0x3a2a1a,0xffe0a0,()=>G.win(),[()=>'The principal\'s door is locked  ('+n+'/3)','Open the door']);
  lockers(M,5,0x4a5e6a);
  G.buildGrid(3,-M.L/2,-M.L/2,M.L/2,M.L/2,.7);
  const c0=M.cell(M.n-3,3);G.spawnFather({x:c0[0],z:c0[1],v:2,speed:1.5,chase:3,sight:16});
  const s=M.cell(0,0);G.P.x=s[0];G.P.z=s[1];
  G.obj('Turn the 3 valves  (0/3)');
  G.say('(Your school. Flooded to the knee. Nobody is laughing yet.)',3600);
  G.wait(3800).then(()=>G.running&&G.say('The valves are in the dead ends. Be quick. Be quiet.',3200));
};

/* ===== SLEEP IV — The Endless House ===== */
G.dreams.house=()=>{
  G.reset({bg:0x0c0806,fog:.08,amb:.3,ambC:0x7a5a40,hemi:[0x8a6a50,0x180c08,.25],flash:true,hud:true});
  const S=G.scene;G.audio.ambience('house');G.audio.muffle(false);
  const M=G.maze({n:9,cs:4.6,h:3,wall:'floral',ts:2.5,floor:'plank',ceil:'plaster',open:.22,seed:33});
  for(let k=0;k<16;k++){const [cx,cz]=M.cell((M.rng()*M.n)|0,(M.rng()*M.n)|0),b=G.bottle(M.rng()<.5?0x3a6a3a:0x6a4a1a);b.position.set(cx+(M.rng()-.5)*2.5,.056,cz+(M.rng()-.5)*2.5);b.rotation.set(0,M.rng()*6,Math.PI/2);S.add(b)}
  for(let k=0;k<7;k++){const [cx,cz]=M.cell(1+((M.rng()*(M.n-1))|0),(M.rng()*M.n)|0),px=cx-M.cs*.3,pz=cz+M.cs*.3;
    const t=G.table(1.1,.7,.7);t.position.set(px,0,pz);S.add(t);G.cols.push({x0:px-.6,x1:px+.6,z0:pz-.4,z1:pz+.4})}
  for(let i=1;i<M.n;i+=3)for(let j=1;j<M.n;j+=3){const [x,z]=M.cell(i,j);const l=G.light(0xffb870,.9,10,x,2.5,z);G.box(.3,.3,.3,G.basic(0xffd890),x,2.85,z,{})}
  let off=0;const tvs=[];
  deadEnds(M,3).forEach((c,k)=>{
    const [x,z]=M.cell(c[0],c[1]);
    G.box(1.1,.7,.8,G.col(0x2a2018),x,.35,z,{solid:true});G.box(1,.8,.7,G.col(0x151515),x,1.1,z,{solid:true});
    const tex=G.staticTex(),scr=new THREE.Mesh(new THREE.PlaneGeometry(.8,.6),new THREE.MeshBasicMaterial({map:tex}));scr.position.set(x,1.12,z+.36);S.add(scr);
    const lt=new THREE.PointLight(0x9ac0ff,1,9,2);lt.position.set(x,1.3,z+1);S.add(lt);
    const tv={x,z,on:true,tex,scr,lt,t:Math.random()*3};tvs.push(tv);
    const it=G.addItem({x,z:z+.9,r:2.1,label:'Turn off the TV',use:()=>{
      tv.on=false;G.rmItem(it);scr.material=G.basic(0x050505);S.remove(lt);off++;G.sfx.click();G.obj('Turn off the 3 TVs  ('+off+'/3)');
      if(off===3){door.unlock();G.obj('Reach the front door');G.say('Silence. Then, far away, a latch turns.',3600)}
      else G.say('(One less voice. The others get louder.)',2800);
    }});
  });
  const lines=['KABIR! Where are you?!','Come here when I call you!','Who told you to be quiet? SPEAK!'];
  let lc=0;
  G.ticks.push((dt,t)=>{
    for(const tv of tvs){if(!tv.on)continue;
      if((G.t*8|0)%2===0&&Math.random()<.5)tv.tex.userData.draw();
      tv.t-=dt;const d=Math.hypot(G.P.x-tv.x,G.P.z-tv.z);
      if(tv.t<=0){tv.t=3.2+Math.random()*2;if(d<26){G.sfx.shout(1.5,90,.3*(1-d/26));if(d<14&&Math.random()<.5)G.say(lines[(lc++)%3],2200,'TV')}}}
    if(!G.nextScare)G.nextScare=G.t+22+Math.random()*14;
    if(G.t>G.nextScare){G.nextScare=G.t+24+Math.random()*16;G.sfx.slam();G.shake(.08,.5);G.say('(A door slams somewhere close.)',2200)}
  });
  const door=exitDoor(M,M.n-1,M.n-1,0x5a3a20,0xfff0c0,()=>G.win(),[()=>'The front door is locked  ('+off+'/3)','Open the front door']);
  lockers(M,5,0x4a3626);
  G.buildGrid(2.3,-M.L/2,-M.L/2,M.L/2,M.L/2,.65);
  const c0=M.cell(M.n-3,2);G.spawnFather({x:c0[0],z:c0[1],v:3,speed:1.6,chase:3.1,sight:17});
  const c1=M.cell(2,M.n-3);G.spawnFather({x:c1[0],z:c1[1],v:3,speed:1.4,chase:3.1,sight:16,active:true});
  const s=M.cell(0,0);G.P.x=s[0];G.P.z=s[1];
  G.obj('Turn off the 3 TVs  (0/3)');
  G.say('(Your home. But the hallway does not end.)',3600);
  G.wait(3800).then(()=>G.running&&G.say('Follow the shouting. Make it stop.',3200));
};

/* ===== SLEEP V — The Burning Dark ===== */
G.dreams.hell=()=>{
  G.reset({bg:0x0a0201,fog:.07,amb:.34,ambC:0x701c10,hemi:[0xff4a28,0x200400,.3],flash:true,hud:true});
  const S=G.scene;G.audio.ambience('hell');G.audio.muffle(false);
  const M=G.maze({n:8,cs:7,h:7,wall:'rock',ts:3.5,floor:'rock',open:.34,seed:45,t:.6});
  const r=M.rng;
  for(let k=0;k<9;k++){const [x,z]=M.cell((r()*M.n)|0,(r()*M.n)|0);const lv=G.floor(3+r()*3,3+r()*3,'lava',x+(r()-.5)*2,.03,z+(r()-.5)*2,1);lv.material=new THREE.MeshBasicMaterial({map:G.makeTex('lava').map});}
  for(let k=0;k<6;k++){const [x,z]=M.cell((r()*M.n)|0,(r()*M.n)|0);G.light(0xff4a20,1.3,24,x,4,z)}
  for(let k=0;k<28;k++){const [cx,cz]=M.cell((r()*M.n)|0,(r()*M.n)|0),px=cx+(r()<.5?-1:1)*M.cs*.36,pz=cz+(r()<.5?-1:1)*M.cs*.36,hh=1.4+r()*2.6,rr=.4+r()*.5;
    G.M(new THREE.ConeGeometry(rr,hh,7),G.mat('rock',2,2,{bump:3}),px,hh/2,pz);G.cols.push({x0:px-rr*.7,x1:px+rr*.7,z0:pz-rr*.7,z1:pz+rr*.7})}
  let lit=0,mon2=null;
  const sayings=['KABIR','You are just like me.','Nobody is coming.'];
  deadEnds(M,3).forEach((c,k)=>{
    const [x,z]=M.cell(c[0],c[1]);
    G.box(1.2,.9,1.2,G.col(0x2a1a14),x,.45,z,{solid:true});G.box(1.5,.25,1.5,G.col(0x3a2418),x,1.02,z,{});
    const it=G.addItem({x,z,r:2.6,label:'Light the brazier with your lantern',use:()=>{
      lit++;G.rmItem(it);G.sfx.pick();const f=G.fire(x,z+0);f.g.position.y=1.1;G.safe.push({x,z,r:7});
      G.obj('Light the 3 braziers  ('+lit+'/3)');G.say(sayings[lit-1],2600,'Voice');
      if(lit===1){mon2=G.spawnFather({x:M.cell(M.n-2,1)[0],z:M.cell(M.n-2,1)[1],v:4,speed:1.6,chase:3.3,sight:19})}
      if(lit===3){G.obj('Reach the white door');G.say('(A white door. Something warm is behind it.)',3600);showDoor()}
    }});
  });
  function showDoor(){
    const [ex,ez]=M.cell(M.n-1,M.n-1),dz=ez+M.cs/2-.4;
    const d=new THREE.Mesh(new THREE.PlaneGeometry(2.4,4.4),G.basic(0xffffff));d.position.set(ex,2.2,dz);S.add(d);
    const l=new THREE.PointLight(0xffffff,2.2,18,2);l.position.set(ex,2.4,dz-2);S.add(l);
    G.addItem({x:ex,z:dz-1.2,r:3.2,label:'Go through the white door',use:async()=>{
      G.over=true;G.P.frozen=true;G.audio.ambience('none');G.clearSay();await G.wait(900);
      G.sfx.scream();G.shake(.1,1.2);G.say('(Mama?)',1800);await G.wait(1500);G.win2=true;await G.fade(1,1200);G.finish('win')}});
  }
  G.buildGrid(3,-M.L/2,-M.L/2,M.L/2,M.L/2,.8);
  G.spawnFather({x:M.cell(M.n-3,3)[0],z:M.cell(M.n-3,3)[1],v:4,speed:1.6,chase:3.3,sight:19});
  for(let k=0;k<3;k++){const c=M.cell(2+k*2,(2+k*3)%M.n);G.spawnShade({x:c[0],z:c[1],v:4})}
  lockers(M,4,0x3a1814);
  const s=M.cell(0,0);G.P.x=s[0];G.P.z=s[1];
  G.obj('Light the 3 braziers  (0/3)');
  G.say('(Everything burns without light. It is only the heat of him.)',3800);
  G.wait(4000).then(()=>G.running&&G.say('Fire keeps them back. Light the braziers.',3200));
};
