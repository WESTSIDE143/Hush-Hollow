'use strict';
G.touch=matchMedia('(pointer:coarse)').matches;
if(G.touch)document.body.classList.add('touch');
G.running=false;G.cardActive=false;G.cardResolve=null;

/* ---------- input ---------- */
const kb={f:0,s:0},tc={f:0,s:0},keys={};let touchRun=false;
function sync(){
  kb.f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  kb.s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  G.in.f=G.clamp(kb.f+tc.f,-1,1);G.in.s=G.clamp(kb.s+tc.s,-1,1);
  G.in.run=!!(keys.ShiftLeft||keys.ShiftRight||touchRun);
}
G.setPause=on=>{
  if(on){if(!G.running)return;G.paused=true;$('pause').hidden=false;try{document.exitPointerLock()}catch(e){}}
  else{$('pause').hidden=true;G.paused=!G.running}
};
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  keys[e.code]=true;
  if(e.code==='KeyE'||e.code==='Enter'){if(G.cardResolve)G.cardResolve();else G.use()}
  if(G.choiceRes&&(e.code==='Digit1'||e.code==='Digit2'))G.choiceRes(e.code==='Digit1'?0:1);
  if(e.code==='KeyF'&&G.flashAllowed&&!G.paused){G.flashOn=!G.flashOn;G.flash.visible=G.flashOn;if(G.sfx)G.sfx.click()}
  if(e.code==='Escape'||e.code==='KeyP'){if($('pause').hidden)G.setPause(true);else G.setPause(false)}
  sync();
});
addEventListener('keyup',e=>{keys[e.code]=false;sync()});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;sync()});

function look(dx,dy){
  if(G.paused||G.P.frozen||G.P.lookT||G.P.lockLook)return;
  G.P.yaw-=dx*.0023;G.P.pitch=G.clamp(G.P.pitch-dy*.0023,-1.25,1.25);
}
let drag=false;
G.canvas.addEventListener('mousedown',e=>{
  if(G.touch||G.paused||G.cardActive)return;
  drag=true;
  if(document.pointerLockElement!==G.canvas){try{const p=G.canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(_){}}
});
addEventListener('mouseup',()=>{drag=false});
addEventListener('mousemove',e=>{if(document.pointerLockElement===G.canvas||drag)look(e.movementX||0,e.movementY||0)});
document.addEventListener('pointerlockchange',()=>{
  if(!document.pointerLockElement&&G.running&&!G.paused&&!G.cardActive&&!G.choiceRes&&!G.touch&&G.lockedOnce)G.setPause(true);
  if(document.pointerLockElement)G.lockedOnce=true;
});

/* touch controls */
{
  const joy=$('joy'),knob=$('knob'),pad=$('lookpad');let jid=null,lid=null,lx=0,ly=0;
  const jv=e=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2);const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}
    knob.style.transform='translate('+dx*36+'px,'+dy*36+'px)';tc.s=dx;tc.f=-dy;sync()};
  joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);jv(e)});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)jv(e)});
  const jend=e=>{if(e.pointerId!==jid)return;jid=null;knob.style.transform='';tc.f=tc.s=0;sync()};
  joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
  pad.addEventListener('pointerdown',e=>{lid=e.pointerId;pad.setPointerCapture(lid);lx=e.clientX;ly=e.clientY});
  pad.addEventListener('pointermove',e=>{if(e.pointerId!==lid)return;look((e.clientX-lx)*1.6,(e.clientY-ly)*1.6);lx=e.clientX;ly=e.clientY});
  const lend=e=>{if(e.pointerId===lid)lid=null};
  pad.addEventListener('pointerup',lend);pad.addEventListener('pointercancel',lend);
  $('bUse').addEventListener('pointerdown',e=>{e.preventDefault();if(G.cardResolve)G.cardResolve();else G.use()});
  $('bRun').addEventListener('pointerdown',e=>{e.preventDefault();touchRun=!touchRun;$('bRun').style.borderColor=touchRun?'#e0a84a':'';sync()});
  $('bPause').addEventListener('pointerdown',e=>{e.preventDefault();G.setPause(true)});
  $('bLight').addEventListener('pointerdown',e=>{e.preventDefault();if(G.flashAllowed&&!G.paused){G.flashOn=!G.flashOn;G.flash.visible=G.flashOn}});
}

