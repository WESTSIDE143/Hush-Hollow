'use strict';
/* Painters for skin, hair and cloth: real-looking faces drawn onto canvases (equirect around the head). */
(()=>{
  const W=1024,H=512,TAU=Math.PI*2;
  const X=a=>(.25+a/TAU)*W,Y=l=>(.5-l/Math.PI)*H;
  const rgb=(c,k=1,a=1)=>'rgba('+Math.max(0,Math.min(255,c[0]*k|0))+','+Math.max(0,Math.min(255,c[1]*k|0))+','+Math.max(0,Math.min(255,c[2]*k|0))+','+a+')';
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  const blur=(g,px)=>{try{g.filter=px?'blur('+px+'px)':'none'}catch(e){}};
  const blob=(g,x,y,rx,ry,col,a,rot=0)=>{g.save();g.translate(x,y);g.rotate(rot);g.scale(rx,ry);const gr=g.createRadialGradient(0,0,0,0,0,1);
    gr.addColorStop(0,col.replace('A',a));gr.addColorStop(1,col.replace('A',0));g.fillStyle=gr;g.beginPath();g.arc(0,0,1,0,TAU);g.fill();g.restore()};
  G.paintFace=o=>{
    const c=cv(W,H),g=c.getContext('2d'),R=G.rng(o.seed||11);
    const sk=o.skin||[196,150,122],hc=o.hair||[26,20,16],mon=!!o.mon,age=o.age||0,tired=o.tired||0;
    const dk=mix(sk,[60,30,24],.55);
    g.fillStyle=rgb(sk);g.fillRect(0,0,W,H);
    // forehead lighter, jaw/neck darker, warm cheeks
    let gr=g.createLinearGradient(0,Y(.9),0,Y(-1.1));gr.addColorStop(0,rgb(sk,1.04));gr.addColorStop(.5,rgb(sk,1));gr.addColorStop(1,rgb(sk,.82));g.fillStyle=gr;g.fillRect(0,0,W,H);
    // mottled skin tone
    blur(g,6);for(let i=0;i<260;i++){const x=R()*W,y=Y(-.9+R()*1.7);blob(g,x,y,18+R()*40,12+R()*26,rgb(R()<.5?[200,110,96]:[150,110,80],1,'A'),.06+R()*.06)}blur(g,0);
    const cheek=o.flush||.3;
    [-1,1].forEach(s=>{
      blur(g,10);
      blob(g,X(s*.68),Y(-.22),70,48,'rgba(205,92,82,A)',cheek*.55);                       // cheek colour
      blob(g,X(s*.43),Y(.0),52,30,rgb(dk,1,'A'),.28+tired*.22);                           // eye socket shade
      blob(g,X(s*.43),Y(-.085),42,12,'rgba(70,40,60,A)',.12+tired*.4);                    // eye bags
      blob(g,X(s*.2),Y(-.1),16,60,rgb(dk,1,'A'),.3);                                      // beside the nose
      blob(g,X(s*.5),Y(-.45),16,62,rgb(dk,.9,'A'),.12+age*.2,s*.5);                       // nasolabial fold
      blob(g,X(s*.78),Y(-.55),60,40,rgb(dk,.9,'A'),.14);                                  // jaw shade
      blur(g,0);
    });
    blur(g,5);blob(g,X(0),Y(.42),120,28,rgb(dk,1,'A'),.18);blob(g,X(0),Y(-.15),24,22,rgb(mix(sk,[255,230,200],.5),1,'A'),.3);blur(g,0);   // brow shade, nose tip highlight
    // ---------- eyes ----------
    [-1,1].forEach(s=>{
      const ex=X(s*.43),ey=Y(.08),rx=30,ry=11.5;
      if(o.noEyes){blur(g,1.5);g.strokeStyle=rgb(mix(hc,[10,6,4],.5),1,.55);g.lineWidth=3;g.beginPath();g.ellipse(ex,ey-1,rx*1.05,ry*1.1,-s*.08,Math.PI*1.04,Math.PI*1.96);g.stroke();blur(g,0)}else{
      g.save();g.translate(ex,ey);g.rotate(-s*.08);
      g.fillStyle=mon?'#050405':rgb([226,218,208]);g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.fill();
      g.save();g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.clip();
      // sclera shading + veins (red-eyed when drunk)
      gr=g.createLinearGradient(0,-ry,0,ry);gr.addColorStop(0,'rgba(60,30,30,.55)');gr.addColorStop(.35,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(120,70,60,.25)');g.fillStyle=gr;g.fillRect(-rx,-ry,rx*2,ry*2);
      if(o.redEye){g.strokeStyle='rgba(176,40,36,.55)';g.lineWidth=.9;for(let i=0;i<9;i++){const a=R()<.5?0:Math.PI,yy=(R()-.5)*ry;g.beginPath();g.moveTo(Math.cos(a)*rx,yy);g.quadraticCurveTo(Math.cos(a)*rx*.6,yy+(R()-.5)*5,Math.cos(a)*rx*(.3+R()*.2),yy*.5);g.stroke()}}
      const ic=o.eye||[86,56,34],ir=ry*.98,lx=s*-2;
      gr=g.createRadialGradient(lx,0,1,lx,0,ir);gr.addColorStop(0,rgb(ic,1.15));gr.addColorStop(.7,rgb(ic,.8));gr.addColorStop(1,rgb(ic,.25));
      g.fillStyle=mon?'#000':gr;g.beginPath();g.arc(lx,1,ir,0,TAU);g.fill();
      if(mon){g.shadowColor=rgb(ic);g.shadowBlur=14;g.fillStyle=rgb(ic);g.beginPath();g.arc(lx,0,4.5,0,TAU);g.fill();g.shadowBlur=0}
      else{g.fillStyle='#050403';g.beginPath();g.arc(lx,1,ir*.42,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.arc(lx-3.5,-2.5,2.2,0,TAU);g.fill()}
      // lid shadow over the top of the eye
      gr=g.createLinearGradient(0,-ry,0,-ry*.2);gr.addColorStop(0,rgb(dk,.5,.8));gr.addColorStop(1,rgb(dk,.5,0));g.fillStyle=gr;g.fillRect(-rx,-ry,rx*2,ry);
      g.restore();
      // lids and lashes
      g.lineCap='round';g.strokeStyle=rgb(mix(hc,[10,6,4],.5),1,.95);g.lineWidth=3.2;g.beginPath();g.ellipse(0,0,rx,ry,0,Math.PI*1.02,Math.PI*1.98);g.stroke();
      g.strokeStyle=rgb(dk,.8,.7);g.lineWidth=1.4;g.beginPath();g.ellipse(0,0,rx,ry,0,.1,Math.PI-.1);g.stroke();
      g.strokeStyle=rgb(dk,.75,.55);g.lineWidth=1.5;g.beginPath();g.ellipse(0,-5,rx*.95,ry*1.1,0,Math.PI*1.1,Math.PI*1.9);g.stroke();   // lid crease
      if(o.lash)for(let i=0;i<10;i++){const a=Math.PI*(1.1+i*.09);g.strokeStyle='rgba(10,6,4,.8)';g.lineWidth=1.3;g.beginPath();g.moveTo(Math.cos(a)*rx,Math.sin(a)*ry);g.lineTo(Math.cos(a)*(rx+3),Math.sin(a)*(ry+5));g.stroke()}
      g.restore();
      }
      // eyebrows: strokes of hair
      const bw=o.brow||1,by=.34;
      for(let i=0;i<150*bw;i++){
        const t=R(),a=s*(.2+t*.5),yy=by+(.1-Math.abs(t-.35)*.28)*(.4)+ (R()-.5)*.035*bw;
        const x=X(a),y=Y(yy),len=8+R()*5;
        g.strokeStyle=rgb(mix(hc,[0,0,0],R()*.3),1,.55+R()*.35);g.lineWidth=1.1;g.beginPath();g.moveTo(x,y);g.lineTo(x+s*len*.9,y-len*(.2+(1-t)*.5)*(t<.35?-1:1)*.5-1);g.stroke()}
    });
    // ---------- nose ----------
    blur(g,1.2);[-1,1].forEach(s=>{g.fillStyle='rgba(30,12,10,.85)';g.beginPath();g.ellipse(X(s*.085),Y(-.235),8.5,5,s*.5,0,TAU);g.fill();
      g.strokeStyle=rgb(dk,.8,.5);g.lineWidth=2;g.beginPath();g.moveTo(X(s*.16),Y(.02));g.quadraticCurveTo(X(s*.2),Y(-.12),X(s*.14),Y(-.24));g.stroke()});blur(g,0);
    // ---------- mouth ----------
    const lipc=mix(sk,o.lip||[150,66,66],.7),mw=.29;
    g.fillStyle=rgb(lipc,.88);g.beginPath();g.moveTo(X(-mw),Y(-.5));g.bezierCurveTo(X(-mw*.5),Y(-.43),X(-.06),Y(-.435),X(0),Y(-.46));g.bezierCurveTo(X(.06),Y(-.435),X(mw*.5),Y(-.43),X(mw),Y(-.5));g.bezierCurveTo(X(mw*.5),Y(-.51),X(-mw*.5),Y(-.51),X(-mw),Y(-.5));g.fill();
    g.fillStyle=rgb(lipc,1.15);g.beginPath();g.moveTo(X(-mw*.95),Y(-.51));g.bezierCurveTo(X(-mw*.5),Y(-.51),X(mw*.5),Y(-.51),X(mw*.95),Y(-.51));g.bezierCurveTo(X(mw*.5),Y(-.64),X(-mw*.5),Y(-.64),X(-mw*.95),Y(-.51));g.fill();
    g.strokeStyle='rgba(40,14,12,.8)';g.lineWidth=2.2;g.lineCap='round';g.beginPath();g.moveTo(X(-mw),Y(-.5)+(o.mouth||0)*5);g.bezierCurveTo(X(-mw*.4),Y(-.515),X(mw*.4),Y(-.515),X(mw),Y(-.5)+(o.mouth||0)*5);g.stroke();
    blur(g,2);blob(g,X(0),Y(-.62),40,10,rgb(dk,1,'A'),.28);blob(g,X(0),Y(-.36),12,16,rgb(dk,1,'A'),.2);blur(g,0);   // under-lip + philtrum
    if(o.cut){g.strokeStyle='rgba(120,20,20,.9)';g.lineWidth=2;g.beginPath();g.moveTo(X(.12),Y(-.52));g.lineTo(X(.15),Y(-.57));g.stroke()}
    // ---------- age lines ----------
    g.strokeStyle=rgb(dk,.8,.18+age*.2);g.lineWidth=1.3;for(let i=0;i<3;i++){g.beginPath();g.moveTo(X(-.4),Y(.55+i*.07));g.quadraticCurveTo(X(0),Y(.58+i*.07),X(.4),Y(.55+i*.07));g.stroke()}
    // ---------- stubble ----------
    if(o.beard){for(let i=0;i<5200*o.beard;i++){const a=(R()-.5)*1.9,l=-.2-R()*.95;
      const e=Math.hypot(a/.85,(l+.62)/.5);if(e>1||(e>.75&&R()<.5))continue;if(Math.abs(a)<.3&&l>-.43&&l<-.36&&R()<.4)continue;
      g.fillStyle=rgb(hc,1,.15+R()*.3);g.fillRect(X(a),Y(l),1.4,1.4)}
      blur(g,6);blob(g,X(0),Y(-.8),210,70,rgb(hc,1,'A'),.2*o.beard);blob(g,X(0),Y(-.5),150,22,rgb(hc,1,'A'),.2*o.beard);blur(g,0)}
    // ---------- bruise ----------
    if(o.bruise){blur(g,5);blob(g,X(.66),Y(-.02),66,48,'rgba(88,40,90,A)',.7*o.bruise);blob(g,X(.66),Y(-.02),92,66,'rgba(150,130,40,A)',.3*o.bruise);blob(g,X(.5),Y(.1),30,20,'rgba(110,30,40,A)',.5*o.bruise);blur(g,0)}
    // ---------- skin pores / grain ----------
    for(let i=0;i<9000;i++){g.fillStyle='rgba('+(R()<.5?'40,20,16':'255,230,210')+','+(.04+R()*.07)+')';g.fillRect(R()*W,R()*H,1.3,1.3)}
    // ---------- hair on the scalp (the hair mesh adds volume) ----------
    if(o.hairStyle!=='none'){
      const part=o.part||.12,rec=o.recede||0,hb=o.hairStyle==='bald'?1:0;
      for(let x=0;x<W;x+=1){
        const a=(x/W-.25)*TAU,aa=((a+Math.PI)%TAU+TAU)%TAU-Math.PI,ab=Math.abs(aa);let lat;
        if(ab<1.45)lat=(.7-rec*.2+.1*Math.pow(ab/1.45,2))-(ab>1.15?(ab-1.15)*1.6:0)+(o.fringe?-.3*Math.max(0,1-ab/1.0):0);
        else lat=-.55;
        if(hb&&ab<1.7)lat=Math.max(lat,.9);
        g.fillStyle=rgb(hc,.85);g.fillRect(x,0,1,Y(lat));
      }
      for(let i=0;i<2600;i++){const x=R()*W,y=R()*Y(.35),a=(x/W-.25)*TAU,aa=((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
        if(Math.abs(aa)<1.45&&y>Y(.7-rec*.2+.1*Math.pow(Math.abs(aa)/1.45,2)))continue;
        g.strokeStyle=rgb(hc,.5+R()*1.1,.35+R()*.4);g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+(R()-.5)*3,y+10+R()*20);g.stroke()}
    }
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  };
  G.paintHair=(hc)=>{
    const c=cv(128,128),g=c.getContext('2d'),R=G.rng(5);
    g.fillStyle=rgb(hc,.75);g.fillRect(0,0,128,128);
    for(let i=0;i<900;i++){const x=R()*128;g.strokeStyle=rgb(hc,.4+R()*1.4,.5+R()*.4);g.lineWidth=.6+R()*.9;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+(R()-.5)*8,40,x+(R()-.5)*10,90,x+(R()-.5)*6,128);g.stroke()}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
  };
  /* cloth: weave + optional stripes/pattern + fold shading + grime; u around, v up the garment */
  G.paintCloth=o=>{
    const S=256,c=cv(S,S),g=c.getContext('2d'),R=G.rng(o.seed||3),base=o.color||[90,70,70];
    g.fillStyle=rgb(base);g.fillRect(0,0,S,S);
    if(o.stripes){const [c1,c2]=o.stripes,n=o.bands||14,h=S/n;for(let i=0;i<n;i++){g.fillStyle=rgb(i%2?c1:c2);g.fillRect(0,i*h,S,h*(o.duty||.55))}}
    if(o.pattern==='floral'){for(let i=0;i<60;i++){const x=R()*S,y=R()*S;g.fillStyle=rgb(o.pat||[210,170,90],.7+R()*.5,.85);for(let k=0;k<5;k++){g.beginPath();g.arc(x+Math.cos(k*1.256)*3.5,y+Math.sin(k*1.256)*3.5,2.6,0,TAU);g.fill()}}}
    // knit / weave
    for(let y=0;y<S;y+=2)for(let x=0;x<S;x+=2){const v=((x+y)%4===0)?.1:((x*7+y*13)%5===0?-.06:0);g.fillStyle=v>0?'rgba(255,255,255,'+v+')':'rgba(0,0,0,'+-v+')';g.fillRect(x,y,2,2)}
    for(let i=0;i<5200;i++){g.fillStyle='rgba('+(R()<.5?'0,0,0':'255,255,255')+','+(R()*.07)+')';g.fillRect(R()*S,R()*S,1,1)}
    // vertical folds
    for(let i=0;i<9;i++){const x=R()*S;gr=g.createLinearGradient(x-14,0,x+14,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.5,'rgba(0,0,0,'+(.12+R()*.16)+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-14,0,28,S)}
    for(let i=0;i<10;i++){blob(g,R()*S,R()*S,20+R()*40,12+R()*24,'rgba(30,22,14,A)',.1+R()*.2)}  // grime & stains
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
  };
  var gr;
})();
