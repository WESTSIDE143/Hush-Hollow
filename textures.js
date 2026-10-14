'use strict';
/* Detailed procedural textures: colour + bump (height) so surfaces catch the lantern light. */
(()=>{
  const mkN=(per,seed)=>{const r=G.rng(seed),L=new Float32Array(per*per);for(let i=0;i<L.length;i++)L[i]=r();
    const at=(i,j)=>L[(((j%per)+per)%per)*per+(((i%per)+per)%per)];
    return(u,v)=>{const x=u*per,y=v*per,i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
      return at(i,j)*(1-sx)*(1-sy)+at(i+1,j)*sx*(1-sy)+at(i,j+1)*(1-sx)*sy+at(i+1,j+1)*sx*sy}};
  const N=[mkN(4,1),mkN(8,2),mkN(16,3),mkN(32,4),mkN(64,5),mkN(128,6),mkN(256,7)];
  const f1=x=>x-Math.floor(x);
  const fbm=(u,v,o=6)=>{let a=.5,s=0,t=0;for(let k=0;k<o;k++){s+=N[k](f1(u),f1(v))*a;t+=a;a*=.5}return s/t};
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const mul=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
  const cl=x=>x<0?0:x>255?255:x;
  const D={
    ground:(u,v,r)=>{const n=fbm(u,v),m=fbm(u*2,v*2,4),nd=Math.sin((u*96+v*58)+m*10)*.5+.5,dirt=n>.56;
      let c=dirt?mix([70,52,36],[52,40,28],m):mix([40,48,30],[62,66,38],m);c=mix(c,[112,80,46],nd*.35*(dirt?.4:1));
      if(r()<.012)c=[130,120,90];return[...mul(c,.65+n*.7),.35+n*.5+nd*.12]},
    bark:(u,v,r)=>{const n=fbm(u,v*.5),fur=Math.abs(Math.sin(u*Math.PI*14+n*5.5)),k=.35+fur*.65;
      const c=mix([30,24,20],[104,88,74],k*(.5+n*.6));return[...c,fur*.9+n*.1]},
    needle:(u,v,r)=>{const n=fbm(u,v),s=Math.sin((u*80-v*50)+n*12)*.5+.5;const c=mix([14,30,22],[40,64,40],s*.7+n*.3);return[...c,.4+s*.4]},
    rockg:(u,v,r)=>{const n=fbm(u,v),m=fbm(u*3,v*3,3);const c=mix([60,62,60],[120,118,108],n*.8+m*.2);return[...c,n*.8+m*.3]},
    wallY:(u,v,r)=>{const n=fbm(u,v*2),st=f1(u*24)<.12?.88:1,dm=f1(u*12+v*8)<.08?.94:1;
      let c=mul([196,176,98],(.8+n*.4)*st*dm);let h=.55;
      if(v>.92){c=mul([108,78,40],.8+n*.3);h=.85}else if(v>.9){c=mul([214,196,130],.9);h=.7}
      if(v<.03)c=mul(c,.8);
      const stain=fbm(u*2,v*3)>.62&&v<.6?.78:1;c=mul(c,stain);
      return[...c,h+(f1(u*24)<.12?-.1:0)]},
    carpet:(u,v,r)=>{const n=fbm(u,v),fb=r();const c=mul([140,120,62],.78+n*.3+fb*.18);return[...c,.4+fb*.5]},
    ceil:(u,v,r)=>{const gx=f1(u*2),gy=f1(v*2),edge=gx<.03||gy<.03,perf=!edge&&((Math.floor(u*64)+Math.floor(v*64))%3===0)&&r()<.7;
      const n=fbm(u,v);let c=mul([208,202,172],.84+n*.2);if(edge)c=mul(c,.55);if(perf)c=mul(c,.78);return[...c,edge?.2:.6]},
    wallG:(u,v,r)=>{const n=fbm(u,v*2),streak=fbm(u*10,v*.6,3);let c,h=.5;
      if(v>.46&&v<.95){c=mix([70,104,82],[102,136,106],n);h=.55;if(r()<.01)c=[190,200,180]}
      else if(v>=.44&&v<=.46){c=[40,60,48];h=.8}else if(v>=.95){c=mul([70,56,40],.8+n*.3);h=.9}
      else{c=mix([186,190,172],[210,212,194],n);if(streak>.62)c=mul(c,.82)}
      return[...c,h]},
    floral:(u,v,r)=>{const n=fbm(u,v*2);let c=mul([100,82,56],.8+n*.3),h=.5;
      if(v>.64&&v<.97){c=mul([96,62,38],.75+n*.5);h=.55+(f1(u*6)<.02?-.3:0)}
      else if(v>=.62&&v<=.64){c=[134,98,62];h=.85}else if(v>=.97){c=[70,48,30];h=.9}
      else{const cx=f1(u*8)-.5,cy=f1(v*10)-.5,d=Math.hypot(cx,cy);
        if(d<.12){c=mix([160,70,70],[200,110,100],n);h=.7}else if(d<.2&&Math.abs(cx)<.04){c=mul([70,100,60],1);h=.6}
        if(f1(u*16)<.05)c=mul(c,.9)}
      return[...c,h]},
    plaster:(u,v,r)=>{const n=fbm(u,v),m=fbm(u*4,v*4,3),cr=false;let c=mul([156,138,110],.74+n*.4+m*.12);
      if(v>.7)c=mul(c,.82+(1-v)*.4);if(cr)c=mul(c,.5);return[...c,.5+m*.4-(cr?.4:0)]},
    concrete:(u,v,r)=>{const n=fbm(u,v),m=fbm(u*4,v*4,3),cr=false;let c=mul([112,110,102],.7+n*.4+m*.2);
      if(fbm(u*3,v*3)>.66)c=mul(c,.72);if(cr)c=mul(c,.45);return[...c,.4+m*.5-(cr?.3:0)]},
    tile:(u,v,r)=>{const gx=f1(u*8),gy=f1(v*8),g=gx<.04||gy<.04,n=fbm(u,v);let c=g?[88,96,90]:mul([176,186,176],.82+n*.3);
      if(!g&&fbm(u*4,v*4)>.64)c=mul(c,.75);return[...c,g?.2:.7]},
    plank:(u,v,r)=>{const py=Math.floor(v*8),fy=f1(v*8),j=(py*37%7)/7,gx=f1(u*2+j),seam=fy<.04||gx<.015,
      grain=Math.sin((u*40+fbm(u*2,py*.3)*8)+py)*.5+.5;let c=mix([84,56,34],[132,92,58],grain*.5+fbm(u,v)*.5);if(seam)c=[28,18,10];
      return[...c,seam?.1:.5+grain*.3]},
    metal:(u,v,r)=>{const rib=Math.sin(u*Math.PI*32)*.5+.5,n=fbm(u,v),rust=fbm(u*3,v*3,3)>.6;let c=mix([70,76,80],[130,136,138],rib);
      if(rust)c=mix(c,[112,60,32],.55);return[...mul(c,.7+n*.5),rib]},
    rock:(u,v,r)=>{const n=fbm(u,v),m=fbm(u*3,v*3,3),cr=Math.abs(fbm(u*2,v*2)-.5)<.018;let c=mul(mix([52,28,26],[104,56,44],n),.7+m*.5);
      if(cr)c=[255,112,32];return[...c,cr?.05:.3+n*.7]},
    lava:(u,v,r)=>{const n=fbm(u,v),m=fbm(u*3,v*3,3),k=n*.7+m*.5;return[...mix([140,24,6],[255,190,60],k),.5]},
    checker:(u,v,r)=>{const gx=f1(u*4),gy=f1(v*4),w=(Math.floor(u*4)+Math.floor(v*4))%2===0,g=gx<.02||gy<.02||gx>.98||gy>.98,n=fbm(u*2,v*2);
      let c=w?[206,204,190]:[26,28,28];c=mul(c,.82+n*.3);if(g)c=[70,72,66];
      const scuff=fbm(u*9,v*9)>.66;if(scuff)c=mul(c,w?.8:1.6);return[...c,g?.15:.75]},
    brickw:(u,v,r)=>{const row=Math.floor(v*10),fx=f1(u*5+(row%2)*.5),fy=f1(v*10),m=fx<.04||fy<.09,n=fbm(u,v),k=fbm(u*8,v*8,5);
      let c=m?mul([150,142,126],.8+k*.3):mul([132,66,46],.62+n*.6+k*.2);return[...c,m?.1:.55+k*.3]},
    tinroof:(u,v,r)=>{const rib=Math.sin(u*Math.PI*10)*.5+.5,n=fbm(u,v),rust=fbm(u*4,v*4,4),st=rust>.58;
      let c=mix([88,92,92],[154,158,156],rib);if(st)c=mix(c,[120,62,34],Math.min(1,(rust-.58)*5));return[...mul(c,.55+n*.45),rib]},
    cloth:(u,v,r)=>{const n=fbm(u*4,v*4,3);return[...mul([46,40,44],.7+n*.7),.5+n*.3]},
    wood:(u,v,r)=>{const g=Math.sin((v*30+fbm(u,v)*6))*.5+.5;const c=mix([88,58,34],[128,88,52],g);return[...c,.4+g*.4]},
    brick:(u,v,r)=>{const row=Math.floor(v*8),fx=f1(u*4+(row%2)*.5),fy=f1(v*8),m=fx<.05||fy<.08,n=fbm(u,v);
      const c=m?[110,106,98]:mul([120,60,44],.7+n*.6);return[...c,m?.1:.6]}
  };
  const VERT={wallY:1,wallG:1,floral:1};
  G.isVert=n=>!!VERT[n];
  const SZ={wallY:512,wallG:512,floral:512,plaster:512,concrete:512,tile:256,checker:512,brickw:512,tinroof:256,plank:256,wood:256,ground:256,bark:256,needle:256,metal:256,ceil:256,carpet:256};
  const CRK={plaster:3,concrete:2,wallG:1,wallY:1};
  const cache={};
  G.makeTex=name=>{
    if(cache[name])return cache[name];
    const size=SZ[name]||128,fn=D[name]||D.concrete,r=G.rng(name.length*977+size);
    const c=document.createElement('canvas'),b=document.createElement('canvas');c.width=c.height=b.width=b.height=size;
    const g=c.getContext('2d'),bg=b.getContext('2d'),im=g.createImageData(size,size),ib=bg.createImageData(size,size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const o=fn(x/size,y/size,r),k=(y*size+x)*4,h=cl(o[3]*255+(r()-.5)*14),gr=.93+r()*.14,dt=.9+fbm(x/size*5,y/size*5,4)*.18;o[0]*=gr*dt;o[1]*=gr*dt;o[2]*=gr*dt;
      im.data[k]=cl(o[0]);im.data[k+1]=cl(o[1]);im.data[k+2]=cl(o[2]);im.data[k+3]=255;
      ib.data[k]=ib.data[k+1]=ib.data[k+2]=h;ib.data[k+3]=255;
    }
    g.putImageData(im,0,0);bg.putImageData(ib,0,0);
    if(CRK[name]){const rr=G.rng(name.length*31+7);
      for(let n=0;n<CRK[name];n++){let x=rr()*size,y=rr()*size*.4,a=Math.PI/2+(rr()-.5)*.8;const pts=[[x,y]];
        for(let i=0;i<26;i++){a+=(rr()-.5)*.9;x+=Math.cos(a)*size*.025;y+=Math.sin(a)*size*.025;pts.push([x,y])}
        [[g,'rgba(18,12,8,.75)',1.3],[bg,'rgba(0,0,0,.9)',2.2]].forEach(([cx,st,w])=>{cx.strokeStyle=st;cx.lineWidth=w*size/256;cx.lineJoin='round';cx.beginPath();pts.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke()})}}
    const mk=cv=>{const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t};
    return cache[name]={map:mk(c),bump:mk(b)};
  };
  // soft radial glow for lights (additive sprites)
  G.glowTex=(()=>{let t=null;return()=>{if(t)return t;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
    const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.fillRect(0,0,64,64);return t=new THREE.CanvasTexture(c)}})();
  G.bladeTex=(()=>{let t=null;return()=>{if(t)return t;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
    const r=G.rng(9);for(let i=0;i<9;i++){const x=6+r()*52,h=22+r()*38,lean=(r()-.5)*14;g.strokeStyle='rgb('+(26+r()*30|0)+','+(52+r()*40|0)+','+(28+r()*20|0)+')';g.lineWidth=2+r()*2;
      g.beginPath();g.moveTo(x,64);g.quadraticCurveTo(x+lean*.2,64-h*.6,x+lean,64-h);g.stroke()}
    return t=new THREE.CanvasTexture(c)}})();
})();
