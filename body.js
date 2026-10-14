'use strict';
/* First-person body: hands holding plates, eating, lying down to sleep, eyelids. */
(()=>{
  const skin=new THREE.MeshPhongMaterial({color:0xb08060,emissive:0x2a1a10,shininess:10});
  const sleeve=new THREE.MeshPhongMaterial({color:0x6a6a5a,emissive:0x141410,shininess:2});
  const steel=new THREE.MeshPhongMaterial({color:0xb8bcc0,emissive:0x202224,specular:0xffffff,shininess:90,side:THREE.DoubleSide});
  const rotiM=new THREE.MeshPhongMaterial({color:0xc8a060,emissive:0x2a1c0c,shininess:4});
  let held=null,rig=null;
  const mkRig=()=>{
    const g=new THREE.Group();
    [-1,1].forEach(s=>{
      const a=new THREE.Group();a.position.set(s*.34,-.62,-.12);
      const ge=new THREE.CylinderGeometry(.045,.06,.5,12);ge.rotateX(Math.PI/2);ge.translate(0,0,.25);
      const m=new THREE.Mesh(ge,sleeve);a.add(m);
      const h=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),skin);h.scale.set(.05,.03,.07);h.position.set(0,0,.5);a.add(h);
      for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.CylinderGeometry(.009,.008,.07,6),skin);f.rotation.x=Math.PI/2;f.position.set((-.024+i*.016),.002,.56);a.add(f)}
      a.userData.s=s;g.add(a);
    });
    return g;
  };
  const plate=(roti)=>{
    const g=new THREE.Group();
    const p=G.lathe([[0,0],[.1,0],[.135,.012],[.155,.034],[.152,.037],[.14,.026],[.0,.012]],steel,28);g.add(p);
    if(roti){const r=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.008,24),rotiM);r.position.y=.018;g.add(r);
      for(let i=0;i<6;i++){const sp=new THREE.Mesh(new THREE.CircleGeometry(.008,8),G.basic(0x6a4018));sp.rotation.x=-Math.PI/2;sp.position.set(Math.cos(i*1.1)*.05,.0231,Math.sin(i*1.1)*.05);g.add(sp)}}
    return g;
  };
  G.heldSet=kind=>{
    if(held){G.camera.remove(held);held=null}
    if(!kind)return;
    const g=new THREE.Group();g.add(mkRig());
    if(kind==='plates'){const h=new THREE.Group();h.position.set(0,-.34,-.46);h.rotation.x=.18;
      for(let i=0;i<2;i++){const p=plate(i===1);p.position.y=i*.022;h.add(p)}g.add(h);g.userData.item=h}
    else if(kind==='roti'){const h=new THREE.Group();h.position.set(.1,-.3,-.4);
      const r=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.008,22,1,false,0,Math.PI*1.6),rotiM);r.rotation.x=.9;h.add(r);g.add(h);g.userData.item=h;g.userData.roti=r}
    g.userData.kind=kind;held=g;G.camera.add(g);
  };
  G.heldClear=()=>{if(held){G.camera.remove(held);held=null}};
  G.ticks0=G.ticks0||0;
  // sway with walking
  const origLoop=G.applyCam;
  G.applyCam=function(dt){origLoop.call(G,dt);if(held)held.position.set(Math.sin(G.P.bob*.5)*.01,Math.sin(G.P.bob)*.012,0)};
  const tween=(ms,fn)=>new Promise(res=>{const t0=performance.now();const f=()=>{const k=Math.min(1,(performance.now()-t0)/ms);fn(k*k*(3-2*k));k<1?requestAnimationFrame(f):res()};f()});
  /* point both arms at the item */
  const aim=()=>{if(!held)return;const it=held.userData.item;held.children[0].children.forEach(a=>{if(!a.userData.s)return;const tp=new THREE.Vector3();
    it.updateMatrixWorld(true);it.getWorldPosition(tp);G.camera.worldToLocal(tp);tp.x+=a.userData.s*.09;a.lookAt(tp)})};
  G.ticks.push(()=>aim());
  G.eat=async()=>{
    G.heldSet('roti');const h=held,it=h.userData.item,r=h.userData.roti;
    G.sfx.pick();await tween(500,k=>{it.position.set(.1-.08*k,-.3+.1*k,-.4+.14*k)});
    for(let b=0;b<3;b++){
      await tween(260,k=>{it.position.z=-.26+.05*k;it.position.y=-.2+.03*k});
      if(G.sfx)G.sfx.click();G.shake(.012,.18);
      r.scale.set(1-.28*(b+1),1,1-.28*(b+1));
      await tween(300,k=>{it.position.z=-.21-.05*k;it.position.y=-.17-.03*k});
      await G.sleep(260);
    }
    await tween(300,k=>{it.position.y=-.2-.3*k});G.heldClear();
  };
  /* eyelids */
  G.lids=(amt,ms=600)=>{const t=$('lidT'),b=$('lidB');if(!t)return G.sleep(ms);const o=(1-amt)*100;
    [t,b].forEach(e=>{e.style.transition='transform '+ms+'ms cubic-bezier(.5,0,.3,1)'});t.style.transform='translateY('+(-o)+'%)';b.style.transform='translateY('+o+'%)';return G.sleep(ms)};
  /* lie down in bed and look at the dark ceiling; head and body locked until the scene lets you up */
  G.lie=async()=>{
    const P=G.P;P.still=true;P.lookT=null;P.frozen=false;P.lockLook=true;
    const x0=P.x,z0=P.z,y0=P.eye,p0=P.pitch,yaw0=P.yaw;
    let dy=-Math.PI/2-yaw0;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
    await tween(1500,k=>{P.x=x0+(-3.95-x0)*k;P.z=z0+(-1.95-z0)*k;P.eye=y0+(.52-y0)*k;P.pitch=p0+(.85-p0)*k;P.yaw=yaw0+dy*k;G.camera.rotation.z=.04*k});
    if(G.sfx.click)G.sfx.click();
  };
  G.stand=()=>{G.P.lockLook=false;G.P.eye=1.05;G.camera.rotation.z=0};
  /* sit on the stool at the table, facing it, and stand up afterwards */
  G.sit=async(x=-.5,z=.3,yaw=-Math.PI/2)=>{
    const P=G.P;P.still=true;P.lookT=null;P.lockLook=true;
    const x0=P.x,z0=P.z,y0=P.eye,p0=P.pitch,yaw0=P.yaw;let dy=yaw-yaw0;dy=Math.atan2(Math.sin(dy),Math.cos(dy));
    await tween(900,k=>{P.x=x0+(x-x0)*k;P.z=z0+(z-z0)*k;P.eye=y0+(.72-y0)*k;P.pitch=p0+(-.28-p0)*k;P.yaw=yaw0+dy*k});
  };
  G.standUp=async()=>{
    const P=G.P,y0=P.eye,p0=P.pitch;
    await tween(700,k=>{P.eye=y0+(1.05-y0)*k;P.pitch=p0+(0-p0)*k});
    P.lockLook=false;P.still=false;
  };
  /* close the eyes slowly, blinking against sleep */
  G.eyes=async()=>{await G.lids(.55,900);await G.lids(.8,500);await G.lids(.3,700);await G.lids(1,1100)};
  const rs=G.reset;G.reset=function(o){G.heldClear();G.camera.rotation.z=0;G.P.lockLook=false;const r=rs.call(G,o);G.lids(0,1);return r};
})();
