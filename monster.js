'use strict';
/* The Father, as the child dreams him: too tall, too quiet, a bottle in his hand. */
const FV=[
  {body:0x0b0d0c,eye:0xc02a1a},{body:0x2a2410,eye:0xe0c040},{body:0x0a1822,eye:0x60c0ff},
  {body:0x1c1618,eye:0xff7a3a},{body:0x1a0404,eye:0xff2a10}
];
G.fatherModel=(v,shade)=>{
  const g=new THREE.Group(),V=FV[v||0];
  const P=(geo,c,x,y,z,parent,em)=>{const mm=new THREE.Mesh(geo,G.col(c,em));mm.position.set(x,y,z);mm.castShadow=true;mm.receiveShadow=true;(parent||g).add(mm);return mm};
  const eyeSpr=(parent,x,y,z,s)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:G.glowTex(),color:V.eye,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.9}));sp.scale.set(s,s,1);sp.position.set(x,y,z);parent.add(sp)};
  if(shade){
    const b=P(new THREE.ConeGeometry(.42,1.7,10),0x040404,0,.95,0,g,0x050505),h=P(new THREE.SphereGeometry(.26,12,10),0x040404,0,1.9,0,g,0x050505);
    P(new THREE.SphereGeometry(.05,6,5),0xffffff,-.09,1.94,.2,g,0xffffff);P(new THREE.SphereGeometry(.05,6,5),0xffffff,.09,1.94,.2,g,0xffffff);
    eyeSpr(h,0,.04,.24,1.1);
    g.userData={shade:true,b,h};return g;
  }
  const ec=[V.eye>>16&255,V.eye>>8&255,V.eye&255],bc=[V.body>>16&255,V.body>>8&255,V.body&255].map(x=>Math.max(14,x*3));
  const h=G.human({sex:'m',H:2.3,skin:[104,100,96],hair:[6,6,6],hairStyle:'bald',belly:.12,shoe:0x050505,
    top:{color:bc,seed:70+(v||0)},sleeve:{color:bc,seed:70+(v||0)},bottom:{color:[16,16,18],seed:71},
    face:{mon:true,eye:ec,skin:[104,100,96],beard:.7,tired:1,age:1,brow:1.3,hairStyle:'bald',seed:80+(v||0)}});
  h.scale.set(.88,1,.88);g.add(h);
  const u=h.userData,bt=G.bottle(0x3a8a50);bt.position.set(0,-.1,.03);bt.scale.setScalar(1.3);bt.rotation.x=.4;u.handR.add(bt);
  eyeSpr(u.head,0,.11,.12,.8);
  u.bt=bt;g.userData=u;g.userData.root=h;
  return g;
};
G.randCell=()=>{
  const gr=G.grid;if(!gr)return[0,0];
  for(let k=0;k<60;k++){const i=(Math.random()*gr.w)|0,j=(Math.random()*gr.h)|0;if(!gr.b[j*gr.w+i])return[gr.x0+(i+.5)*gr.cs,gr.z0+(j+.5)*gr.cs]}
  return[0,0];
};
G.spawnFather=o=>{
  const g=G.fatherModel(o.v||0,o.shade);g.position.set(o.x,0,o.z);G.scene.add(g);
  const m={g,x:o.x,z:o.z,yaw:0,v:o.v||0,shade:!!o.shade,speed:o.speed||1.3,chase:o.chase||2.8,sight:o.sight||15,hear:o.hear||6,
    state:o.idle?'idle':'patrol',pts:o.pts||[],pi:0,tx:o.x,tz:o.z,lx:0,lz:0,lose:0,search:0,navT:0,wp:null,r:.6,active:o.active!==false,
    t:Math.random()*6,wait:0,findT:0,stuck:0,ox:o.x,oz:o.z,sT:0,mT:6+Math.random()*4};
  G.monsters.push(m);return m;
};
G.spawnShade=o=>G.spawnFather({...o,shade:true,speed:1.5,chase:3.2,sight:11,hear:5});
const inSafe=(x,z,pad=0)=>G.safe.some(s=>Math.hypot(x-s.x,z-s.z)<s.r+pad);
function pickTarget(m){
  if(m.pts.length){m.pi=(m.pi+1)%m.pts.length;m.tx=m.pts[m.pi][0];m.tz=m.pts[m.pi][1]}
  else{const c=G.randCell();m.tx=c[0];m.tz=c[1]}
}
G.updateMonsters=dt=>{
  const P=G.P;
  for(const m of G.monsters){
    if(!m.active||m.dead||G.over)continue;
    m.t+=dt;
    const dx=P.x-m.x,dz=P.z-m.z,d=Math.hypot(dx,dz)||.001;
    const fx=Math.sin(m.yaw),fz=Math.cos(m.yaw),front=(dx*fx+dz*fz)/d>-.2;
    const safe=inSafe(P.x,P.z);
    let sees=!P.hidden&&!safe&&d<m.sight&&front&&G.los(m.x,m.z,P.x,P.z);
    if(!P.hidden&&!safe&&d<3&&G.los(m.x,m.z,P.x,P.z))sees=true;
    const heard=!P.hidden&&!safe&&P.run&&d<m.hear;
    if(m.state==='idle'){if(sees)m.state='chase';else{m.g.position.set(m.x,0,m.z);continue}}
    if(sees||heard){
      if(m.state!=='chase'){m.state='chase';if(G.sfx)G.sfx.growl();G.shake(.04,.5)}
      m.lx=P.x;m.lz=P.z;m.lose=0;
    }
    let sp=m.speed,tx=m.tx,tz=m.tz,moving=true;
    if(m.state==='chase'){
      sp=m.chase;tx=m.lx;tz=m.lz;
      if(!(sees||heard)){m.lose+=dt;if(m.lose>6||Math.hypot(m.x-tx,m.z-tz)<1.3){m.state='search';m.search=4+Math.random()*2;m.findT=0}}
      if(d<1.15&&!P.hidden&&!safe){G.caught(m);continue}
    }else if(m.state==='search'){
      moving=false;m.search-=dt;m.yaw+=dt*1.1;
      if(P.hidden&&d<2.6){m.findT+=dt;if(m.findT>2.4){G.caught(m);continue}}
      if(m.search<=0){m.state='patrol';pickTarget(m)}
    }else{ // patrol
      if(m.wait>0){m.wait-=dt;moving=false}
      else if(Math.hypot(m.x-tx,m.z-tz)<1.4){m.wait=1.2+Math.random()*2.2;pickTarget(m);moving=false}
    }
    if(moving){
      m.navT-=dt;if(m.navT<=0||!m.wp){m.wp=G.nav(m.x,m.z,tx,tz);m.navT=.3}
      let mx=m.wp[0]-m.x,mz=m.wp[1]-m.z;const l=Math.hypot(mx,mz)||1;mx/=l;mz/=l;
      const nx=m.x+mx*sp*dt,nz=m.z+mz*sp*dt;
      if(inSafe(nx,nz,.6)){m.state='patrol';m.wait=1.5;pickTarget(m);m.wp=null}
      else{
        G.move(m,mx*sp*dt,mz*sp*dt,m.r);
        if(Math.hypot(m.x-m.ox,m.z-m.oz)<sp*dt*.3){m.stuck+=dt;if(m.stuck>.7){m.wp=null;m.stuck=0;if(m.state==='patrol')pickTarget(m)}}else m.stuck=0;
      }
      m.ox=m.x;m.oz=m.z;
      let ty=Math.atan2(mx,mz),dy=ty-m.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));m.yaw+=dy*Math.min(1,dt*(m.state==='chase'?9:4));
    }
    // body
    const u=m.g.userData,gp=m.g.position;gp.x=m.x;gp.z=m.z;m.g.rotation.y=m.yaw;
    if(m.shade){gp.y=.2+Math.sin(m.t*3)*.12;u.b.scale.x=1+Math.sin(m.t*5)*.1}
    else{
      const s=moving?Math.sin(m.t*(m.state==='chase'?9:4.5))*.55:0;
      u.legL.rotation.x=s;u.legR.rotation.x=-s;u.armL.rotation.x=-s*.5;u.armR.rotation.x=s*.5;
      u.head.rotation.z=.16+Math.sin(m.t*1.3)*.08;u.armR.rotation.z=-.1;
    }
    // dread
    const near=Math.max(0,1-d/18);
    G.fearT=Math.max(G.fearT||0,m.state==='chase'?1:near*.65);
    if(G.sfx&&moving&&!m.shade){
      m.sT-=dt;if(m.sT<=0){m.sT=m.state==='chase'?.36:.8;if(d<16)G.sfx.thud(.32*(1-d/16))}
    }
    if(G.sfx&&!m.shade&&m.state!=='chase'){m.mT-=dt;if(m.mT<=0){m.mT=7+Math.random()*7;if(d<24)G.sfx.shout(1.4,82,.14*(1-d/24))}}
  }
};
G.caught=async m=>{
  if(G.over)return;G.over=true;
  const P=G.P;P.frozen=true;if(P.hidden){P.hidden=false}
  G.lookAt(m.x,m.z,m.shade?1.8:2.5);G.shake(.12,1.3);
  if(G.sfx){G.sfx.shout(1,78,.55);G.sfx.thud(.9)}
  await G.sleep(800);await G.fade(1,450);
  if(G.finish)G.finish('caught');
};

/* more of him as the minutes pass: a new father walks in from far away every so often */
G.reinforce=(o={})=>{
  let t=o.first||40,n=0;const max=o.max||3;
  G.ticks.push(dt=>{
    t-=dt;if(t>0||G.over||n>=max||!G.grid)return;
    t=(o.every||45)+Math.random()*20;n++;
    let c=G.randCell(),k=0;while(Math.hypot(c[0]-G.P.x,c[1]-G.P.z)<(o.far||18)&&k++<40)c=G.randCell();
    (n%2===0&&o.shades?G.spawnShade:G.spawnFather)({x:c[0],z:c[1],v:Math.min(4,(o.v||0)),speed:1.35+n*.05,chase:2.9,sight:15});
    if(G.sfx)G.sfx.growl&&G.sfx.growl();
  });
};
