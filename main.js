'use strict';
const FLOW=[
  {k:'home',day:1},{k:'dream',id:'forest',n:'I',title:'The Hollow Wood',tip:'Gather sticks, light the fire, eat berries, find three paper stars.'},
  {k:'school',day:2},{k:'home',day:2},{k:'dream',id:'yellow',n:'II',title:'The Yellow Rooms',tip:'Find three drawings in the dead ends. Hide in cabinets. Do not run unless you must.'},
  {k:'school',day:3},{k:'home',day:3},{k:'dream',id:'school',n:'III',title:'The Drowned School',tip:'Turn three valves in the dead ends to drain the water.'},
  {k:'school',day:4},{k:'home',day:4},{k:'dream',id:'house',n:'IV',title:'The Endless House',tip:'Silence three televisions. Follow the shouting.'},
  {k:'school',day:5},{k:'home',day:5},{k:'dream',id:'hell',n:'V',title:'The Burning Dark',tip:'Light three braziers. Fire keeps them back.'},
  {k:'finale'}
];
let step=0,busy=false;
const save=()=>{try{localStorage.setItem('hush-step',String(step))}catch(e){}};
const load=()=>{try{return parseInt(localStorage.getItem('hush-step')||'0',10)||0}catch(e){return 0}};

async function realStep(s){
  if(s.k==='school'){await G.card([{t:'Day '+s.day,h:true},{t:'Morning'}],{auto:2600});G.audio.ambience('none');G.buildSchool(s.day)}
  else if(s.k==='home'){if(s.day>1)await G.card([{t:'Evening'}],{auto:1800});G.buildHome()}
  else{await G.card([{t:'Night'}],{auto:1800});G.buildHome()}
  G.running=true;G.paused=false;
  await G.fade(0,1500);
  if(s.k==='finale')await G.real.finale();else await G.real[s.k][s.day]();
  G.running=false;G.paused=true;
}
async function dreamStep(s){
  for(;;){
    await G.card([{t:'Sleep '+s.n},{h:true,t:s.title}],{auto:3400});
    const out=new Promise(res=>{G.finish=r=>{G.finish=null;res(r)}});
    G.dreams[s.id]();
    if(s.id!=='forest')G.reinforce({first:35,every:38,max:s.id==='hell'?3:4,shades:s.id!=='yellow',v:{yellow:1,school:2,house:3,hell:4}[s.id]||0});
    G.running=true;G.paused=false;
    await G.fade(0,1600);
    const r=await out;
    G.running=false;G.paused=true;G.clearSay();try{document.exitPointerLock()}catch(e){}
    if(r==='win'){await G.card([{t:'He wakes.',hi:true}],{auto:1800});return}
    const msg=r==='hunger'?'He was too hungry to go on.':'He caught you.';
    await G.card([{t:msg,hi:true},{t:'You wake gasping, and fall back asleep.'},{t:s.tip}],{min:1200});
  }
}
async function playFrom(i){
  if(busy)return;busy=true;step=i;
  $('title').hidden=true;$('hud').hidden=false;
  G.audio.init();G.paused=true;
  await G.fade(1,700);
  while(step<FLOW.length){
    const s=FLOW[step];save();
    if(s.k==='dream')await dreamStep(s);else await realStep(s);
    step++;
  }
  // the end
  await G.card([{t:'Hush Hollow',h:true},{t:'Part One',hi:true}],{auto:3800});
  await G.card([{t:'Kabir was nine years old.',hi:true},{t:'The dreams were the only place he was ever safe.'}],{auto:5400});
  await G.card([{t:'To be continued...',hi:true},{t:'If violence is part of your home: India, Childline 1098 and Women Helpline 181. Elsewhere, please contact your local emergency or child protection line.'}]);
  step=0;save();busy=false;G.toTitle();
}
G.toTitle=()=>{
  G.audio.ambience('none');
  G.buildHome();G.P.still=true;$('hud').hidden=true;$('cross').hidden=true;
  G.running=false;G.paused=false;
  G.ticks.push((dt,t)=>{G.P.yaw=-Math.PI/2+Math.sin(t*.12)*.5;G.P.pitch=-.08;G.P.x=-2.4;G.P.z=-.2;G.P.eye=1.1});
  $('title').hidden=false;$('fade').style.transition='opacity 1.2s';$('fade').style.opacity=0;
  const sv=load();let c=$('contbtn');
  if(sv>0&&sv<FLOW.length){
    if(!c){c=document.createElement('button');c.id='contbtn';c.className='btn';c.type='button';$('begin').parentNode.insertBefore(c,$('mutebtn'));
      c.addEventListener('click',()=>{G.goFull();playFrom(load())})}
    c.textContent='Continue';c.hidden=false;
  }else if(c)c.hidden=true;
};
$('begin').addEventListener('click',()=>{G.goFull();playFrom(0)});
G.resize();
requestAnimationFrame(G.loop);
(async()=>{
  const bar=$('lbar'),st=$('lst'),t0=Date.now();
  const tick=()=>new Promise(r=>setTimeout(r,420));
  const steps=[['Plastering the walls…',()=>['plaster','concrete','metal','tinroof','wood','cloth'].forEach(n=>G.makeTex(n))],
    ['Laying the floors…',()=>['tile','checker','plank','ground'].forEach(n=>G.makeTex(n))],
    ['Growing the forest…',()=>{['bark','needle','rockg'].forEach(n=>G.makeTex(n));G.frondTex()}],
    ['Painting faces…',()=>{G.cast.mom();G.cast.dad()}],
    ['Lighting the lantern…',()=>{G.toTitle()}]];
  for(let i=0;i<steps.length;i++){st.textContent=steps[i][0];bar.style.width=Math.round(i/steps.length*100)+'%';await tick();try{steps[i][1]()}catch(e){}}
  bar.style.width='100%';st.textContent='';
  await new Promise(r=>setTimeout(r,Math.max(900,6500-(Date.now()-t0))));
  const L=$('loader');L.classList.add('gone');setTimeout(()=>L.remove(),1300);
})();
