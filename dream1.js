'use strict';
G.dreams={};
G.win=async()=>{
  if(G.over)return;G.over=true;G.P.frozen=true;if(G.sfx)G.sfx.wake();
  await G.fade(1,1500);if(G.finish)G.finish('win');
};
G.fail=async why=>{
  if(G.over)return;G.over=true;G.P.frozen=true;await G.fade(1,900);if(G.finish)G.finish(why);
};
G.lockerSpot=(px,pz,color)=>{
  const m=G.locker(color);m.position.set(px,0,pz);G.scene.add(m);
  G.cols.push({x0:px-.3,x1:px+.3,z0:pz-.3,z1:pz+.3});
  return G.addItem({x:px,z:pz,r:2.3,label:'Hide',hide:{x:px,z:pz,eye:.7}});
};
G.hideSpot=(x,z,w,h,d,mat,rot=0)=>{
  const m=G.box(w,h,d,mat,x,h/2,z,{solid:true});m.rotation.y=rot;
  return G.addItem({x,z,r:2.3,label:'Hide',hide:{x,z,eye:Math.min(.6,h*.45)},mesh:null});
};

G.logSpot=(x,z,rot)=>{
  const m=G.M(new THREE.CylinderGeometry(.5,.55,2.8,10),G.mat('bark',2,2,{bump:2.4}),x,.5,z);m.rotation.z=Math.PI/2;m.rotation.y=rot;
  G.M(new THREE.CylinderGeometry(.18,.2,.1,8),G.col(0x1a120a),x+Math.cos(rot)*1.41,.5,z-Math.sin(rot)*1.41).rotation.z=Math.PI/2;
  G.cols.push({x0:x-1.3,x1:x+1.3,z0:z-1.3,z1:z+1.3});
  return G.addItem({x,z,r:2.6,label:'Hide inside the log',hide:{x,z,eye:.5}});
};
/* ===== SLEEP I — The Hollow Wood ===== */
G.dreams.forest=()=>{
  const B=86;
  G.reset({bg:0x17111f,fog:.017,amb:.26,ambC:0x3a3058,hemi:[0x5a4a82,0x0c0a10,.3],flash:true,hud:true,hunger:true,bounds:{x0:-B,x1:B,z0:-B,z1:B}});
  const r=G.rng(11),S=G.scene;
  G.sky({top:0x0a0818,mid:0x3a2858,hor:0x9a4a68,glow:{c:0xc8583a,x:.62,y:.72,r:.5},clear:.1,cloud:.85,stars:.016,seed:4,dapple:1,birds:[.55,.2]});
  G.sun(0xc0606a,.62,-.7,.3,-.55,48);
  G.hills(0x0e0b16,false,4);
  G.audio.ambience('forest');G.audio.muffle(false);
  G.floor(900,900,'ground',0,0,0,3);
  const stars=[[-70,-26],[62,44],[-40,74]],EX=[0,-84];
  const clear=[[0,0,9],[EX[0],EX[1],11],...stars.map(s=>[s[0],s[1],3.5])];
  const pts=[];
  for(let k=0;k<7000&&pts.length<430;k++){
    const x=(r()*2-1)*(B-2),z=(r()*2-1)*(B-2);
    if(clear.some(c=>Math.hypot(x-c[0],z-c[1])<c[2]))continue;
    if(pts.some(p=>Math.hypot(p[0]-x,p[1]-z)<5.2))continue;
    pts.push([x,z,.9+r()*.9]);
  }
  pts.forEach(p=>{const h=p[2]*.75;G.cols.push({x0:p[0]-h,x1:p[0]+h,z0:p[1]-h,z1:p[1]+h})});
  G.pineForest(pts,r);
  // the endless forest beyond the edge: just scenery, you can never reach it
  const far=[];for(let k=0;k<4000&&far.length<560;k++){const x=(r()*2-1)*230,z=(r()*2-1)*230;if(Math.max(Math.abs(x),Math.abs(z))<B+4)continue;if(far.some(p=>Math.hypot(p[0]-x,p[1]-z)<6))continue;far.push([x,z,1+r()*1.1])}
  G.pineForest(far,r,6,false);
  // undergrowth, ferns, rocks, boulders
  const gp=[];for(let i=0;i<1700;i++){const x=(r()*2-1)*(B+10),z=(r()*2-1)*(B+10);if(Math.hypot(x,z)>5||r()<.2)gp.push([x,z])}
  G.grass(gp,r);
  const fp=[];for(let i=0;i<420;i++)fp.push([(r()*2-1)*(B+6),(r()*2-1)*(B+6)]);G.ferns(fp,r);
  for(let i=0;i<40;i++){const x=(r()*2-1)*(B-4),z=(r()*2-1)*(B-4);if(Math.hypot(x,z)>8&&!G.hit(x,z,1.6)){if(i%5===0)G.boulder(x,z,1.5+r()*1.2,i+2);else G.rock(x,z,.5+r()*1.2,i+2,true)}}
  for(let i=0;i<70;i++){const x=(r()*2-1)*(B+8),z=(r()*2-1)*(B+8),m=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8,0,Math.PI*2,0,Math.PI/2),G.basic(0x6ab0ff));m.position.set(x,.05,z);S.add(m);
    if(i%4===0)G.glowSprite(x,.2,z,0x5a9aff,.9,.6)}
  // fireflies
  const fgeo=new THREE.BufferGeometry(),fp2=new Float32Array(260*3);for(let i=0;i<260;i++){fp2[i*3]=(r()*2-1)*(B-6);fp2[i*3+1]=.5+r()*5;fp2[i*3+2]=(r()*2-1)*(B-6)}
  fgeo.setAttribute('position',new THREE.BufferAttribute(fp2,3));
  const ff=new THREE.Points(fgeo,new THREE.PointsMaterial({color:0xb8e08a,size:.2,sizeAttenuation:true,transparent:true,opacity:.85}));S.add(ff);
  G.ticks.push((dt,t)=>{ff.rotation.y=Math.sin(t*.05)*.2;ff.position.y=Math.sin(t*.6)*.3});
  G.dust([-B,B,.3,6,-B,B],320,0xc8b0e0,.05,.28);

  // camp
  let sticks=0,lit=false,starN=0,hunger=.8,warned=false;
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2;G.rock(Math.cos(a)*1.25,Math.sin(a)*1.25,.28+((i*7)%3)*.04,i+30,false)}
  const camp=G.addItem({x:0,z:0,r:2.6,label:()=>sticks>=3?'Build a fire':'Cold ashes (sticks '+sticks+'/3)',use:()=>{
    if(sticks<3){G.say('(Not enough sticks. Mama always said three.)',2600);return}
    lit=true;G.rmItem(camp);const f=G.fire(0,0);G.safe.push({x:0,z:0,r:10});G.sfx.pick();
    G.say('(The fire catches. The dark steps back.)',3200);G.obj('Find the 3 paper stars  (0/3)');
    G.say('He does not like fire. Stay near it when you need to breathe.',3600);
  }});
  for(let i=0,n=0;n<10&&i<600;i++){
    const a=r()*6.28,d=12+r()*60,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x)>B-3||Math.abs(z)>B-3||G.hit(x,z,1.5))continue;n++;
    const m=G.M(new THREE.CylinderGeometry(.025,.035,.95,7),G.mat('bark',1,1),x,.06,z);m.rotation.z=Math.PI/2;m.rotation.y=r()*3;
    G.M(new THREE.CylinderGeometry(.01,.012,.3,5),G.mat('bark',1,1),x+.2,.11,z+.04).rotation.z=.9;
    const it=G.addItem({x,z,r:2,label:'Pick up a stick',mesh:m,use:()=>{sticks++;G.rmItem(it);G.sfx.pick();if(!lit)G.obj('Gather sticks and build a fire  ('+sticks+'/3)')}});
  }
  for(let i=0,n=0;n<18&&i<800;i++){
    const a=r()*6.28,d=10+r()*68,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x)>B-3||Math.abs(z)>B-3||G.hit(x,z,1.6)||Math.hypot(x,z)<6)continue;n++;
    const bu=G.bush(x,z,1+r()*.5,true,n+3);
    const it=G.addItem({x,z,r:2,label:'Eat berries',mesh:bu.g,use:()=>{hunger=Math.min(1,hunger+.42);bu.bs.forEach(b=>bu.g.remove(b));it.mesh=null;G.rmItem(it);G.sfx.pick();G.say('(Sour. But it helps.)',2000)}});
    G.cols.push({x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3});
  }
  for(let i=0,n=0;n<9&&i<600;i++){
    const a=r()*6.28,d=14+r()*64,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x)>B-4||Math.abs(z)>B-4||G.hit(x,z,2)||Math.hypot(x,z)<10)continue;n++;
    G.logSpot(x,z,r()*3);
  }
  stars.forEach((s,i)=>{
    const m=G.glow(s[0],.9,s[1],0xffe27a,.34);
    const it=G.addItem({x:s[0],z:s[1],y:.9,r:2.4,label:'Take the paper star',mesh:m,use:()=>{
      starN++;G.rmItem(it);G.sfx.pick();G.sfx.whisper();G.obj('Find the 3 paper stars  ('+starN+'/3)');
      if(starN===1)G.say('Mama folded these. Every night, before the shouting.',3600);
      if(starN===2){G.say('(Heavier footsteps. A second shadow.)',3200);G.spawnFather({x:-60,z:-60,v:0,speed:1.5,chase:3,sight:18})}
      if(starN===3){G.obj('Go to the hollow tree');G.say('The great tree opens. It is warm inside.',3600);G.sfx.bell();portal.material=G.basic(0xfff1c8);pl.intensity=2.5;G.glowSprite(0,3,EX[1]+5.6,0xfff1c8,9,.8)}
    }});
  });
  // the hollow tree
  G.M(new THREE.CylinderGeometry(3.6,5.2,30,24),G.mat('bark',5,4,{bump:3}),0,15,EX[1]-6);G.cols.push({x0:-4.5,x1:4.5,z0:EX[1]-10,z1:EX[1]-1.5});
  const portal=new THREE.Mesh(new THREE.PlaneGeometry(3,5.4),G.basic(0x0a0a0a));portal.position.set(0,2.7,EX[1]+4.55);S.add(portal);
  const pl=new THREE.PointLight(0xfff1c8,0,12,2);pl.position.set(0,3,EX[1]+7);S.add(pl);
  G.addItem({x:0,z:EX[1]+6.6,r:3,label:()=>starN>=3?'Step into the light':'The tree is sealed  ('+starN+'/3 stars)',use:()=>{if(starN>=3)G.win();else G.say('(It will not open. Three stars, Mama said.)',2600)}});

  // the shadows: two from the start, then more keep coming the longer you linger
  G.buildGrid(2,-B,-B,B,B,.7);
  G.spawnFather({x:50,z:56,v:0,speed:1.35,chase:2.9,sight:18});
  G.spawnFather({x:-58,z:20,v:0,speed:1.3,chase:2.9,sight:17,hear:7});
  let spawnT=55,spawned=0;
  G.ticks.push(dt=>{
    spawnT-=dt;
    if(spawnT<=0&&spawned<5&&!G.over){
      spawnT=48+Math.random()*30;spawned++;
      let c=G.randCell(),tries=0;while(Math.hypot(c[0]-G.P.x,c[1]-G.P.z)<45&&tries++<30)c=G.randCell();
      const sh=spawned%2===0;(sh?G.spawnShade:G.spawnFather)({x:c[0],z:c[1],v:spawned%3,speed:1.35+spawned*.05,chase:2.9,sight:18});
      if(G.sfx)G.sfx.whisper();G.say('(Something new is walking in the dark.)',2400);
    }
    // the edge of the dream: the world drinks the light the closer you walk to it
    const P=G.P,e=Math.max(0,Math.max(Math.abs(P.x),Math.abs(P.z))-(B-14))/14;
    S.fog.density=.017+e*e*.06;
    if(e>.75&&!G.edgeWarn){G.edgeWarn=true;G.say('(The trees close in. There is nothing out there that is yours.)',3000)}
    if(e<.3)G.edgeWarn=false;
  });
  G.P.x=0;G.P.z=7;G.P.yaw=0;
  G.obj('Gather sticks and build a fire  (0/3)');G.setHunger(hunger);
  G.ticks.push(dt=>{
    hunger-=dt*.0065;G.setHunger(hunger);
    if(hunger<.25&&!warned){warned=true;G.say('(Your stomach twists. Berries grow on the low bushes.)',3200)}
    if(hunger>.4)warned=false;
    if(hunger<=0)G.fail('hunger');
  });
  G.say('(The trees are so tall you cannot see the sky.)',3200);
  G.wait(3400).then(()=>G.running&&G.say('Sticks. A fire. Then the stars.',3000));
};

