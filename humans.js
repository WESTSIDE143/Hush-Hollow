'use strict';
/* Realistic people: sculpted skull and face, separate eyes with eyelids, shaped torso, jointed limbs, hands, clothing. */
(()=>{
  const lerpArr=(A,t)=>{if(t<=A[0][0])return A[0][1];for(let i=1;i<A.length;i++)if(t<=A[i][0]){const k=(t-A[i-1][0])/(A[i][0]-A[i-1][0]);return A[i-1][1]+(A[i][1]-A[i-1][1])*k}return A[A.length-1][1]};
  const gs=(v,m,s)=>Math.exp(-((v-m)*(v-m))/(2*s*s));
  const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  const skinMat=sk=>new THREE.MeshPhongMaterial({color:(sk[0]<<16)|(sk[1]<<8)|sk[2],emissive:((sk[0]*.12|0)<<16)|((sk[1]*.05|0)<<8)|(sk[2]*.04|0),specular:0x2a1e18,shininess:14});
  /* one function describes the face; used for the head mesh and to seat the eyes in their sockets */
  const warp=(x,y,z,o)=>{
    const ax=Math.abs(x),fr=z>0?z:0,jaw=o.jaw||1,nz=o.nose||1;
    // skull: a bit wider at the temples, jaw narrows gently, chin squared off
    const k=ss(-.3,-.95,y);x*=1-.05*k*jaw;{const t=ss(-.1,-.5,y);y*=1-.1*t;const p=3.1,r=Math.hypot(x,y);if(r>1e-4){const pr=Math.pow(Math.pow(Math.abs(x),p)+Math.pow(Math.abs(y),p),1/p),fs=r/pr,w=.25+.55*t;x*=1+(fs-1)*w;y*=1+(fs-1)*w}}
    x*=1+.09*gs(y,.2,.45);
    // flatten the face plane so the front is not a bulb
    if(z>0){const f=ss(.55,0,ax)*ss(-.95,-.25,y)*.2*(1-ss(.4,.95,y));z*=1-f;}
    if(y>.5)z*=1-.12*(y-.5);                                        // forehead recedes
    if(z<0&&y<-.3)z*=1-.25*ss(-.3,-.9,y)*0;                           // (back of jaw left round)
    const f=fr>0?1:0;
    z+=f*(.26*nz*gs(x,0,.07)*gs(y,-.05,.24));                         // nose bridge (narrow, short)
    z+=f*(.19*nz*gs(x,0,.1)*gs(y,-.2,.08));                          // nose tip
    z+=f*(.09*nz*gs(ax,.16,.05)*gs(y,-.2,.06));                     // nostril wings
    z-=f*(.035*gs(x,0,.12)*gs(y,-.3,.035));                           // under the nose
    z+=f*(.09*gs(y,.34,.07)*gs(x,0,.5));                             // brow ridge
    z-=f*(.09*gs(ax,.4,.14)*gs(y,.08,.1));                            // eye sockets
    z+=f*(.04*gs(ax,.52,.14)*gs(y,-.22,.15));                         // cheekbones
    z+=f*(.04*gs(x,0,.2)*gs(y,-.46,.05));                             // upper lip
    z+=f*(.05*gs(x,0,.2)*gs(y,-.56,.05));                             // lower lip
    z-=f*(.02*gs(x,0,.24)*gs(y,-.5,.012));                            // mouth line
    z-=f*(.025*gs(x,0,.25)*gs(y,-.66,.04));                           // under the lip
    z+=f*(.07*gs(x,0,.16)*gs(y,-.82,.1));                             // chin
    z+=f*(.025*gs(ax,.55,.13)*gs(y,-.5,.14));                         // jowls
    return[x,y,z];
  };
  const headGeo=o=>{
    const g=new THREE.SphereGeometry(1,64,48),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const w=warp(p.getX(i),p.getY(i),p.getZ(i),o);p.setXYZ(i,w[0],w[1],w[2])}
    g.computeVertexNormals();return g;
  };
  const cyl=(rt,rb,h,seg=16)=>new THREE.CylinderGeometry(rt,rb,h,seg,3);
  const torsoGeo=(A,Ht)=>{
    const g=new THREE.CylinderGeometry(1,1,1,36,18,true),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const t=p.getY(i)+.5,vx=p.getX(i),vz=p.getZ(i);
      const hw=lerpArr(A.w,t),hd=lerpArr(A.d,t);
      let z=vz*hd;if(vz>0)z+=(A.belly*gs(t,.3,.2)+A.bust*gs(t,.66,.09)+A.chest*gs(t,.72,.15))*vz;
      if(vz<0)z-=A.back*gs(t,.6,.2)*(-vz)*-1*0;
      p.setXYZ(i,vx*hw,t*Ht,z);
    }
    g.computeVertexNormals();return g;
  };
  const faceCache={},clothCache={},hairC={};
  const hairTex=c=>{const k=c.join();return hairC[k]||(hairC[k]=G.paintHair(c))};
  const faceTex=o=>{const k=JSON.stringify(o);return faceCache[k]||(faceCache[k]=G.paintFace(o))};
  const clothTex=o=>{const k=JSON.stringify(o);return clothCache[k]||(clothCache[k]=G.paintCloth(o))};
  const clothMat=(o,rep)=>{const t=clothTex(o).clone();t.needsUpdate=true;if(rep)t.repeat.set(rep[0],rep[1]);return new THREE.MeshPhongMaterial({map:t,bumpMap:t,bumpScale:.6,specular:0x111111,shininess:4,side:THREE.DoubleSide})};
  const eyeTex=(ic,mon,red)=>{
    const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');
    g.fillStyle=mon?'#080606':'#dcd2c4';g.fillRect(0,0,128,64);
    if(red&&!mon){g.strokeStyle='rgba(170,50,44,.5)';g.lineWidth=1;for(let i=0;i<22;i++){const a=Math.random()*6.28,x=32+Math.cos(a)*14,y=32+Math.sin(a)*8;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*6);g.stroke()}}
    const cx=32,cy=32,r=9;const gr=g.createRadialGradient(cx,cy,1,cx,cy,r);gr.addColorStop(0,'rgb('+(ic[0]*1.2|0)+','+(ic[1]*1.2|0)+','+(ic[2]*1.2|0)+')');gr.addColorStop(.75,'rgb('+ic.join(',')+')');gr.addColorStop(1,'rgb('+(ic[0]*.3|0)+','+(ic[1]*.3|0)+','+(ic[2]*.3|0)+')');
    g.fillStyle=mon?'#000':gr;g.beginPath();g.arc(cx,cy,r,0,6.3);g.fill();
    g.fillStyle=mon?'rgb('+ic.join(',')+')':'#050403';g.beginPath();g.arc(cx,cy,mon?3:3.8,0,6.3);g.fill();
    const t=new THREE.CanvasTexture(c);return t;
  };
  /* o: {sex,H,skin,hair,hairStyle,belly,top,bottom,face,shoe,kid,skirt} */
  G.human=(o={})=>{
    const g=new THREE.Group(),F=o.sex==='f',S=(o.H||(F?1.62:1.75))/1.75,kid=!!o.kid,sk=o.skin||[190,142,112],fo=o.face||{};
    const SM=skinMat(sk);
    const add=(geo,mat,x,y,z,parent)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(parent||g).add(m);return m};
    const pivot=(x,y,z,parent)=>{const p=new THREE.Group();p.position.set(x,y,z);(parent||g).add(p);return p};
    const topO=o.top||{color:[90,70,70]},botO=o.bottom||{color:[40,40,50]};
    const topM=clothMat(topO),botM=clothMat(botO),slvM=clothMat(o.sleeve||topO,[1,1]);
    const legLen=.87*S,A=F?{w:[[0,.16],[.3,.13],[.62,.15],[.86,.18],[.95,.15],[1,.058]],d:[[0,.105],[.3,.09],[.62,.1],[.9,.085],[1,.058]],belly:0,bust:.02,chest:0}
      :{w:[[0,.17],[.3,.155],[.7,.19],[.86,.215],[.95,.16],[1,.066]],d:[[0,.115],[.3,.105],[.7,.12],[.9,.1],[1,.066]],belly:o.belly||0,bust:0,chest:.012};
    const Ht=.62*S;
    // legs
    const legs=[-1,1].map(s=>{
      const hip=pivot(s*.088*S,legLen,0);
      add(cyl(.088*S,.062*S,.46*S,14),botM,0,-.23*S,0,hip);
      const knee=pivot(0,-.46*S,0,hip);
      add(new THREE.SphereGeometry(.062*S,12,10),botM,0,0,0,knee);
      add(cyl(.06*S,.044*S,.42*S,14),botM,0,-.21*S,0,knee);
      const shoe=add(new THREE.SphereGeometry(1,16,12),new THREE.MeshPhongMaterial({color:o.shoe||0x15110e,shininess:30,specular:0x333333}),0,-.43*S,.045*S,knee);shoe.scale.set(.052*S,.042*S,.125*S);
      hip.userData.knee=knee;return hip;
    });
    add(new THREE.SphereGeometry(1,20,14),botM,0,legLen+.03*S,0).scale.set(.178*S,.11*S,.12*S);
    // torso
    const torso=pivot(0,legLen,0,g);
    add(torsoGeo(A,Ht),topM,0,0,0,torso);
    add(new THREE.TorusGeometry(.06*S,.015*S,8,20),topM,0,Ht-.012*S,0,torso).rotation.x=Math.PI/2;
    if(o.skirt){const sk2=add(new THREE.CylinderGeometry(.17*S,.35*S,.62*S,28,1,true),clothMat(o.skirt),0,-.22*S,0,torso)}
    // neck + head
    const neckY=Ht+.015*S;
    add(cyl(.052*S,.062*S,.1*S,16),SM,0,neckY+.025*S,.006*S,torso);
    const head=pivot(0,neckY+.005*S,.01*S,torso);
    const hs=kid?1.38:1.1,HS=S*hs,hx=.09*HS,hy=.104*HS,hz=.1*HS,hcy=.1*HS,hcz=.012*HS;
    const faceMat=new THREE.MeshPhongMaterial({map:faceTex({skin:sk,hair:o.hair||[24,18,14],...fo,noEyes:true}),specular:0x2a1e18,shininess:12});
    const H3=add(headGeo(fo),faceMat,0,hcy,hcz,head);H3.scale.set(hx,hy,hz);
    // eyes: real spheres sitting in the sockets, with lids that blink
    const eyes=[],ec=fo.eye||[70,44,28],eyeT=eyeTex(ec,fo.mon,fo.redEye);
    [-1,1].forEach(s=>{
      const w=warp(s*.42,.08,Math.sqrt(1-.42*.42-.08*.08),fo);
      const R=.0105*HS,ex=w[0]*hx,ey=hcy+w[1]*hy,ez=hcz+w[2]*hz-R*.45;
      const eg=pivot(ex,ey,ez,head);
      const ball=add(new THREE.SphereGeometry(R,20,16),new THREE.MeshPhongMaterial({map:eyeT,specular:0x666666,shininess:70}),0,0,0,eg);ball.castShadow=false;
      const lidM=new THREE.MeshPhongMaterial({color:(Math.max(0,sk[0]*.9)<<16)|(Math.max(0,sk[1]*.84)<<8)|(Math.max(0,sk[2]*.8)),specular:0x1a120e,shininess:8,side:THREE.DoubleSide});
      const up=pivot(0,0,0,eg),lo=pivot(0,0,0,eg);
      add(new THREE.SphereGeometry(R*1.07,18,10,0,Math.PI*2,0,Math.PI*.5),lidM,0,0,0,up);
      add(new THREE.SphereGeometry(R*1.07,18,10,0,Math.PI*2,Math.PI*.5,Math.PI*.5),lidM,0,0,0,lo);
      up.rotation.x=-.32;lo.rotation.x=.2;ball.castShadow=false;
      eyes.push({eg,up,lo,ball});
    });
    // mouth gap used when speaking
    const mw=warp(0,-.5,Math.sqrt(1-.25),fo);
    const mouth=add(new THREE.SphereGeometry(1,14,10),new THREE.MeshBasicMaterial({color:0x1a0808}),0,hcy+mw[1]*hy,hcz+mw[2]*hz-.002*HS,head);
    mouth.scale.set(.017*HS,.0001,.006*HS);mouth.castShadow=false;
    // ears
    [-1,1].forEach(s=>{const ear=add(new THREE.SphereGeometry(1,14,10),SM,s*.082*HS,hcy-.004*HS,hcz-.008*HS,head);ear.scale.set(.007*HS,.024*HS,.015*HS);ear.rotation.y=s*.25});
    // hair volume
    const hc=o.hair||[24,18,14],hm=new THREE.MeshPhongMaterial({map:hairTex(hc),specular:0x221a14,shininess:20,side:THREE.DoubleSide});
    const hsty=o.hairStyle||'short';
    if(hsty!=='bald'&&hsty!=='none'){
      const cap=add(new THREE.SphereGeometry(1,40,24,0,Math.PI*2,0,Math.PI*(hsty==='cropped'?.34:.4)),hm,0,hcy+.0*HS,hcz-.016*HS,head);cap.scale.set(hx*1.09,hy*1.08,hz*1.1);cap.rotation.x=-.2;
      if(hsty==='bun'){add(new THREE.SphereGeometry(.052*HS,16,12),hm,0,hcy+.085*HS,hcz-.085*HS,head)}
      if(hsty==='long'||hsty==='bun'){const back=add(new THREE.CylinderGeometry(hx*1.04,hx*.8,.2*S,24,3,true,Math.PI*.62,Math.PI*.76),hm,0,hcy+.0*HS,hcz-.015*HS,head)}
      if(hsty==='long'){add(cyl(.03*S,.014*S,.5*S,10),hm,.03*S,.0,-.1*S,head)}
    }
    // arms
    const sh=lerpArr(A.w,.86)*.9;
    const arms=[-1,1].map(s=>{
      const a=pivot(s*sh,Ht-.07*S,0,torso);a.rotation.z=s*.06;
      const dl=add(new THREE.SphereGeometry(.05*S,14,12),slvM,s*.01*S,.005*S,0,a);dl.scale.set(1,1,1);
      add(cyl(.054*S,.044*S,.3*S,14),slvM,0,-.15*S,0,a);
      const el=pivot(0,-.3*S,0,a);el.rotation.x=-.22;
      add(new THREE.SphereGeometry(.045*S,12,10),slvM,0,0,0,el);
      add(cyl(.044*S,.034*S,.27*S,14),slvM,0,-.135*S,0,el);
      const hd=pivot(0,-.28*S,0,el);
      add(new THREE.SphereGeometry(1,14,12),SM,0,-.048*S,0,hd).scale.set(.036*S,.056*S,.02*S);
      for(let i=0;i<4;i++){const fn=add(cyl(.0078*S,.0066*S,.06*S,6),SM,(-.0225+i*.015)*S,-.103*S,.004*S,hd);fn.rotation.x=-.18}
      add(cyl(.009*S,.007*S,.05*S,6),SM,s*-.036*S,-.06*S,.013*S,hd).rotation.z=s*.4;
      a.userData.elbow=el;a.userData.hand=hd;return a;
    });
    g.userData={legL:legs[0],legR:legs[1],armL:arms[0],armR:arms[1],elbowL:arms[0].userData.elbow,elbowR:arms[1].userData.elbow,handL:arms[0].userData.hand,handR:arms[1].userData.hand,
      head,torso,eyes,mouth,ph:Math.random()*6,S,talk:0,mood:o.mood||0,blinkT:2+Math.random()*3,gz:0,gy:0,gt:0,gT:2,gest:0,gestT:3+Math.random()*3,kid};
    g.scale.setScalar(o.scale||1);
    G.lives=G.lives||[];
    return g;
  };
  /* ---- walking and living animation ---- */
  G.animPerson=(g,moving,t)=>{
    const u=g.userData;if(!u.legL)return;u.walking=moving;
    const s=moving?Math.sin(t*7+u.ph)*.5:0;
    u.legL.rotation.x=s;u.legR.rotation.x=-s;u.legL.userData.knee.rotation.x=moving?Math.max(0,-s)*.9:0;u.legR.userData.knee.rotation.x=moving?Math.max(0,s)*.9:0;
    if(moving){u.armL.rotation.x=-s*.8;u.armR.rotation.x=s*.8;u.elbowL.rotation.x=-.25-Math.max(0,s)*.5;u.elbowR.rotation.x=-.25-Math.max(0,-s)*.5;
      u.torso.rotation.y=s*.12;u.torso.rotation.z=s*.03}
    else{u.legL.rotation.x=u.legR.rotation.x=0}
    g.position.y=moving?Math.abs(Math.sin(t*7+u.ph))*.025:0;
  };
  /* breathing, blinking, gaze drift, hand gestures, talking jaw: call once per frame per person */
  G.lifeTick=(g,dt,t)=>{
    const u=g.userData;if(!u.eyes)return;
    const br=Math.sin(t*1.7+u.ph);
    u.torso.scale.set(1+br*.008,1+br*.006,1+br*.014);
    // blink
    u.blinkT-=dt;let bl=0;
    if(u.blinkT<=0){u.blink=.18;u.blinkT=2.2+Math.random()*4.5}
    if(u.blink>0){u.blink-=dt;bl=Math.sin(Math.max(0,u.blink)/.18*Math.PI)}
    const open=-.32+(u.mood>.5?-.12:0)+(u.mood<0?.1:0);
    u.eyes.forEach(e=>{e.up.rotation.x=open+bl*(.55-open);e.lo.rotation.x=.2-bl*.15;e.eg.rotation.y=u.gy;e.eg.rotation.x=u.gz});
    // gaze and head drift
    u.gt-=dt;if(u.gt<=0){u.gT=1.5+Math.random()*3;u.gt=u.gT;u.tgy=(Math.random()-.5)*.6;u.tgz=(Math.random()-.5)*.25;u.thy=(Math.random()-.5)*.5;u.thx=(Math.random()-.3)*.18}
    u.gy+=((u.tgy||0)-u.gy)*Math.min(1,dt*6);u.gz+=((u.tgz||0)-u.gz)*Math.min(1,dt*6);
    u.hyaw=(u.hyaw||0)+(((u.thy||0)*.6+(u.lookYaw||0))-(u.hyaw||0))*Math.min(1,dt*2.5);
    u.hpit=(u.hpit||0)+(((u.thx||0)+(u.mood<0?.12:0))-(u.hpit||0))*Math.min(1,dt*2.5);
    u.head.rotation.y=u.hyaw+Math.sin(t*.7+u.ph)*.03;u.head.rotation.x=u.hpit+Math.sin(t*1.7+u.ph)*.01;u.head.rotation.z=(u.tilt||0)+Math.sin(t*.5+u.ph)*.015;
    // talking mouth
    if(u.talkT>0){u.talkT-=dt;const m=Math.max(0,Math.sin(t*17)*.5+Math.sin(t*27.3)*.35+.2);u.mouth.scale.y=.0001+m*.0085}else u.mouth.scale.y=.0001;
    // arms: gestures while talking, small drifting when idle
    if(!u.walking&&!u.pose){
      u.gestT-=dt;if(u.gestT<=0){u.gestT=(u.talkT>0?1.6:5)+Math.random()*3;u.gest=u.talkT>0?1:(Math.random()<.4?.35:0);u.gestSide=Math.random()<.5?-1:1;u.gestHold=.9+Math.random()*.8}
      if(u.gestHold>0)u.gestHold-=dt;else u.gest=0;
      const gl=u.gestSide<0?u.gest:u.gest*.25,gr=u.gestSide>0?u.gest:u.gest*.25;
      const aL=u.armL.rotation,aR=u.armR.rotation;
      aL.x+=((-.7*gl+Math.sin(t*1.1+u.ph)*.03)-aL.x)*Math.min(1,dt*4);aR.x+=((-.7*gr+Math.sin(t*1.3+u.ph)*.03)-aR.x)*Math.min(1,dt*4);
      u.elbowL.rotation.x+=((-.22-gl*.9)-u.elbowL.rotation.x)*Math.min(1,dt*4);u.elbowR.rotation.x+=((-.22-gr*.9)-u.elbowR.rotation.x)*Math.min(1,dt*4);
      u.torso.rotation.y+=((u.gest?(u.gestSide*.06):0)-u.torso.rotation.y)*Math.min(1,dt*3);u.torso.rotation.z*=.9;
    }
  };
  G.livePerson=g=>{if(g.userData.lifeOn)return g;g.userData.lifeOn=true;G.ticks.push((dt,t)=>{if(g.parent&&g.visible)G.lifeTick(g,dt,t)});return g};
  /* ready-made cast */
  G.cast={
    mom:()=>G.livePerson(G.human({sex:'f',H:1.58,skin:[176,128,98],hair:[18,12,10],hairStyle:'bun',mood:-.6,
      top:{color:[132,64,78],pattern:'floral',pat:[220,190,120],seed:8},bottom:{color:[84,56,70],seed:9},skirt:{color:[84,56,70],seed:9},
      face:{hair:[18,12,10],eye:[56,34,24],lash:1,tired:.9,bruise:1,cut:1,mouth:.7,brow:.9,age:.3,seed:21}})),
    dad:()=>G.livePerson(G.human({sex:'m',H:1.78,skin:[150,104,80],hair:[14,11,9],hairStyle:'short',belly:.05,shoe:0x100c0a,mood:-.4,
      top:{color:[52,56,58],stripes:[[70,40,34],[44,48,46]],bands:12,duty:.5,seed:4},bottom:{color:[34,34,38],seed:6},
      face:{beard:.95,redEye:1,flush:.75,tired:.9,age:.6,recede:.45,brow:1.3,eye:[60,38,24],mouth:.5,seed:5}})),
    teacher:()=>G.livePerson(G.human({sex:'f',H:1.6,skin:[188,140,108],hair:[26,18,14],hairStyle:'bun',mood:.2,
      top:{color:[96,126,100],seed:12},bottom:{color:[70,100,76],seed:13},skirt:{color:[70,100,76],seed:13},
      face:{hair:[26,18,14],eye:[70,46,30],lash:1,age:.35,brow:.9,seed:31}})),
    kid:i=>G.livePerson(G.human({sex:'m',kid:true,H:1.28+(i%3)*.04,skin:[[176,128,98],[160,114,86],[190,142,112]][i%3],hair:[[18,12,10],[40,26,18],[12,9,8]][i%3],hairStyle:'cropped',
      top:{color:[232,232,228],seed:40+i},bottom:{color:[28,42,88],seed:50+i},
      face:{hair:[[18,12,10],[40,26,18],[12,9,8]][i%3],eye:[50,30,20],brow:1,age:0,seed:60+i}}))
  };
})();