/* ---------- text, cards, fades ---------- */
G.wait=async ms=>{let t=0;while(t<ms){await G.sleep(50);if(!G.paused)t+=50}};
G.say=(text,ms=2600,who)=>{
  const box=$('sub'),p=document.createElement('p');
  if(who&&G.speakers&&G.speakers[who])G.speakers[who].userData.talkT=ms/1000*.85;
  if(who){const b=document.createElement('b');b.textContent=who+': ';p.appendChild(b)}
  const s=document.createElement(text[0]==='('?'i':'span');s.textContent=text;p.appendChild(s);
  box.appendChild(p);while(box.children.length>3)box.firstChild.remove();
  return G.wait(ms).then(()=>{p.classList.add('out');setTimeout(()=>p.remove(),600)});
};
G.clearSay=()=>{$('sub').innerHTML=''};
G.card=(lines,o={})=>new Promise(res=>{
  const c=$('card'),inn=c.querySelector('.cardin');inn.innerHTML='';
  for(const l of lines){const el=document.createElement(l.h?'h2':'p');el.textContent=l.t||l;if(l.hi)el.className='hi';inn.appendChild(el)}
  c.querySelector('.hint').hidden=!!o.auto;
  c.hidden=false;G.cardActive=true;G.clearSay();
  let minT=Date.now()+(o.min===undefined?900:o.min),fin=false;
  const done=force=>{if(fin||(!force&&Date.now()<minT))return;fin=true;c.hidden=true;c.onclick=null;G.cardActive=false;G.cardResolve=null;res()};
  G.cardResolve=()=>done(false);c.onclick=()=>done(false);
  if(o.auto)setTimeout(()=>done(true),o.auto);
});
G.fade=(to,ms=800)=>{const f=$('fade');f.style.transition='opacity '+ms+'ms';f.style.opacity=to;return G.sleep(ms)};
G.choice=(a,b)=>new Promise(res=>{
  try{document.exitPointerLock()}catch(e){}
  $('ch0').textContent='1. '+a;$('ch1').textContent='2. '+b;$('choice').hidden=false;
  const pick=i=>{$('choice').hidden=true;G.choiceRes=null;res(i)};
  G.choiceRes=pick;$('ch0').onclick=()=>pick(0);$('ch1').onclick=()=>pick(1);
});
G.obj=t=>{$('obj').innerHTML='';if(!t)return;const s=document.createElement('small');s.textContent='objective';$('obj').appendChild(s);$('obj').appendChild(document.createTextNode(t))};
G.setHunger=v=>{$('mHunger').querySelector('b').style.width=Math.round(G.clamp(v,0,1)*100)+'%'};

/* ---------- title / pause buttons ---------- */
$('resume').addEventListener('click',()=>G.setPause(false));
$('mutebtn').addEventListener('click',()=>{
  G.muted=!G.muted;$('mutebtn').textContent='Sound: '+(G.muted?'off':'on');
  if(G.audio)G.audio.setMuted(G.muted);
});

/* ---------- phone / app niceties ---------- */
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.running&&!G.paused)G.setPause(true)});
addEventListener('contextmenu',e=>e.preventDefault());
G.goFull=()=>{
  if(!G.touch)return;
  try{const el=document.documentElement,f=el.requestFullscreen||el.webkitRequestFullscreen;if(f&&!document.fullscreenElement){const p=f.call(el);if(p&&p.catch)p.catch(()=>{})}}catch(e){}
  try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(()=>{})}catch(e){}
};