/* ===== SLEEP II — The Yellow Rooms ===== */
G.dreams.yellow=()=>{
  G.reset({bg:0x7a6a30,fog:.06,amb:.85,ambC:0xd8c880,hemi:[0xfff0b0,0x6a5a20,.35],flash:true,hud:true});
  const S=G.scene,sun=new THREE.DirectionalLight(0xfff0b0,.45);sun.position.set(3,10,2);S.add(sun);
  G.audio.ambience('yellow');G.audio.muffle(false);
  const M=G.maze({n:10,cs:5,h:3.6,wall:'wallY',ts:3,floor:'carpet',ceil:'ceil',open:.14,seed:7});
  const fl=[];
  for(let i=0;i<M.n;i++)for(let j=0;j<M.n;j++){
    const [x,z]=M.cell(i,j),flick=(i*7+j*3)%5===0;
    const mat=flick?new THREE.MeshBasicMaterial({color:0xfff6c8}):G.basic(0xfff6c8);
    const p=G.lampPanel(x,M.H-.04,z);p.material=mat;if(flick)fl.push(mat);if((i+j)%2===0)G.glowSprite(x,M.H-.35,z,0xfff0a0,3.4,.32);
  }
  G.ticks.push((dt,t)=>{fl.forEach((m,i)=>{const on=Math.sin(t*(9+i)+i*3)>-.55||Math.random()<.2;m.color.setHex(on?0xfff6c8:0x6a6030)})});
  let got=0,unlocked=false;
  const far=M.dead.map(d=>({d,k:Math.hypot(d[0],d[1])})).sort((a,b)=>b.k-a.k).map(o=>o.d);
  const spots=far.length>=3?[far[0],far[Math.floor(far.length/2)],far[far.length-1]]:[[9,0],[0,9],[5,5]];
  const lines=['A drawing of a house. The sun has a smile.','Two figures holding hands. One of them is you.','A tree with stars in it. Mama\'s writing: "for Kabir".'];
  let mon;
  spots.forEach((s,k)=>{
    const [x,z]=M.cell(s[0],s[1]);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.8,.6),new THREE.MeshBasicMaterial({map:G.drawingTex(k)}));
    m.rotation.x=-Math.PI/2;m.position.set(x,.03,z);S.add(m);
    const l=new THREE.PointLight(0xfff4d0,.8,6,2);l.position.set(x,1,z);S.add(l);
    const it=G.addItem({x,z,r:2,label:'Pick up the drawing',mesh:m,use:()=>{
      got++;G.rmItem(it);S.remove(l);G.sfx.pick();G.obj('Find the 3 drawings  ('+got+'/3)');G.say(lines[k],3800);
      if(got===1){mon.active=true;mon.state='patrol';G.say('(Something heavy starts walking.)',3000)}
      if(got===3){unlocked=true;sign.material=G.basic(0xcfffd0);G.sfx.bell();G.obj('Reach the EXIT');G.say('A door hums in the far corner.',3200)}
    }});
  });
  // exit door
  const [ex,ez]=M.cell(M.n-1,M.n-1),dz=ez+M.cs/2-.3;
  G.box(1.5,2.6,.2,G.col(0x1e3a22),ex,1.3,dz,{});
  const sign=new THREE.Mesh(G.RB(1.2,.4,.1),G.basic(0x2a5a30));sign.position.set(ex,2.9,dz);S.add(sign);
  G.addItem({x:ex,z:dz-1,r:2.6,label:()=>unlocked?'Open the EXIT':'The door is locked  ('+got+'/3)',use:()=>{if(unlocked)G.win();else G.say('(Locked. It wants all three drawings.)',2600)}});
  // cabinets to hide in
  const used=new Set();
  for(let k=0;k<5;k++){
    const i=2+((M.rng()*(M.n-3))|0),j=((M.rng()*(M.n-1))|0)+0;if(used.has(i+','+j))continue;used.add(i+','+j);
    const [x,z]=M.cell(i,j);G.lockerSpot(x+1.4,z-1.6,0x6a5a2a);
  }
  G.buildGrid(2.5,-M.L/2,-M.L/2,M.L/2,M.L/2,.7);
  const [mx,mz]=M.cell(M.n-3,2);
  mon=G.spawnFather({x:mx,z:mz,v:1,speed:1.5,chase:3,sight:17,active:false});
  const [sx,sz]=M.cell(0,0);G.P.x=sx;G.P.z=sz;G.P.yaw=-Math.PI/2*0;
  G.obj('Find the 3 drawings  (0/3)');
  G.say('(The carpet is damp. The lights hum. There is no one to ask.)',3600);
  G.wait(3800).then(()=>G.running&&G.say('He walks slowly here. He does not need to hurry.',3200));
};
